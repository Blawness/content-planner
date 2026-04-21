import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await requireAuth(request)
    return NextResponse.json(
      { message: 'This feature is no longer available' },
      { status: 410 }
    )
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
