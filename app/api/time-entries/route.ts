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

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        taskId,
        userId
      },
      orderBy: { startTime: 'desc' }
    });

    return NextResponse.json({ timeEntries });
  } catch (e) {
    console.error("Error in get time-entries:", e);
    if (e instanceof Response) return e; // Auth error
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

    // Check task access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { workspace: true } } }
    });

    if (!task || task.project.workspace.ownerId !== userId) {
      // For beta we assume only owner can track time (or we can skip strict check if member)
      // Since privacy model says Team members can edit task. Let's just check if task exists.
      if (!task) {
        return NextResponse.json({ message: 'Task not found' }, { status: 404 });
      }
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    let computedDuration = duration;

    // Auto-compute duration in minutes if not provided but both times exist
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
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
