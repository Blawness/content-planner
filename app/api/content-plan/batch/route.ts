import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { rowToResponse } from '@/lib/api/content-plan-helpers'
import type { ContentPlanRow } from '@/types'

// POST — batch create items
export async function POST(request: NextRequest) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { items } = await request.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'items must be a non-empty array' }, { status: 400 })
    }

    const startOrder = await prisma.contentPlanItem.count({ where: { userId } })

    const created = await prisma.$transaction(
      items.map((item: ContentPlanRow, idx: number) =>
        prisma.contentPlanItem.create({
          data: {
            userId,
            weekLabel: item.week_label ?? '',
            date: item.date ?? '',
            day: item.day ?? '',
            topic: item.topic ?? '',
            format: item.format ?? 'Single Post',
            headline: item.headline ?? '',
            visualDescription: item.visual_description ?? null,
            contentBody: item.content_body ?? null,
            hookCaption: item.hook_caption ?? null,
            scheduledTime: item.scheduled_time ?? '10:00 WIB',
            status: item.status ?? 'To Do',
            notes: item.notes ?? 'Baru',
            sortOrder: startOrder + idx,
          },
        })
      )
    )

    return NextResponse.json(created.map(rowToResponse), { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
