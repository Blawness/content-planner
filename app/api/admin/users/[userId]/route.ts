import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireSuperuser } from '@/lib/rbac'

type Params = { params: Promise<{ userId: string }> }

/**
 * PATCH /api/admin/users/[userId]
 * Toggle isSuperuser for a user. Superuser only.
 * Body: { is_superuser: boolean }
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { sub: callerId } = await requireAuth(request)
    await requireSuperuser(callerId)

    const { userId } = await params
    const body = await request.json()

    if (typeof body.is_superuser !== 'boolean') {
      return NextResponse.json(
        { message: 'is_superuser (boolean) is required' },
        { status: 400 }
      )
    }

    // Prevent superuser from revoking their own superuser status
    if (userId === callerId && !body.is_superuser) {
      return NextResponse.json(
        { message: 'You cannot revoke your own superuser status' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSuperuser: body.is_superuser },
      select: { id: true, email: true, isSuperuser: true, createdAt: true },
    })

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      is_superuser: updated.isSuperuser,
      created_at: updated.createdAt.toISOString(),
    })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Hard-delete a user. Superuser only.
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { sub: callerId } = await requireAuth(request)
    await requireSuperuser(callerId)

    const { userId } = await params

    if (userId === callerId) {
      return NextResponse.json(
        { message: 'You cannot delete yourself' },
        { status: 400 }
      )
    }

    await prisma.user.delete({ where: { id: userId } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}
