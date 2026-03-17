import { apiClient } from './client'
import type { Task, TaskStatus } from '@/types'

export async function getTasks(token: string | null, projectId?: string): Promise<Task[]> {
  const q = projectId ? `?projectId=${projectId}` : ''
  return apiClient<Task[]>(`/tasks${q}`, { token })
}

export async function createTask(
  payload: { project_id: string; title: string; description?: string; status?: TaskStatus; assignee?: string; deadline?: string },
  token: string | null
): Promise<Task> {
  return apiClient<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateTask(
  id: string,
  payload: Partial<{ title: string; description: string; status: TaskStatus; assignee: string; deadline: string }>,
  token: string | null
): Promise<Task> {
  return apiClient<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}
