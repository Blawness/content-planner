import { NextResponse } from 'next/server'
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
