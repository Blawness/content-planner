import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireWorkspaceRole } from '@/lib/rbac'

type Params = { params: Promise<{ id: string; memberId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id: workspaceId, memberId } = await params
    // Only owner can change roles
    await requireWorkspaceRole(userId, workspaceId, 'owner')

    const body = await request.json()
    const newRole = body.role === 'admin' ? 'admin' : body.role === 'owner' ? 'owner' : 'member'

    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } })
    if (!member || member.workspaceId !== workspaceId) {
      return NextResponse.json({ message: 'Member not found' }, { status: 404 })
    }

    // Prevent demoting the last owner
    if (member.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'owner' },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot remove the last owner' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: { user: { select: { email: true } } },
    })

    return NextResponse.json({
      id: updated.id,
      workspace_id: updated.workspaceId,
      user_id: updated.userId,
      email: updated.user.email,
      role: updated.role,
      created_at: updated.createdAt.toISOString(),
    })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to update member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { sub: userId } = await requireAuth(request)
    const { id: workspaceId, memberId } = await params
    // Only owner can remove members
    await requireWorkspaceRole(userId, workspaceId, 'owner')

    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } })
    if (!member || member.workspaceId !== workspaceId) {
      return NextResponse.json({ message: 'Member not found' }, { status: 404 })
    }

    // Prevent deleting the last owner
    if (member.role === 'owner') {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'owner' },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot remove the last owner' },
          { status: 400 }
        )
      }
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to remove member' },
      { status: 500 }
    )
  }
}
