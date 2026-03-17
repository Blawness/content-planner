import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/api/serialize'

async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: true },
  })
  return project?.workspace.ownerId === userId
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id } = await params
    const allowed = await canAccessProject(userId, id)
    if (!allowed) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    const project = await prisma.project.findUnique({
      where: { id },
    })
    if (!project) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
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
