import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate, toApiTaskStatus, fromApiTaskStatus } from '@/lib/api/serialize'
import { getUserWorkspaceIds, requireWorkspaceRole } from '@/lib/rbac'

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

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined

    const workspaceIds = await getUserWorkspaceIds(userId)

    const list = await prisma.task.findMany({
      where: {
        project: {
          workspaceId: { in: workspaceIds },
          ...(projectId ? { id: projectId } : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(list.map(taskToJson))
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to list tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const body = await request.json()
    const projectId = typeof body.project_id === 'string' ? body.project_id : ''
    const title = typeof body.title === 'string' ? body.title.trim() : ''

    if (!projectId || !title) {
      return NextResponse.json(
        { message: 'project_id and title are required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    })
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }

    // Must be admin or owner to create tasks
    await requireWorkspaceRole(userId, project.workspaceId, 'admin')

    const status = body.status != null ? (fromApiTaskStatus(body.status) ?? 'BACKLOG') : 'BACKLOG'
    const deadline = body.deadline ? new Date(body.deadline) : null
    const assigneeId = typeof body.assignee === 'string' ? body.assignee || null : null

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description: typeof body.description === 'string' ? body.description : null,
        status: status as 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
        assigneeId,
        deadline: deadline && !isNaN(deadline.getTime()) ? deadline : null,
      },
    })

    return NextResponse.json(taskToJson(task), { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}
