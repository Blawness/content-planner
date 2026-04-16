import { apiClient } from './client'
import type { ContentPlanRow } from '@/types'

export async function fetchContentPlan(token: string): Promise<ContentPlanRow[]> {
  return apiClient<ContentPlanRow[]>('/content-plan', { method: 'GET', token })
}

export async function createContentPlanItem(
  item: Omit<ContentPlanRow, 'id'>,
  token: string
): Promise<ContentPlanRow> {
  return apiClient<ContentPlanRow>('/content-plan', {
    method: 'POST',
    body: JSON.stringify(item),
    token,
  })
}

export async function batchCreateContentPlan(
  items: ContentPlanRow[],
  token: string
): Promise<ContentPlanRow[]> {
  return apiClient<ContentPlanRow[]>('/content-plan/batch', {
    method: 'POST',
    body: JSON.stringify({ items }),
    token,
  })
}

export async function updateContentPlanItem(
  id: string,
  item: Partial<ContentPlanRow>,
  token: string
): Promise<ContentPlanRow> {
  return apiClient<ContentPlanRow>(`/content-plan/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
    token,
  })
}

export async function deleteContentPlanItem(id: string, token: string): Promise<void> {
  return apiClient<void>(`/content-plan/${id}`, { method: 'DELETE', token })
}

export async function deleteAllContentPlan(token: string): Promise<void> {
  return apiClient<void>('/content-plan', { method: 'DELETE', token })
}
