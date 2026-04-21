import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateContentPrompt } from '@/lib/prompts';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);
    const body = await request.json();

    const { niche, platform, goal, target_audience: targetAudience, count = 3 } = body;

    if (!niche || !platform || !goal || !targetAudience) {
      return NextResponse.json(
        { message: 'Missing required fields: niche, platform, goal, target_audience' },
        { status: 400 }
      );
    }

    const maxCount = Math.min(Math.max(count, 1), 10);
    const prompt = generateContentPrompt(niche, platform, goal, targetAudience, maxCount);

    const model = await getActiveAiModel();
    const aiContent = await openRouterChat([
      { role: 'user', content: prompt }
    ], model);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiContent);
      // It might return an object like { "ideas": [...] } instead of array directly
      if (!Array.isArray(jsonResponse) && jsonResponse.ideas) {
        jsonResponse = jsonResponse.ideas;
      }
    } catch {
      console.error("Failed to parse AI JSON:", aiContent);
      return NextResponse.json(
        { message: 'AI returned invalid JSON format', raw: aiContent },
        { status: 500 }
      );
    }

    return NextResponse.json({ ideas: jsonResponse });
  } catch (e) {
    console.error("Error in generate-content:", e);
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
