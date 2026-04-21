import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate, toApiTaskStatus, fromApiTaskStatus } from '@/lib/api/serialize'

type Params = { params: Promise<{ id: string }> }

function taskToJson(t: {
  id: string
  projectId: string
  title: string
  description: string | null
  status: 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  assigneeId: string | null
  deadline: Date | null
  createdAt: Date
}) {
  return {
    id: t.id,
    project_id: t.projectId,
    title: t.title,
    description: t.description,
    status: toApiTaskStatus(t.status),
    assignee: t.assigneeId,
    deadline: formatDate(t.deadline),
    created_at: formatDate(t.createdAt),
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } },
    })
    if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    // User can only view tasks in their own projects
    if (task.project.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(taskToJson(task))
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to get task' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } },
    })
    if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    // User can only edit tasks in their own projects
    if (task.project.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const update: {
      title?: string
      description?: string | null
      status?: 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
      assigneeId?: string | null
      deadline?: Date | null
    } = {}

    if (typeof body.title === 'string') update.title = body.title.trim()
    if (body.description !== undefined)
      update.description = typeof body.description === 'string' ? body.description : null
    if (body.status !== undefined) {
      const s = fromApiTaskStatus(body.status)
      if (s) update.status = s
    }
    if (body.assignee !== undefined)
      update.assigneeId = typeof body.assignee === 'string' ? body.assignee || null : null
    if (body.deadline !== undefined) {
      const d = body.deadline ? new Date(body.deadline) : null
      update.deadline = d && !isNaN(d.getTime()) ? d : null
    }

    const updated = await prisma.task.update({ where: { id }, data: update })
    return NextResponse.json(taskToJson(updated))
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } },
    })
    if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    // User can only delete tasks in their own projects
    if (task.project.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await prisma.task.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to delete task' },
      { status: 500 }
    )
  }
}
