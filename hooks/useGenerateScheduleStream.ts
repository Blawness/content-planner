import { useCallback, useRef } from 'react';
import type { ContentPlanRow } from '@/types';

type StreamEvent =
  | { type: 'start'; total: number }
  | { type: 'progress'; message: string; generated: number; total: number }
  | { type: 'item'; data: ContentPlanRow; count: number; total: number }
  | { type: 'complete'; total: number; message: string }
  | { type: 'error'; message: string };

type StreamCallbacks = {
  onStart?: (total: number) => void;
  onProgress?: (message: string, generated: number, total: number) => void;
  onItem?: (item: ContentPlanRow, count: number, total: number) => void;
  onComplete?: (total: number, message: string) => void;
  onError?: (message: string) => void;
};

export function useGenerateScheduleStream() {
  const eventSourceRef = useRef<EventSource | null>(null);

  const generateScheduleStream = useCallback(
    async (payload: Record<string, unknown>, token: string | null, callbacks: StreamCallbacks) => {
      return new Promise<void>((resolve, reject) => {
        try {
          if (!token) {
            callbacks.onError?.('No authentication token');
            reject(new Error('No auth token'));
            return;
          }

          // Close existing connection if any
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }

          // Make POST request to initiate stream
          fetch('/api/ai/generate-schedule-stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              // Create a reader for the response
              const reader = response.body?.getReader();
              if (!reader) {
                throw new Error('No response body');
              }

              const decoder = new TextDecoder();
              let buffer = '';

              const read = async () => {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');

                    // Keep the last incomplete line in buffer
                    buffer = lines[lines.length - 1];

                    for (let i = 0; i < lines.length - 1; i++) {
                      const line = lines[i];

                      if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        try {
                          const event: StreamEvent = JSON.parse(jsonStr);

                          switch (event.type) {
                            case 'start':
                              callbacks.onStart?.(event.total);
                              break;
                            case 'progress':
                              callbacks.onProgress?.(event.message, event.generated, event.total);
                              break;
                            case 'item':
                              callbacks.onItem?.(event.data, event.count, event.total);
                              break;
                            case 'complete':
                              callbacks.onComplete?.(event.total, event.message);
                              resolve();
                              break;
                            case 'error':
                              callbacks.onError?.(event.message);
                              reject(new Error(event.message));
                              break;
                          }
                        } catch (e) {
                          console.error('Failed to parse SSE event:', jsonStr, e);
                        }
                      }
                    }
                  }

                  // Process any remaining buffer
                  if (buffer && buffer.startsWith('data: ')) {
                    const jsonStr = buffer.slice(6);
                    try {
                      const event: StreamEvent = JSON.parse(jsonStr);
                      if (event.type === 'complete') {
                        callbacks.onComplete?.(event.total, event.message);
                        resolve();
                      } else if (event.type === 'error') {
                        callbacks.onError?.(event.message);
                        reject(new Error(event.message));
                      }
                    } catch (e) {
                      console.error('Failed to parse final SSE event:', buffer, e);
                    }
                  }
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Stream error';
                  callbacks.onError?.(message);
                  reject(error);
                }
              };

              read();
            })
            .catch((error) => {
              const message = error instanceof Error ? error.message : 'Network error';
              callbacks.onError?.(message);
              reject(error);
            });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          callbacks.onError?.(message);
          reject(error);
        }
      });
    },
    []
  );

  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return { generateScheduleStream, cancel };
}
