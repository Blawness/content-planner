import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireWorkspaceRole } from '@/lib/rbac'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id: workspaceId } = await params
    // Any member can list members
    await requireWorkspaceRole(userId, workspaceId, 'member')

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, isSuperuser: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(
      members.map((m) => ({
        id: m.id,
        workspace_id: m.workspaceId,
        user_id: m.userId,
        email: m.user.email,
        is_superuser: m.user.isSuperuser,
        role: m.role,
        created_at: m.createdAt.toISOString(),
      }))
    )
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to list members' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id: workspaceId } = await params
    // Only owner can invite members
    await requireWorkspaceRole(userId, workspaceId, 'owner')

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const role = body.role === 'admin' ? 'admin' : 'member'

    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })
    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
    })
    if (existing) {
      return NextResponse.json({ message: 'User is already a member' }, { status: 409 })
    }

    const member = await prisma.workspaceMember.create({
      data: { workspaceId, userId: targetUser.id, role },
      include: { user: { select: { email: true } } },
    })

    return NextResponse.json({
      id: member.id,
      workspace_id: member.workspaceId,
      user_id: member.userId,
      email: member.user.email,
      role: member.role,
      created_at: member.createdAt.toISOString(),
    }, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to add member' },
      { status: 500 }
    )
  }
}
