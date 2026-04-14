import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { openRouterChat } from '@/lib/openrouter';
import { getActiveAiModel } from '@/lib/ai-settings';

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);
    const body = await request.json();

    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { message: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const model = await getActiveAiModel();

    const systemPrompt = {
      role: 'system',
      content:
        'You are an AI assistant specialized in social media strategy and content creation. Help the user plan, analyze, and create better content.',
    };

    const messages = [systemPrompt, ...history, { role: 'user', content: message }];

    const aiContent = await openRouterChat(messages, model, false);

    await prisma.aiRequest.create({
      data: {
        userId,
        prompt: message,
        response: aiContent,
      },
    });

    return NextResponse.json({ response: aiContent, model });
  } catch (e) {
    console.error('Error in ai chat:', e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
