import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';
import { generateScheduleRows } from '@/lib/ai/schedule-generator';

export async function POST(request: NextRequest) {
  try {
    const { sub: userId } = await requireAuth(request);
    const body = await request.json();

    const {
      content_per_week: contentPerWeek = 3,
      platform,
      niche,
      theme,
      content_idea: contentIdea,
      month_label: monthLabel,
      duration_weeks: durationWeeks = 4,
      start_date: startDate,
      tone,
      target_audience: targetAudience,
    } = body;

    const nicheContext = niche || theme;

    if (!platform || !nicheContext) {
      return NextResponse.json(
        { message: 'Missing required fields: platform, niche' },
        { status: 400 }
      );
    }

    let model: string;
    try {
      model = await getActiveAiModel();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get AI model';
      return NextResponse.json(
        { message: `AI model error: ${errorMsg}` },
        { status: 503 }
      );
    }

    const maxWeeks = Math.min(Math.max(durationWeeks, 1), 12);
    const maxPosts = Math.min(Math.max(contentPerWeek, 1), 14);
    const totalItems = maxWeeks * maxPosts;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          sendEvent({ type: 'start', total: totalItems });

          const rows = await generateScheduleRows(
            {
              contentPerWeek,
              platform,
              niche: nicheContext,
              contentIdea,
              monthLabel,
              durationWeeks,
              startDate,
              tone,
              targetAudience,
            },
            {
              callAi: async (prompt: string) => openRouterChat([{ role: 'user', content: prompt }], model),
              onProgress: (event) => {
                sendEvent({
                  type: 'progress',
                  phase: event.phase,
                  message: event.message,
                  generated: event.generated,
                  total: event.total,
                });
              },
              onItem: (item, count, total) => {
                sendEvent({ type: 'item', data: item, count, total });
              },
            }
          );

          sendEvent({
            type: 'complete',
            total: rows.length,
            message: `Selesai! Generated ${rows.length}/${totalItems} konten`,
          });

          controller.close();
        } catch (error) {
          console.error('Error in generate-schedule-stream:', error);
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Internal Server Error',
          });
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Error in generate-schedule-stream:', error);
    if (error instanceof Response) return error;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
