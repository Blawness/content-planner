'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { getProjects } from '@/lib/api/projects'
import type { Project } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'

const DEMO_PROJECTS: Project[] = [
  { id: 'demo-1', workspace_id: 'ws-1', name: 'Ramadan Campaign', description: 'Konten campaign Ramadan 30 hari', start_date: null, end_date: null },
  { id: 'demo-2', workspace_id: 'ws-1', name: 'Product Launch Q2', description: 'Launch produk baru Instagram + TikTok', start_date: null, end_date: null },
]

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token, isGuest } = useAuth()

  useEffect(() => {
    const run = () => {
      if (isGuest) {
        setProjects(DEMO_PROJECTS)
        setLoading(false)
        return
      }
      if (!token) {
        setLoading(false)
        return
      }
      getProjects(token)
        .then(setProjects)
        .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat proyek'))
        .finally(() => setLoading(false))
    }
    run()
  }, [token, isGuest])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Projects</h1>
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/dashboard/projects/new">
          <Button>Buat Proyek</Button>
        </Link>
      </div>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
          {error}
        </p>
      )}
      {isGuest && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
          Mode tamu: menampilkan data contoh. Login untuk data asli.
        </p>
      )}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            Belum ada proyek. Buat proyek pertama dari onboarding atau tombol di atas.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/dashboard/projects/${p.id}`}>
                <Card className="hover:border-gray-300 transition-colors h-full">
                  <CardContent>
                    <h2 className="font-semibold text-gray-900">{p.name}</h2>
                    {p.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
