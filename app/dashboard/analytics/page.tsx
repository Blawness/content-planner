'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent } from '@/components/ui/Card'
import { PageEmptyState, PageErrorState, PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { getAnalytics } from '@/lib/api/analytics'
import type { AnalyticsMetrics } from '@/lib/api/analytics'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token, isLoading: authLoading } = useAuth()
  const isUnauthorized = !authLoading && !token

  useEffect(() => {
    if (!token) return

    getAnalytics(token)
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat analytics'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics' },
        ]}
        eyebrow="Superuser Lab"
        title="Productivity Analytics"
        description="Area analitik internal untuk membaca output task dan produktivitas tim di luar modul utama Content Plan."
      />

      {authLoading || (token && loading) ? <PageLoadingState title="Memuat analytics" /> : null}
      {!authLoading && isUnauthorized ? <PageErrorState description="Sesi login tidak ditemukan. Silakan login ulang." /> : null}
      {!authLoading && !isUnauthorized && !loading && error ? <PageErrorState description={error} /> : null}

      {!authLoading && !isUnauthorized && !loading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="space-y-1"><p className="text-sm text-muted-foreground">Total Task Selesai</p><p className="text-2xl font-semibold">{metrics?.totalTasksCompleted ?? 0}</p></CardContent></Card>
            <Card><CardContent className="space-y-1"><p className="text-sm text-muted-foreground">Rata-rata Durasi Task</p><p className="text-2xl font-semibold">{metrics?.averageTaskDurationMinutes != null ? `${Math.round(metrics.averageTaskDurationMinutes)} m` : '-'}</p></CardContent></Card>
            <Card><CardContent className="space-y-1"><p className="text-sm text-muted-foreground">Productivity Score</p><p className="text-2xl font-semibold">{metrics?.productivityScore != null ? `${metrics.productivityScore}%` : '-'}</p></CardContent></Card>
            <Card><CardContent className="space-y-1"><p className="text-sm text-muted-foreground">Team Performance</p><p className="text-2xl font-semibold">{metrics?.teamPerformance && Object.keys(metrics.teamPerformance).length > 0 ? 'Ada data' : '-'}</p></CardContent></Card>
          </div>

          {metrics?.teamPerformance && Object.keys(metrics.teamPerformance).length > 0 ? (
            <Card>
              <CardContent className="space-y-3">
                <h2 className="font-semibold">Team Performance</h2>
                <ul className="space-y-2">
                  {Object.entries(metrics.teamPerformance).map(([name, value]) => (
                    <li key={name} className="flex justify-between gap-4 border-b border-border pb-2 text-sm last:border-b-0 last:pb-0">
                      <span>{name}</span>
                      <span className="font-medium">{value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {metrics?.insights && metrics.insights.length > 0 ? (
            <Card>
              <CardContent className="space-y-3">
                <h2 className="font-semibold">Insight</h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {metrics.insights.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {!metrics?.totalTasksCompleted && !metrics?.insights?.length ? (
            <PageEmptyState title="Belum ada data analytics" description="Selesaikan task dan lacak waktu untuk melihat insight tim." />
          ) : null}
        </>
      ) : null}
    </PageShell>
  )
}
