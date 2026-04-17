'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FolderKanban } from 'lucide-react'

import type { Project } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/Card'
import { PageEmptyState, PageErrorState, PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { getProjects } from '@/lib/api/projects'

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token, isLoading: authLoading } = useAuth()
  const isUnauthorized = !authLoading && !token

  useEffect(() => {
    if (!token) return

    getProjects(token)
      .then(setProjects)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat proyek'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects' },
        ]}
        eyebrow="Superuser Lab"
        title="Projects"
        description="Area kerja internal untuk melacak task dan status produksi konten di luar flow utama Content Plan."
        actions={
          <Link href="/dashboard/projects/new">
            <Button>Buat Proyek</Button>
          </Link>
        }
      />

      {authLoading || (token && loading) ? <PageLoadingState title="Memuat daftar proyek" /> : null}
      {!authLoading && isUnauthorized ? <PageErrorState description="Sesi login tidak ditemukan. Silakan login ulang." /> : null}
      {!authLoading && !isUnauthorized && !loading && error ? <PageErrorState description={error} /> : null}
      {!authLoading && !isUnauthorized && !loading && !error && projects.length === 0 ? (
        <PageEmptyState
          icon={<FolderKanban className="size-6" aria-hidden="true" />}
          title="Belum ada proyek"
          description="Buat proyek jika Anda ingin memisahkan task produksi dari tabel Content Plan utama."
          action={
            <Link href="/dashboard/projects/new">
              <Button>Buat Proyek</Button>
            </Link>
          }
        />
      ) : null}

      {!authLoading && !isUnauthorized && !loading && !error && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardContent className="space-y-2">
                  <h2 className="font-semibold">{project.name}</h2>
                  {project.description ? <p className="text-sm leading-6 text-muted-foreground">{project.description}</p> : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </PageShell>
  )
}
