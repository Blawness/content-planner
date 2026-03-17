import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { formatDate } from '@/lib/api/serialize'

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const list = await prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
    })
    const data = list.map((w) => ({
      id: w.id,
      owner_id: w.ownerId,
      name: w.name,
      created_at: formatDate(w.createdAt),
    }))
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to list workspaces' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json(
        { message: 'name is required' },
        { status: 400 }
      )
    }
    const workspace = await prisma.workspace.create({
      data: { name, ownerId: userId },
    })
    return NextResponse.json({
      id: workspace.id,
      owner_id: workspace.ownerId,
      name: workspace.name,
      created_at: formatDate(workspace.createdAt),
    })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to create workspace' },
      { status: 500 }
    )
  }
}
