import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate, toApiTaskStatus, fromApiTaskStatus } from '@/lib/api/serialize'

async function canAccessTask(userId: string, taskId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { workspace: true } } },
  })
  return task?.project.workspace.ownerId === userId
}

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params
    const allowed = await canAccessTask(userId, id)
    if (!allowed) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
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
    if (body.description !== undefined) update.description = typeof body.description === 'string' ? body.description : null
    if (body.status !== undefined) {
      const s = fromApiTaskStatus(body.status)
      if (s) update.status = s
    }
    if (body.assignee !== undefined) update.assigneeId = typeof body.assignee === 'string' ? body.assignee || null : null
    if (body.deadline !== undefined) {
      const d = body.deadline ? new Date(body.deadline) : null
      update.deadline = d && !isNaN(d.getTime()) ? d : null
    }
    const task = await prisma.task.update({
      where: { id },
      data: update,
    })
    return NextResponse.json(taskToJson(task))
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to update task' },
      { status: 500 }
    )
  }
}
