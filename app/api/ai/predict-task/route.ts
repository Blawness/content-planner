import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { predictTaskPrompt } from '@/lib/prompts';
import { openRouterChat } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);
    const body = await request.json();

    const { taskId, taskTitle } = body;

    // We can use either taskId (and fetch from DB) or just direct taskTitle
    let titleToPredict = taskTitle;

    if (!titleToPredict && taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task) {
        titleToPredict = task.title;
      }
    }

    if (!titleToPredict) {
      return NextResponse.json(
        { message: 'Missing required field: taskTitle or taskId' },
        { status: 400 }
      );
    }

    const prompt = predictTaskPrompt(titleToPredict);

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
    } catch (e) {
      console.error("Failed to parse AI JSON for prediction:", aiContent);
      return NextResponse.json(
        { message: 'AI returned invalid JSON format', raw: aiContent },
        { status: 500 }
      );
    }

    // Expecting jsonResponse to have { predictedHours, confidence }
    return NextResponse.json(jsonResponse);
  } catch (e) {
    console.error("Error in predict-task:", e);
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
