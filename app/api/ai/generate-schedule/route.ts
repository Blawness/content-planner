import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';
import { generateScheduleRows } from '@/lib/ai/schedule-generator';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);

    const rl = checkRateLimit(`generate-schedule:${userId}`, 5, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)
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

    const schedule = await generateScheduleRows(
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
      }
    );

    const groupedByWeek = schedule.reduce<Record<string, typeof schedule>>((acc, row) => {
      const key = row.week_label || 'Minggu 1';
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    return NextResponse.json({ schedule, weeks: groupedByWeek });
  } catch (error) {
    console.error('Error in generate-schedule:', error);
    if (error instanceof Response) return error;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
