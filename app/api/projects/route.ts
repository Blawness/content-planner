import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/api/serialize'

function projectToJson(p: {
  id: string
  userId: string
  name: string
  description: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
}) {
  return {
    id: p.id,
    user_id: p.userId,
    name: p.name,
    description: p.description,
    start_date: formatDate(p.startDate),
    end_date: formatDate(p.endDate),
    created_at: formatDate(p.createdAt),
  }
}

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)

    const list = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(list.map(projectToJson))
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to list projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    const startDate = body.start_date ? new Date(body.start_date) : null
    const endDate = body.end_date ? new Date(body.end_date) : null
    const project = await prisma.project.create({
      data: {
        userId,
        name,
        description: typeof body.description === 'string' ? body.description : null,
        startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
        endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
      },
    })

    return NextResponse.json(projectToJson(project), { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}
