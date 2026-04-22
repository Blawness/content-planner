import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const setting = await prisma.userSetting.findUnique({ where: { userId } })
    return NextResponse.json({
      brandName: setting?.brandName ?? '',
      industry: setting?.industry ?? '',
      niche: setting?.niche ?? '',
      targetAudience: setting?.targetAudience ?? '',
      preferredPlatform: setting?.preferredPlatform ?? 'Instagram',
      brandVoice: setting?.brandVoice ?? 'Edukatif',
      postingGoal: setting?.postingGoal ?? 'awareness',
    })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)
    const body = await request.json()
    const setting = await prisma.userSetting.upsert({
      where: { userId },
      update: {
        brandName: body.brandName ?? '',
        industry: body.industry ?? '',
        niche: body.niche ?? '',
        targetAudience: body.targetAudience ?? '',
        preferredPlatform: body.preferredPlatform ?? 'Instagram',
        brandVoice: body.brandVoice ?? 'Edukatif',
        postingGoal: body.postingGoal ?? 'awareness',
      },
      create: {
        userId,
        brandName: body.brandName ?? '',
        industry: body.industry ?? '',
        niche: body.niche ?? '',
        targetAudience: body.targetAudience ?? '',
        preferredPlatform: body.preferredPlatform ?? 'Instagram',
        brandVoice: body.brandVoice ?? 'Edukatif',
        postingGoal: body.postingGoal ?? 'awareness',
      },
    })
    return NextResponse.json({
      brandName: setting.brandName,
      industry: setting.industry,
      niche: setting.niche,
      targetAudience: setting.targetAudience,
      preferredPlatform: setting.preferredPlatform,
      brandVoice: setting.brandVoice,
      postingGoal: setting.postingGoal,
    })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
