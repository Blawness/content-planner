import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateContentPrompt } from '@/lib/prompts';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);

    const rl = checkRateLimit(`generate-content:${userId}`, 10, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const body = await request.json();

    const { niche, platform, goal, target_audience: targetAudience, count = 3 } = body;

    if (!niche || !platform || !goal || !targetAudience) {
      return NextResponse.json(
        { message: 'Missing required fields: niche, platform, goal, target_audience' },
        { status: 400 }
      );
    }

    const maxCount = Math.min(Math.max(Number(count) || 3, 1), 10);
    const prompt = generateContentPrompt(
      String(niche).slice(0, 200),
      String(platform).slice(0, 100),
      String(goal).slice(0, 200),
      String(targetAudience).slice(0, 300),
      maxCount
    );

    const model = await getActiveAiModel();
    const aiContent = await openRouterChat([{ role: 'user', content: prompt }], model);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiContent);
      if (!Array.isArray(jsonResponse) && jsonResponse.ideas) {
        jsonResponse = jsonResponse.ideas;
      }
    } catch {
      console.error('Failed to parse AI JSON:', aiContent);
      return NextResponse.json(
        { message: 'AI returned invalid JSON format', raw: aiContent },
        { status: 500 }
      );
    }

    return NextResponse.json({ ideas: jsonResponse });
  } catch (e) {
    console.error('Error in generate-content:', e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
