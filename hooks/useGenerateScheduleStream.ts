import { useCallback } from 'react';
import type { ContentPlanRow } from '@/types';

type StreamEvent =
  | { type: 'start'; total: number }
  | { type: 'progress'; phase?: 'idea_generation' | 'detail_expansion'; message: string; generated: number; total: number }
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
  const generateScheduleStream = useCallback(
    async (payload: Record<string, unknown>, token: string | null, callbacks: StreamCallbacks) => {
      return new Promise<void>((resolve, reject) => {
        if (!token) {
          callbacks.onError?.('No authentication token');
          reject(new Error('No auth token'));
          return;
        }

        fetch('/api/ai/generate-schedule-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';

            const processEvent = (event: StreamEvent) => {
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
            };

            const tryParse = (raw: string) => {
              if (!raw.startsWith('data: ')) return;
              try {
                processEvent(JSON.parse(raw.slice(6)) as StreamEvent);
              } catch {
                console.error('Failed to parse SSE event:', raw);
              }
            };

            const read = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines[lines.length - 1];
                  for (let i = 0; i < lines.length - 1; i++) tryParse(lines[i]);
                }
                if (buffer) tryParse(buffer);
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Stream error';
                callbacks.onError?.(message);
                reject(error);
              }
            };

            read();
          })
          .catch((error) => {
            callbacks.onError?.(error instanceof Error ? error.message : 'Network error');
            reject(error);
          });
      });
    },
    []
  );

  return { generateScheduleStream };
}
