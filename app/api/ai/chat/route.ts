import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);

    const rl = checkRateLimit(`chat:${userId}`, 20, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { message: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.slice(0, 2000);
    const safeHistory = Array.isArray(history)
      ? history.slice(-20).map((h: { role: string; content: string }) => ({
          role: String(h.role),
          content: String(h.content).slice(0, 2000),
        }))
      : [];

    const model = await getActiveAiModel();

    const systemPrompt = {
      role: 'system',
      content:
        'You are an AI assistant specialized in social media strategy and content creation. Help the user plan, analyze, and create better content.',
    };

    const messages = [systemPrompt, ...safeHistory, { role: 'user', content: trimmedMessage }];
    const startedAt = Date.now();
    const aiContent = await openRouterChat(messages, model, false);
    const responseTimeMs = Date.now() - startedAt;

    return NextResponse.json({ response: aiContent, model, responseTimeMs });
  } catch (e) {
    console.error('Error in ai chat:', e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
