import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate, toApiTaskStatus, fromApiTaskStatus } from '@/lib/api/serialize'
import { getWorkspaceRole, requireWorkspaceRole } from '@/lib/rbac'

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

async function getTaskWithWorkspace(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { workspaceId: true } },
    },
  })
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params

    const task = await getTaskWithWorkspace(id)
    if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    // Any member can view a task
    await requireWorkspaceRole(userId, task.project.workspaceId, 'member')

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

    const task = await getTaskWithWorkspace(id)
    if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const workspaceId = task.project.workspaceId
    const role = await getWorkspaceRole(userId, workspaceId)

    // Check user is at least a member
    if (!role) {
      // Check superuser
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuperuser: true },
      })
      if (!user?.isSuperuser) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const isMemberOnly = role === 'member'

    // Members can ONLY update the status of a task assigned to them
    if (isMemberOnly) {
      if (task.assigneeId !== userId) {
        return NextResponse.json(
          { message: 'Forbidden: you can only update tasks assigned to you' },
          { status: 403 }
        )
      }
      if (body.status === undefined) {
        return NextResponse.json(
          { message: 'Members can only update task status' },
          { status: 403 }
        )
      }
      const s = fromApiTaskStatus(body.status)
      if (!s) return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
      const updated = await prisma.task.update({
        where: { id },
        data: { status: s },
      })
      return NextResponse.json(taskToJson(updated))
    }

    // Admin / owner / superuser: full edit
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

    const task = await getTaskWithWorkspace(id)
    if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    // Only admin/owner can delete tasks
    await requireWorkspaceRole(userId, task.project.workspaceId, 'admin')

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
