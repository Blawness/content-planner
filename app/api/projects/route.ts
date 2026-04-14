import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/api/serialize'
import { getUserWorkspaceIds, requireWorkspaceRole } from '@/lib/rbac'

function projectToJson(p: {
  id: string
  workspaceId: string
  name: string
  description: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
}) {
  return {
    id: p.id,
    workspace_id: p.workspaceId,
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
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || undefined

    const workspaceIds = await getUserWorkspaceIds(userId)

    const list = await prisma.project.findMany({
      where: {
        workspaceId:
          workspaceId && workspaceIds.includes(workspaceId)
            ? workspaceId
            : { in: workspaceIds },
      },
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
    const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id : ''

    if (!name) {
      return NextResponse.json({ message: 'name is required' }, { status: 400 })
    }

    // Determine target workspace — must be admin/owner of it
    let targetWorkspaceId = workspaceId
    if (!targetWorkspaceId) {
      const ws = await prisma.workspaceMember.findFirst({
        where: { userId, role: { in: ['owner', 'admin'] } },
        select: { workspaceId: true },
      })
      targetWorkspaceId = ws?.workspaceId ?? ''
    }

    if (!targetWorkspaceId) {
      return NextResponse.json({ message: 'No workspace found' }, { status: 400 })
    }

    // RBAC: must be admin or owner
    await requireWorkspaceRole(userId, targetWorkspaceId, 'admin')

    const startDate = body.start_date ? new Date(body.start_date) : null
    const endDate = body.end_date ? new Date(body.end_date) : null
    const project = await prisma.project.create({
      data: {
        workspaceId: targetWorkspaceId,
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
