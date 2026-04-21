import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ message: 'taskId is required' }, { status: 400 });
    }

    // Verify task belongs to user's project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { userId: true } } }
    });

    if (!task || task.project.userId !== userId) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    // Get time entries for this task
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        taskId,
        userId,
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json({ timeEntries });
  } catch (e) {
    console.error("Error in get time-entries:", e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);
    const body = await request.json();
    const { taskId, startTime, endTime, duration } = body;

    if (!taskId || !startTime) {
      return NextResponse.json({ message: 'taskId and startTime are required' }, { status: 400 });
    }

    // Verify task belongs to user's project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { userId: true } } }
    });

    if (!task || task.project.userId !== userId) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    let computedDuration = duration;

    if (end && !computedDuration) {
      computedDuration = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    const newEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        startTime: start,
        endTime: end,
        duration: computedDuration
      }
    });

    return NextResponse.json({ timeEntry: newEntry });
  } catch (e) {
    console.error("Error in post time-entries:", e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
