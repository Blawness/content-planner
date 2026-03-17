import { apiClient } from './client'

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { email: string; password: string }

export type AuthResponse = {
  token?: string
  accessToken?: string
  user?: { id: string; email: string }
  userId?: string
  sub?: string
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
