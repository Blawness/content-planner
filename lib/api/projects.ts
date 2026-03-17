import { apiClient } from './client'
import type { Project } from '@/types'

export async function getProjects(token: string | null): Promise<Project[]> {
  return apiClient<Project[]>('/projects', { token })
}

export async function getProject(id: string, token: string | null): Promise<Project> {
  return apiClient<Project>(`/projects/${id}`, { token })
}

export async function createProject(
  payload: { name: string; description?: string; start_date?: string; end_date?: string; workspace_id?: string },
  token: string | null
): Promise<Project> {
  return apiClient<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}
