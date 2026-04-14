import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireSuperuser } from '@/lib/rbac'

/**
 * GET /api/admin/settings
 * Returns all app settings. Superuser only.
 */
export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    await requireSuperuser(userId)

    const settings = await prisma.appSetting.findMany({
      orderBy: { key: 'asc' },
    })

    // Return as an object map for convenience
    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }

    return NextResponse.json({ settings: map })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to get settings' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/settings
 * Bulk-update app settings. Superuser only.
 *
 * Body: { openrouter_model: string, ai_enabled: "true"|"false", ... }
 */
export async function PATCH(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    await requireSuperuser(userId)

    const body = await request.json()

    const ALLOWED_KEYS = ['openrouter_model', 'ai_enabled']
    const updates: { key: string; value: string }[] = []

    for (const key of ALLOWED_KEYS) {
      if (key in body && typeof body[key] === 'string') {
        updates.push({ key, value: body[key] })
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: 'No valid settings provided. Allowed keys: ' + ALLOWED_KEYS.join(', ') },
        { status: 400 }
      )
    }

    // Upsert each setting
    const results = await Promise.all(
      updates.map((u) =>
        prisma.appSetting.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    )

    const map: Record<string, string> = {}
    for (const r of results) {
      map[r.key] = r.value
    }

    return NextResponse.json({ updated: map })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to update settings' },
      { status: 500 }
    )
  }
}
