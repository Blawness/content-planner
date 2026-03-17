'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAnalytics } from '@/lib/api/analytics'
import type { AnalyticsMetrics } from '@/lib/api/analytics'
import { Card, CardContent } from '@/components/ui/Card'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return
    getAnalytics(token)
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat analytics'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Productivity Analytics</h1>
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Productivity Analytics</h1>
      <p className="text-gray-600 mb-6">
        Total task selesai, rata-rata durasi, productivity score, dan insight tim.
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Task Selesai</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.totalTasksCompleted ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Rata-rata Durasi Task</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.averageTaskDurationMinutes != null
                ? `${Math.round(metrics.averageTaskDurationMinutes)} m`
                : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Productivity Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.productivityScore != null ? `${metrics.productivityScore}%` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Team Performance</p>
            <p className="text-lg font-semibold text-gray-900">
              {metrics?.teamPerformance && Object.keys(metrics.teamPerformance).length > 0
                ? 'Lihat detail di bawah'
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {metrics?.teamPerformance && Object.keys(metrics.teamPerformance).length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <h2 className="font-semibold mb-3">Team Performance</h2>
            <ul className="space-y-2">
              {Object.entries(metrics.teamPerformance).map(([name, value]) => (
                <li key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span className="font-medium">{value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {metrics?.insights && metrics.insights.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h2 className="font-semibold mb-3">Insight</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {metrics.insights.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!error && !metrics?.totalTasksCompleted && !metrics?.insights?.length && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Belum ada data analytics. Selesaikan task dan lacak waktu untuk melihat insight.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
