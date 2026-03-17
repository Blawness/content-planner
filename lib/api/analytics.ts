import { apiClient } from './client'

export type AnalyticsMetrics = {
  totalTasksCompleted?: number
  averageTaskDurationMinutes?: number
  productivityScore?: number
  teamPerformance?: Record<string, number>
  insights?: string[]
}

export async function getAnalytics(token: string | null): Promise<AnalyticsMetrics> {
  return apiClient<AnalyticsMetrics>('/analytics', { token }).catch(() => ({
    totalTasksCompleted: 0,
    averageTaskDurationMinutes: 0,
    productivityScore: 0,
    insights: [],
  }))
}
