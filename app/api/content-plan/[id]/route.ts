import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { rowToResponse } from '@/lib/api/content-plan-helpers'

// PUT — update single item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params
    const existing = await prisma.contentPlanItem.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    const body = await request.json()
    const updated = await prisma.contentPlanItem.update({
      where: { id },
      data: {
        weekLabel: body.week_label ?? existing.weekLabel,
        date: body.date ?? existing.date,
        day: body.day ?? existing.day,
        topic: body.topic ?? existing.topic,
        format: body.format ?? existing.format,
        headline: body.headline ?? existing.headline,
        visualDescription: body.visual_description !== undefined ? body.visual_description : existing.visualDescription,
        contentBody: body.content_body !== undefined ? body.content_body : existing.contentBody,
        hookCaption: body.hook_caption !== undefined ? body.hook_caption : existing.hookCaption,
        scheduledTime: body.scheduled_time ?? existing.scheduledTime,
        status: body.status ?? existing.status,
        notes: body.notes ?? existing.notes,
      },
    })
    return NextResponse.json(rowToResponse(updated))
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE — remove single item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params
    const existing = await prisma.contentPlanItem.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    await prisma.contentPlanItem.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
