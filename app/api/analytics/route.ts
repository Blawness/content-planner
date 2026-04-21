import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);

    // Get completed tasks from user's projects
    const completedTasksCount = await prisma.task.count({
      where: {
        project: { userId },
        status: 'DONE',
      }
    });

    // Get time entries from user's projects
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        task: {
          project: { userId }
        },
        duration: { not: null }
      },
      select: { duration: true, taskId: true }
    });

    let totalDurationMins = 0;
    const taskDurations: Record<string, number> = {};

    for (const entry of timeEntries) {
      const d = entry.duration || 0;
      totalDurationMins += d;
      taskDurations[entry.taskId] = (taskDurations[entry.taskId] || 0) + d;
    }

    const tasksTrackedCount = Object.keys(taskDurations).length;
    let averageTaskDuration = 0;
    if (tasksTrackedCount > 0) {
      averageTaskDuration = Math.round(totalDurationMins / tasksTrackedCount);
    }

    const productivityScore = Math.min(
      Math.round(100 + completedTasksCount * 10 + (totalDurationMins / 60) * 2),
      1000
    );

    return NextResponse.json({
      metrics: {
        totalTasksCompleted: completedTasksCount,
        averageTaskDurationMins: averageTaskDuration,
        totalTimeTrackedMins: totalDurationMins,
        productivityScore
      }
    });

  } catch (e) {
    console.error("Error in analytics:", e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
