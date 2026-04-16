import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

function rowToResponse(item: any) {
  return {
    id: item.id,
    week_label: item.weekLabel,
    date: item.date,
    day: item.day,
    topic: item.topic,
    format: item.format,
    headline: item.headline,
    visual_description: item.visualDescription ?? '',
    content_body: item.contentBody ?? '',
    hook_caption: item.hookCaption ?? '',
    scheduled_time: item.scheduledTime,
    status: item.status,
    notes: item.notes,
  }
}

// GET — fetch all items for current user
export async function GET(request: NextRequest) {
  try {
    const { sub: userId } = await requireAuth(request)
    const items = await prisma.contentPlanItem.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(items.map(rowToResponse))
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// POST — create a single item
export async function POST(request: NextRequest) {
  try {
    const { sub: userId } = await requireAuth(request)
    const body = await request.json()

    const count = await prisma.contentPlanItem.count({ where: { userId } })

    const item = await prisma.contentPlanItem.create({
      data: {
        userId,
        weekLabel: body.week_label ?? '',
        date: body.date ?? '',
        day: body.day ?? '',
        topic: body.topic ?? '',
        format: body.format ?? 'Single Post',
        headline: body.headline ?? '',
        visualDescription: body.visual_description ?? null,
        contentBody: body.content_body ?? null,
        hookCaption: body.hook_caption ?? null,
        scheduledTime: body.scheduled_time ?? '10:00 WIB',
        status: body.status ?? 'To Do',
        notes: body.notes ?? 'Baru',
        sortOrder: count,
      },
    })
    return NextResponse.json(rowToResponse(item), { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE — remove all items for current user
export async function DELETE(request: NextRequest) {
  try {
    const { sub: userId } = await requireAuth(request)
    await prisma.contentPlanItem.deleteMany({ where: { userId } })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
