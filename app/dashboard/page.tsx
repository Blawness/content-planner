'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { getProjects } from '@/lib/api/projects'
import { getAnalytics } from '@/lib/api/analytics'
import { Card, CardContent } from '@/components/ui/Card'

export default function DashboardPage() {
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [tasksCompleted, setTasksCompleted] = useState<number | null>(null)
  const [productivityScore, setProductivityScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return
    getProjects(token)
      .then((list) => setProjectCount(list.length))
      .catch(() => setProjectCount(0))
    getAnalytics(token)
      .then((a) => {
        setTasksCompleted(a.totalTasksCompleted ?? 0)
        setProductivityScore(a.productivityScore ?? null)
      })
      .catch(() => {
        setTasksCompleted(0)
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600 mb-6">Ringkasan produktivitas dan akses cepat ke fitur.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Proyek</p>
            <p className="text-2xl font-bold text-gray-900">{projectCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Task Selesai</p>
            <p className="text-2xl font-bold text-gray-900">{tasksCompleted ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Productivity Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {productivityScore != null ? `${productivityScore}%` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/calendar"
          className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <h2 className="font-medium">Content Calendar</h2>
          <p className="text-sm text-gray-500">Lihat jadwal konten</p>
        </Link>
        <Link
          href="/dashboard/schedule"
          className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <h2 className="font-medium">AI Content Plan</h2>
          <p className="text-sm text-gray-500">Generate tabel rencana konten</p>
        </Link>
        <Link
          href="/dashboard/projects"
          className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <h2 className="font-medium">Projects</h2>
          <p className="text-sm text-gray-500">Kelola proyek & task</p>
        </Link>
        <Link
          href="/dashboard/analytics"
          className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <h2 className="font-medium">Analytics</h2>
          <p className="text-sm text-gray-500">Produktivitas & insight</p>
        </Link>
      </div>
    </div>
  )
}
