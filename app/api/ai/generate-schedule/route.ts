import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateSchedulePrompt } from '@/lib/prompts';
import { openRouterChat } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);
    const body = await request.json();

    const { content_per_week: contentPerWeek = 3, platform, theme, duration_weeks: durationWeeks = 4 } = body;

    if (!platform || !theme) {
      return NextResponse.json(
        { message: 'Missing required fields: platform, theme' },
        { status: 400 }
      );
    }

    const maxWeeks = Math.min(Math.max(durationWeeks, 1), 12);
    const maxPosts = Math.min(Math.max(contentPerWeek, 1), 14);
    const prompt = generateSchedulePrompt(maxPosts, platform, theme, maxWeeks);

    const aiContent = await openRouterChat([
      { role: 'user', content: prompt }
    ]);

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
      }
    } catch (e) {
      console.error("Failed to parse AI JSON for schedule:", aiContent);
      return NextResponse.json(
        { message: 'AI returned invalid JSON format', raw: aiContent },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule: jsonResponse });
  } catch (e) {
    console.error("Error in generate-schedule:", e);
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
