import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/api/serialize'

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || undefined
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      select: { id: true },
    })
    const workspaceIds = workspaces.map((w) => w.id)
    const list = await prisma.project.findMany({
      where: {
        workspaceId: workspaceId && workspaceIds.includes(workspaceId)
          ? workspaceId
          : { in: workspaceIds },
      },
      orderBy: { createdAt: 'desc' },
    })
    const data = list.map((p) => ({
      id: p.id,
      workspace_id: p.workspaceId,
      name: p.name,
      description: p.description,
      start_date: formatDate(p.startDate),
      end_date: formatDate(p.endDate),
      created_at: formatDate(p.createdAt),
    }))
    return NextResponse.json(data)
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
      return NextResponse.json(
        { message: 'name is required' },
        { status: 400 }
      )
    }
    const owned = await prisma.workspace.findFirst({
      where: { id: workspaceId || undefined, ownerId: userId },
    })
    const targetWorkspaceId = owned?.id
      || (await prisma.workspace.findFirst({ where: { ownerId: userId }, select: { id: true } }))?.id
    if (!targetWorkspaceId) {
      return NextResponse.json(
        { message: 'No workspace found' },
        { status: 400 }
      )
    }
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
      { message: e instanceof Error ? e.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}
