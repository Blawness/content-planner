import { prisma } from '@/lib/prisma'

export const DEFAULT_AI_MODEL = 'google/gemini-2.5-flash'

/**
 * Reads the active OpenRouter model and ai_enabled flag from AppSettings.
 * Superuser controls these via /api/admin/settings.
 * Falls back to DEFAULT_AI_MODEL if the setting does not exist.
 * Throws if ai_enabled is 'false'.
 */
export async function getActiveAiModel(): Promise<string> {
  try {
    const [modelSetting, enabledSetting] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: 'openrouter_model' } }),
      prisma.appSetting.findUnique({ where: { key: 'ai_enabled' } }),
    ])
    if (enabledSetting?.value === 'false') {
      throw new Error('AI features are currently disabled by the administrator')
    }
    return modelSetting?.value || DEFAULT_AI_MODEL
  } catch (e) {
    if (e instanceof Error && e.message.includes('disabled')) throw e
    return DEFAULT_AI_MODEL
  }
}
