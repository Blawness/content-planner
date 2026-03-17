import { apiClient } from './client'
import type { TimeEntry } from '@/types'

export async function getTimeEntries(
  token: string | null,
  opts?: { taskId?: string; userId?: string }
): Promise<TimeEntry[]> {
  const params = new URLSearchParams()
  if (opts?.taskId) params.set('taskId', opts.taskId)
  if (opts?.userId) params.set('userId', opts.userId)
  const q = params.toString() ? `?${params}` : ''
  return apiClient<TimeEntry[]>(`/time-entries${q}`, { token }).catch(() => [])
}

export async function startTimeEntry(
  taskId: string,
  token: string | null
): Promise<TimeEntry> {
  return apiClient<TimeEntry>('/time-entries', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId, action: 'start' }),
    token,
  })
}

export async function stopTimeEntry(
  entryId: string,
  token: string | null
): Promise<TimeEntry> {
  return apiClient<TimeEntry>(`/time-entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'stop' }),
    token,
  })
}
