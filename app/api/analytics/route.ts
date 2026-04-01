import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request);
    
    // For MVP Beta, let's just aggregate data across workspaces owned by user or where user is member
    
    // 1. Get workspaces where user is owner or member
    const userWorkspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: { id: true }
    });
    const workspaceIds = userWorkspaces.map(w => w.id);

    // 2. Get metrics from completed tasks
    const completedTasksCount = await prisma.task.count({
      where: {
        project: { workspaceId: { in: workspaceIds } },
        status: 'DONE',
        // optionally filter by assigneeId = userId if we only want personal analytics
      }
    });

    // 3. Get total and average duration from time entries in these workspaces
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        task: {
          project: { workspaceId: { in: workspaceIds } }
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

    // 4. Productivity Score (simplified metric: 100 base + (tasks completed * 10) + (hours tracked / 2)
    // Could be any arbitrary formula for now
    const productivityScore = Math.min(
      Math.round(100 + completedTasksCount * 10 + (totalDurationMins / 60) * 2),
      1000 // cap
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
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
