import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateSchedulePrompt } from '@/lib/prompts';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';

type ContentPlanRow = {
  week_label: string;
  date: string;
  day: string;
  topic: string;
  format: string;
  headline: string;
  visual_description: string;
  content_body: string;
  hook_caption: string;
  scheduled_time: string;
  status: string;
  notes: string;
};

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

    // Handle different response formats
    if (jsonResponse.schedule && Array.isArray(jsonResponse.schedule)) {
      jsonResponse = jsonResponse.schedule;
    } else if (jsonResponse.rows && Array.isArray(jsonResponse.rows)) {
      jsonResponse = jsonResponse.rows;
    } else if (!Array.isArray(jsonResponse)) {
      // Check if it's a single ContentPlanRow object (has the required keys)
      const requiredKeys = ['week_label', 'date', 'day', 'topic', 'format', 'headline'];
      const hasRequiredKeys = requiredKeys.some(key => key in jsonResponse);

      if (hasRequiredKeys && typeof jsonResponse === 'object') {
        // It's a single row, wrap it in an array
        console.log("AI returned single object, wrapping in array");
        jsonResponse = [jsonResponse];
      }
    }
  } catch (e) {
    console.error("Failed to parse AI JSON for schedule:", aiContent);
    throw new Error(`JSON parse error: ${e instanceof Error ? e.message : 'Unknown'}`);
  }

  if (!Array.isArray(jsonResponse)) {
    console.error("AI response is not an array:", typeof jsonResponse, Object.keys(jsonResponse || {}));
    throw new Error(`AI returned invalid payload - expected array, got ${typeof jsonResponse}`);
  }

  return jsonResponse.map(normalizeRow);
}

export async function POST(request: Request) {
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

    console.log(`Starting aggressive loop: target ${totalItems} items, ${maxPosts} per week, ${maxWeeks} weeks`);

    // Aggressive loop strategy: request with small batches (2-3 items per request)
    const normalizedSchedule: ContentPlanRow[] = [];
    const MAX_REQUESTS = 20; // Safety limit
    let requestCount = 0;
    let weekIndex = 0; // Track which weeks we've generated
    let itemsPerRequest = Math.max(2, Math.floor(maxPosts / 2)); // 2-3 items per request

    while (normalizedSchedule.length < totalItems && requestCount < MAX_REQUESTS) {
      requestCount++;

      // Calculate weeks for this iteration
      const itemsNeeded = totalItems - normalizedSchedule.length;
      const weeksNeeded = Math.ceil(itemsNeeded / maxPosts);
      const currentWeek = Math.min(weekIndex + 1, maxWeeks);
      const weeksForThisRequest = Math.ceil(itemsNeeded / itemsPerRequest / maxPosts) || 1;
      const endWeek = Math.min(currentWeek + weeksForThisRequest - 1, maxWeeks);

      console.log(`Request ${requestCount}: need ${itemsNeeded} items, requesting ${itemsPerRequest} items for weeks ${currentWeek}-${endWeek}`);

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
        console.error(`Error in request ${requestCount} calling OpenRouter:`, errorMsg);

        // If we already have some items, return what we have
        if (normalizedSchedule.length > 0) {
          console.log(`Returning ${normalizedSchedule.length} items generated so far`);
          break;
        }

        return NextResponse.json(
          {
            message: `OpenRouter API error: ${errorMsg}`,
            request: requestCount,
            itemsGenerated: normalizedSchedule.length
          },
          { status: 503 }
        );
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
        // Continue anyway
      }

      // Parse response
      try {
        const batchRows = parseAiResponse(aiContent);
        normalizedSchedule.push(...batchRows);
        console.log(`Request ${requestCount}: parsed ${batchRows.length} items, total now: ${normalizedSchedule.length}`);

        // Advance week index
        weekIndex = endWeek;

        // If AI only returned 1 item when we asked for more, reduce batch size
        if (batchRows.length < itemsPerRequest && itemsPerRequest > 1) {
          itemsPerRequest = 1;
          console.log("AI returned fewer items, reducing batch size to 1");
        } else if (batchRows.length === itemsPerRequest && itemsPerRequest < maxPosts) {
          // If AI returned what we asked for, we can try asking for more next time
          itemsPerRequest = Math.min(itemsPerRequest + 1, maxPosts);
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown parse error';
        console.error(`Error parsing request ${requestCount}:`, errorMsg);

        // If we have some items, return them
        if (normalizedSchedule.length > 0) {
          console.log(`Returning ${normalizedSchedule.length} items generated so far (${totalItems} requested)`);
          break;
        }

        return NextResponse.json(
          {
            message: `Parse error: ${errorMsg}`,
            request: requestCount,
            raw: aiContent?.substring(0, 300)
          },
          { status: 500 }
        );
      }
    }

    if (requestCount >= MAX_REQUESTS) {
      console.warn(`Reached max requests (${MAX_REQUESTS}), generated ${normalizedSchedule.length}/${totalItems} items`);
    }

    const groupedByWeek = normalizedSchedule.reduce<Record<string, ContentPlanRow[]>>((acc, row) => {
      const weekLabel = row.week_label || 'Minggu 1';
      if (!acc[weekLabel]) acc[weekLabel] = [];
      acc[weekLabel].push(row);
      return acc;
    }, {});

    console.log(`Completed: ${requestCount} requests, ${normalizedSchedule.length}/${totalItems} items generated`);
    return NextResponse.json({ schedule: normalizedSchedule, weeks: groupedByWeek });
  } catch (e) {
    console.error("Error in generate-schedule:", e);
    if (e instanceof Response) return e; // Auth error
    const errorMsg = e instanceof Error ? e.message : 'Internal Server Error';
    console.error("Stack trace:", e instanceof Error ? e.stack : 'No stack trace');
    return NextResponse.json(
      {
        message: errorMsg,
        type: e?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}
