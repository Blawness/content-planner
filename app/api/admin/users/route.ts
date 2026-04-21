import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireSuperuser } from '@/lib/rbac'

/**
 * GET /api/admin/users
 * Returns all users with their superuser status. Superuser only.
 */
export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    await requireSuperuser(userId)

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        isSuperuser: true,
        createdAt: true,
        _count: {
          select: { ownedWorkspaces: true, aiRequests: true },
        },
      },
    })

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        is_superuser: u.isSuperuser,
        owned_workspaces: u._count.ownedWorkspaces,
        ai_requests: u._count.aiRequests,
        created_at: u.createdAt.toISOString(),
      }))
    )
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to list users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * Create a new user. Superuser only.
 * Body: { email: string; password: string; is_superuser?: boolean }
 */
export async function POST(request: Request) {
  try {
    const { sub: callerId } = await requireAuth(request)
    await requireSuperuser(callerId)

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const isSuperuser = body.is_superuser === true

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, isSuperuser },
      select: {
        id: true,
        email: true,
        isSuperuser: true,
        createdAt: true,
        _count: { select: { ownedWorkspaces: true, aiRequests: true } },
      },
    })

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        is_superuser: user.isSuperuser,
        owned_workspaces: user._count.ownedWorkspaces,
        ai_requests: user._count.aiRequests,
        created_at: user.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Gagal membuat user' },
      { status: 500 }
    )
  }
}
