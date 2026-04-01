import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { sub: userId } = await requireAuth(request);
    const id = params.id;
    const body = await request.json();
    const { endTime } = body;

    if (!endTime) {
      return NextResponse.json({ message: 'endTime is required to patch time entry' }, { status: 400 });
    }

    const currentEntry = await prisma.timeEntry.findUnique({ where: { id } });

    if (!currentEntry) {
      return NextResponse.json({ message: 'Time entry not found' }, { status: 404 });
    }

    if (currentEntry.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const end = new Date(endTime);
    const durationMins = Math.round((end.getTime() - currentEntry.startTime.getTime()) / 60000);

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime: end,
        duration: durationMins,
      }
    });

    return NextResponse.json({ timeEntry: updatedEntry });

  } catch (e) {
    console.error("Error patching time-entry:", e);
    if (e instanceof Response) return e; // Auth error
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
