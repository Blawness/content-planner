import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateSchedulePrompt } from '@/lib/prompts';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';
import type { ContentPlanRow } from '@/types';

function toStringValue(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function normalizeRow(row: unknown): ContentPlanRow {
  const source = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
  return {
    week_label: toStringValue(source.week_label, 'Minggu 1'),
    date: toStringValue(source.date, '-'),
    day: toStringValue(source.day, '-'),
    topic: toStringValue(source.topic, '-'),
    format: toStringValue(source.format, 'Single Post'),
    headline: toStringValue(source.headline, '-'),
    visual_description: toStringValue(source.visual_description, '-'),
    content_body: toStringValue(source.content_body, '-'),
    hook_caption: toStringValue(source.hook_caption, '-'),
    scheduled_time: toStringValue(source.scheduled_time, '10:00 WIB'),
    status: toStringValue(source.status, 'To Do'),
    notes: toStringValue(source.notes, 'Baru'),
  };
}

function parseAiResponse(aiContent: string): ContentPlanRow[] {
  let jsonResponse;
  try {
    jsonResponse = JSON.parse(aiContent);

    if (jsonResponse.schedule && Array.isArray(jsonResponse.schedule)) {
      jsonResponse = jsonResponse.schedule;
    } else if (jsonResponse.rows && Array.isArray(jsonResponse.rows)) {
      jsonResponse = jsonResponse.rows;
    } else if (!Array.isArray(jsonResponse)) {
      const requiredKeys = ['week_label', 'date', 'day', 'topic', 'format', 'headline'];
      const hasRequiredKeys = requiredKeys.some(key => key in jsonResponse);

      if (hasRequiredKeys && typeof jsonResponse === 'object') {
        jsonResponse = [jsonResponse];
      }
    }
  } catch (e) {
    console.error("Failed to parse AI JSON for schedule:", aiContent);
    throw new Error(`JSON parse error: ${e instanceof Error ? e.message : 'Unknown'}`);
  }

  if (!Array.isArray(jsonResponse)) {
    throw new Error(`AI returned invalid payload - expected array, got ${typeof jsonResponse}`);
  }

  return jsonResponse.map(normalizeRow);
}

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
    } = body;
    const nicheContext = niche || theme;

    if (!platform || !nicheContext) {
      return NextResponse.json(
        { message: 'Missing required fields: platform, niche' },
        { status: 400 }
      );
    }

    const maxWeeks = Math.min(Math.max(durationWeeks, 1), 12);
    const maxPosts = Math.min(Math.max(contentPerWeek, 1), 14);
    const totalItems = maxWeeks * maxPosts;

    let model: string;
    try {
      model = await getActiveAiModel();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to get AI model';
      console.error("Error getting AI model:", errorMsg);
      return NextResponse.json(
        { message: `AI model error: ${errorMsg}` },
        { status: 503 }
      );
    }

    // Create encoder for streaming
    const encoder = new TextEncoder();

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          console.log(`Starting stream: target ${totalItems} items, ${maxPosts} per week, ${maxWeeks} weeks`);

          const normalizedSchedule: ContentPlanRow[] = [];
          const MAX_REQUESTS = 20;
          let requestCount = 0;
          let weekIndex = 0;
          let itemsPerRequest = Math.max(1, Math.floor(maxPosts / 2));

          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', total: totalItems })}\n\n`)
          );

          while (normalizedSchedule.length < totalItems && requestCount < MAX_REQUESTS) {
            requestCount++;

            const itemsNeeded = totalItems - normalizedSchedule.length;
            const weeksNeeded = Math.ceil(itemsNeeded / maxPosts);
            const currentWeek = Math.min(weekIndex + 1, maxWeeks);
            const weeksForThisRequest = Math.ceil(itemsNeeded / itemsPerRequest / maxPosts) || 1;
            const endWeek = Math.min(currentWeek + weeksForThisRequest - 1, maxWeeks);

            console.log(`Request ${requestCount}: need ${itemsNeeded} items`);

            // Send progress update
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                message: `Generating request ${requestCount}...`,
                generated: normalizedSchedule.length,
                total: totalItems
              })}\n\n`)
            );

            const prompt = generateSchedulePrompt(
              itemsPerRequest,
              platform,
              nicheContext,
              contentIdea,
              Math.max(1, endWeek - currentWeek + 1),
              monthLabel ? `${monthLabel} (Minggu ${currentWeek}-${endWeek})` : undefined
            );

            let aiContent: string;
            try {
              aiContent = await openRouterChat([
                { role: 'user', content: prompt }
              ], model);
            } catch (e) {
              const errorMsg = e instanceof Error ? e.message : 'Failed to call OpenRouter API';
              console.error(`Error in request ${requestCount}:`, errorMsg);

              if (normalizedSchedule.length > 0) {
                console.log(`Returning ${normalizedSchedule.length} items generated so far`);
                break;
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'error',
                  message: `OpenRouter API error: ${errorMsg}`
                })}\n\n`)
              );
              controller.close();
              return;
            }

            // Save history
            try {
              await prisma.aiRequest.create({
                data: {
                  userId,
                  prompt,
                  response: aiContent,
                },
              });
            } catch (e) {
              console.error("Error saving AI request:", e instanceof Error ? e.message : 'Unknown');
            }

            // Parse and stream each item
            try {
              const batchRows = parseAiResponse(aiContent);

              for (const row of batchRows) {
                normalizedSchedule.push(row);

                // Send each new item to client
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'item',
                    data: row,
                    count: normalizedSchedule.length,
                    total: totalItems
                  })}\n\n`)
                );

                // Small delay for visual feedback (optional)
                await new Promise(resolve => setTimeout(resolve, 100));
              }

              console.log(`Request ${requestCount}: added ${batchRows.length} items, total: ${normalizedSchedule.length}`);

              weekIndex = endWeek;

              if (batchRows.length < itemsPerRequest && itemsPerRequest > 1) {
                itemsPerRequest = 1;
              } else if (batchRows.length === itemsPerRequest && itemsPerRequest < maxPosts) {
                itemsPerRequest = Math.min(itemsPerRequest + 1, maxPosts);
              }
            } catch (e) {
              const errorMsg = e instanceof Error ? e.message : 'Unknown parse error';
              console.error(`Error parsing request ${requestCount}:`, errorMsg);

              if (normalizedSchedule.length > 0) {
                console.log(`Continuing with ${normalizedSchedule.length} items generated`);
                break;
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'error',
                  message: `Parse error: ${errorMsg}`
                })}\n\n`)
              );
              controller.close();
              return;
            }
          }

          if (requestCount >= MAX_REQUESTS) {
            console.warn(`Reached max requests, generated ${normalizedSchedule.length}/${totalItems}`);
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              total: normalizedSchedule.length,
              message: `Selesai! Generated ${normalizedSchedule.length}/${totalItems} konten`
            })}\n\n`)
          );

          controller.close();
        } catch (e) {
          console.error("Error in stream:", e);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: `Server error: ${e instanceof Error ? e.message : 'Unknown'}`
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new NextResponse(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    console.error("Error in generate-schedule-stream:", e);
    if (e instanceof Response) return e;
    const errorMsg = e instanceof Error ? e.message : 'Internal Server Error';
    return NextResponse.json(
      { message: errorMsg },
      { status: 500 }
    );
  }
}
