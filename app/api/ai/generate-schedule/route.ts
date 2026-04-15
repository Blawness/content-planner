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
    const prompt = generateSchedulePrompt(maxPosts, platform, nicheContext, contentIdea, maxWeeks, monthLabel);

    const model = await getActiveAiModel();
    const aiContent = await openRouterChat([
      { role: 'user', content: prompt }
    ], model);

    // Save history
    await prisma.aiRequest.create({
      data: {
        userId,
        prompt,
        response: aiContent,
      },
    });

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiContent);
      if (!Array.isArray(jsonResponse) && jsonResponse.schedule) {
        jsonResponse = jsonResponse.schedule;
      } else if (!Array.isArray(jsonResponse) && jsonResponse.rows) {
        jsonResponse = jsonResponse.rows;
      }
    } catch (e) {
      console.error("Failed to parse AI JSON for schedule:", aiContent);
      return NextResponse.json(
        { message: 'AI returned invalid JSON format', raw: aiContent },
        { status: 500 }
      );
    }

    if (!Array.isArray(jsonResponse)) {
      return NextResponse.json(
        { message: 'AI returned invalid schedule payload', raw: jsonResponse },
        { status: 500 }
      );
    }

    const normalizedSchedule = jsonResponse.map(normalizeRow);
    const groupedByWeek = normalizedSchedule.reduce<Record<string, ContentPlanRow[]>>((acc, row) => {
      const weekLabel = row.week_label || 'Minggu 1';
      if (!acc[weekLabel]) acc[weekLabel] = [];
      acc[weekLabel].push(row);
      return acc;
    }, {});

    return NextResponse.json({ schedule: normalizedSchedule, weeks: groupedByWeek });
  } catch (e) {
    console.error("Error in generate-schedule:", e);
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
