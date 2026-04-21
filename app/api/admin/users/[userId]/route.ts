import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

    if (userId === callerId && !body.is_superuser) {
      return NextResponse.json(
        { message: 'You cannot revoke your own superuser status' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSuperuser: body.is_superuser },
      select: { id: true, email: true, isSuperuser: true, isAdmin: true, createdAt: true },
    })

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      is_superuser: updated.isSuperuser,
      is_admin: updated.isAdmin,
      role: updated.isSuperuser ? 'superuser' : updated.isAdmin ? 'admin' : 'user',
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
 * PUT /api/admin/users/[userId]
 * Edit user email, password, and/or role. Superuser only.
 * Body: { email?: string; password?: string; role?: "admin" | "user" }
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { sub: callerId } = await requireAuth(request)
    await requireSuperuser(callerId)

    const { userId } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (typeof body.email === 'string' && body.email.trim()) {
      const email = body.email.trim().toLowerCase()
      const conflict = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      })
      if (conflict) {
        return NextResponse.json({ message: 'Email sudah dipakai user lain' }, { status: 409 })
      }
      data.email = email
    }

    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) {
        return NextResponse.json({ message: 'Password minimal 6 karakter' }, { status: 400 })
      }
      data.passwordHash = await bcrypt.hash(body.password, 10)
    }

    if (body.role === 'admin' || body.role === 'user') {
      data.isAdmin = body.role === 'admin'
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang diubah' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        isSuperuser: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { aiRequests: true } },
      },
    })

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      is_superuser: updated.isSuperuser,
      is_admin: updated.isAdmin,
      role: updated.isSuperuser ? 'superuser' : updated.isAdmin ? 'admin' : 'user',
      ai_requests: updated._count.aiRequests,
      created_at: updated.createdAt.toISOString(),
    })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Gagal mengubah user' },
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
