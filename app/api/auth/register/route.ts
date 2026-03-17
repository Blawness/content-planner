import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash },
    })

    const token = signToken({ sub: user.id, email: user.email })
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email },
    })
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Registration failed' },
      { status: 500 }
    )
  }
}
