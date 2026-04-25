import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openRouterChat } from '@/lib/openrouter'
import { getActiveAiModel } from '@/lib/ai-settings'
import { recommendCampaignPrompt } from '@/lib/prompts'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export async function POST(request: Request) {
  try {
    const { sub: userId } = await requireAuth(request)

    const rl = checkRateLimit(`recommend-campaign:${userId}`, 10, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const model = await getActiveAiModel()

    const setting = await prisma.userSetting.findUnique({ where: { userId } })
    if (!setting?.niche) {
      return NextResponse.json(
        { message: 'Profil bisnis belum diatur. Isi niche di halaman Pengaturan terlebih dahulu.' },
        { status: 400 }
      )
    }

    const currentDate = format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })
    const prompt = recommendCampaignPrompt(
      setting.brandName,
      setting.industry,
      setting.niche,
      setting.targetAudience,
      setting.brandVoice,
      setting.postingGoal,
      currentDate
    )

    const raw = await openRouterChat([{ role: 'user', content: prompt }], model, true, 1024)
    const result = JSON.parse(raw)

    const VALID_PRESETS = ['awareness', 'engagement', 'launch']
    const VALID_TONES = ['Edukatif', 'Promosi', 'Entertaining', 'Inspiratif', 'Story Telling']

    return NextResponse.json({
      preset: VALID_PRESETS.includes(result.preset) ? result.preset : 'awareness',
      campaign_idea: typeof result.campaign_idea === 'string' ? result.campaign_idea : '',
      tone: VALID_TONES.includes(result.tone) ? result.tone : setting.brandVoice,
      content_per_week: Number.isInteger(result.content_per_week) ? Math.min(Math.max(result.content_per_week, 1), 7) : 3,
      duration_weeks: Number.isInteger(result.duration_weeks) ? Math.min(Math.max(result.duration_weeks, 1), 6) : 2,
      reasoning: typeof result.reasoning === 'string' ? result.reasoning : '',
    })
  } catch (err) {
    if (err instanceof Response) return err
    const message = err instanceof Error ? err.message : 'Gagal mendapatkan rekomendasi AI'
    return NextResponse.json({ message }, { status: 500 })
  }
}
