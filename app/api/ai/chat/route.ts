import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { openRouterChat } from '@/lib/openrouter';

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

    const systemPrompt = {
      role: 'system',
      content: 'You are an AI assistant specialized in social media strategy and content creation. Help the user plan, analyze, and create better content.',
    };

    const messages = [
      systemPrompt,
      ...history,
      { role: 'user', content: message }
    ];

    // Disable json requirement for chat
    const aiContent = await openRouterChat(messages, 'google/gemini-2.5-flash', false);

    // Save history
    await prisma.aiRequest.create({
      data: {
        userId,
        prompt: message, // saving the latest message as the prompt
        response: aiContent,
      },
    });

    return NextResponse.json({ response: aiContent });
  } catch (e) {
    console.error("Error in ai chat:", e);
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
