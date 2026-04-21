import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    // Get time entries for user, optionally filtered by date
    const where: any = { userId }
    if (date) {
      where.date = date
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json({ timeEntries })
  } catch (e) {
    console.error('Error in get time-entries:', e)
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const body = await request.json()
    const { date, startTime, endTime, duration } = body

    if (!date || !startTime) {
      return NextResponse.json(
        { message: 'date and startTime are required' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : null
    let computedDuration = duration

    if (end && !computedDuration) {
      computedDuration = Math.round((end.getTime() - start.getTime()) / 60000)
    }

    const newEntry = await prisma.timeEntry.create({
      data: {
        userId,
        date,
        startTime: start,
        endTime: end,
        duration: computedDuration,
      },
    })

    return NextResponse.json({ timeEntry: newEntry }, { status: 201 })
  } catch (e) {
    console.error('Error in post time-entries:', e)
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
