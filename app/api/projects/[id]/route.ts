import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/api/serialize'
import { requireWorkspaceRole } from '@/lib/rbac'

type Params = { params: Promise<{ id: string }> }

async function getProjectWithWorkspaceId(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: { select: { id: true } } },
  })
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params

    const project = await getProjectWithWorkspaceId(id)
    if (!project) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Any member can view project
    await requireWorkspaceRole(userId, project.workspace.id, 'member')

    return NextResponse.json({
      id: project.id,
      workspace_id: project.workspaceId,
      name: project.name,
      description: project.description,
      start_date: formatDate(project.startDate),
      end_date: formatDate(project.endDate),
      created_at: formatDate(project.createdAt),
    })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to get project' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params

    const project = await getProjectWithWorkspaceId(id)
    if (!project) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Must be admin or owner to edit
    await requireWorkspaceRole(userId, project.workspace.id, 'admin')

    const body = await request.json()
    const update: {
      name?: string
      description?: string | null
      startDate?: Date | null
      endDate?: Date | null
    } = {}

    if (typeof body.name === 'string') update.name = body.name.trim()
    if (body.description !== undefined) {
      update.description = typeof body.description === 'string' ? body.description : null
    }
    if (body.start_date !== undefined) {
      const d = body.start_date ? new Date(body.start_date) : null
      update.startDate = d && !isNaN(d.getTime()) ? d : null
    }
    if (body.end_date !== undefined) {
      const d = body.end_date ? new Date(body.end_date) : null
      update.endDate = d && !isNaN(d.getTime()) ? d : null
    }

    const updated = await prisma.project.update({ where: { id }, data: update })
    return NextResponse.json({
      id: updated.id,
      workspace_id: updated.workspaceId,
      name: updated.name,
      description: updated.description,
      start_date: formatDate(updated.startDate),
      end_date: formatDate(updated.endDate),
      created_at: formatDate(updated.createdAt),
    })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params

    const project = await getProjectWithWorkspaceId(id)
    if (!project) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Must be owner to delete
    await requireWorkspaceRole(userId, project.workspace.id, 'owner')

    await prisma.project.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to delete project' },
      { status: 500 }
    )
  }
}
