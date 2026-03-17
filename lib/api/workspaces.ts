import { apiClient } from './client'
import type { Workspace } from '@/types'

export async function getWorkspaces(token: string | null): Promise<Workspace[]> {
  return apiClient<Workspace[]>('/workspaces', { token }).catch(() => [])
}

export async function createWorkspace(
  payload: { name: string },
  token: string | null
): Promise<Workspace> {
  return apiClient<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}
