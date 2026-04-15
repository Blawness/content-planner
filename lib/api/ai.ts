import { apiClient } from './client'
import type { ContentIdea, ContentPlanRow } from '@/types'

export type GenerateContentPayload = {
  niche: string
  platform: string
  goal: string
  target_audience: string
  count?: number
}

export type GenerateSchedulePayload = {
  content_per_week: number
  platform: string
  niche: string
  content_idea?: string
  month_label?: string
  duration_weeks: number
}

export async function generateContent(
  payload: GenerateContentPayload,
  token: string | null
): Promise<{ ideas: ContentIdea[] }> {
  return apiClient<{ ideas: ContentIdea[] }>('/ai/generate-content', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function generateSchedule(
  payload: GenerateSchedulePayload,
  token: string | null
): Promise<{ schedule: ContentPlanRow[]; weeks?: Record<string, ContentPlanRow[]> }> {
  return apiClient<{ schedule: ContentPlanRow[]; weeks?: Record<string, ContentPlanRow[]> }>('/ai/generate-schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function aiChat(
  message: string,
  token: string | null,
  history?: { role: string; content: string }[]
): Promise<{ response: string }> {
  return apiClient<{ response: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history: history || [] }),
    token,
  })
}

export async function predictTask(
  taskIdOrTitle: string,
  token: string | null
): Promise<{ predictedHours: number; confidence: number }> {
  return apiClient<{ predictedHours: number; confidence: number }>('/ai/predict-task', {
    method: 'POST',
    body: JSON.stringify({ taskId: taskIdOrTitle, taskTitle: taskIdOrTitle }),
    token,
  })
}
