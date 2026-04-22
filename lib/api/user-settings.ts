import { apiClient } from './client'

export type UserSettingData = {
  brandName: string
  industry: string
  niche: string
  targetAudience: string
  preferredPlatform: string
  brandVoice: string
  postingGoal: string
}

export async function fetchUserSettings(token: string): Promise<UserSettingData> {
  return apiClient<UserSettingData>('/user-settings', { method: 'GET', token })
}

export async function updateUserSettings(data: UserSettingData, token: string): Promise<UserSettingData> {
  return apiClient<UserSettingData>('/user-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  })
}
