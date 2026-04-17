'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { parse, isValid, startOfWeek, endOfWeek, isWithinInterval, compareAsc } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarRange, FilePenLine, Sparkles, Target } from 'lucide-react'

import type { ContentPlanRow } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageEmptyState, PageErrorState, PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { fetchContentPlan } from '@/lib/api/content-plan'

function parsePlanDate(value: string) {
  const parsed = parse(value, 'dd/MM/yyyy', new Date(), { locale: localeId })
  return isValid(parsed) ? parsed : null
}

export default function DashboardPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [rows, setRows] = useState<ContentPlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isUnauthorized = !authLoading && !token

  useEffect(() => {
    if (!token) return

    fetchContentPlan(token)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat content plan'))
      .finally(() => setLoading(false))
  }, [token])

  const metrics = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const upcoming = rows
      .map((row) => ({ row, date: parsePlanDate(row.date) }))
      .filter((item): item is { row: ContentPlanRow; date: Date } => Boolean(item.date))
      .sort((a, b) => compareAsc(a.date, b.date))

    const thisWeek = upcoming.filter(({ date }) => isWithinInterval(date, { start: weekStart, end: weekEnd }))
    const todoCount = rows.filter((row) => !row.status.toLowerCase().includes('done')).length
    const doneCount = rows.filter((row) => row.status.toLowerCase().includes('done')).length

    return {
      total: rows.length,
      thisWeek,
      todoCount,
      doneCount,
      nextWeekLabel: thisWeek[0]?.row.week_label ?? rows[0]?.week_label ?? 'Belum ada minggu aktif',
      recent: upcoming.slice(0, 5).map(({ row }) => row),
    }
  }, [rows])

  return (
    <PageShell>
      <PageHeader
        eyebrow="Overview"
        title="Content Plan Dashboard"
        description="Semua flow utama difokuskan ke satu modul. Mulai dari generate ide, susun rencana, review preview, lalu simpan ke content plan."
        actions={
          <>
            <Link href="/dashboard/schedule?compose=manual">
              <Button variant="outline">Tambah Manual</Button>
            </Link>
            <Link href="/dashboard/schedule?compose=ai">
              <Button>
                <Sparkles className="size-4" />
                Generate dengan AI
              </Button>
            </Link>
          </>
        }
      />

      {authLoading || (token && loading) ? <PageLoadingState title="Memuat ringkasan content plan" /> : null}

      {!authLoading && isUnauthorized ? (
        <PageErrorState
          description="Sesi login tidak ditemukan. Silakan login ulang untuk membuka Content Plan."
          action={
            <Link href="/login">
              <Button variant="outline">Kembali ke Login</Button>
            </Link>
          }
        />
      ) : null}

      {!authLoading && !isUnauthorized && !loading && error ? (
        <PageErrorState
          description={error}
          action={
            <Link href="/login">
              <Button variant="outline">Kembali ke Login</Button>
            </Link>
          }
        />
      ) : null}

      {!authLoading && !isUnauthorized && !loading && !error ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Total item</CardDescription>
                <CardTitle className="text-3xl">{metrics.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Jadwal minggu ini</CardDescription>
                <CardTitle className="text-3xl">{metrics.thisWeek.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Belum selesai</CardDescription>
                <CardTitle className="text-3xl">{metrics.todoCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Sudah selesai</CardDescription>
                <CardTitle className="text-3xl">{metrics.doneCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <CardDescription>Minggu aktif</CardDescription>
                <CardTitle>{metrics.nextWeekLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.recent.length === 0 ? (
                  <PageEmptyState
                    title="Content plan masih kosong"
                    description="Mulai dari preset AI untuk generate draft cepat, atau tambah item manual jika sudah punya rencana sendiri."
                    action={
                      <>
                        <Link href="/dashboard/schedule?compose=ai">
                          <Button>
                            <Sparkles className="size-4" />
                            Buka AI Wizard
                          </Button>
                        </Link>
                        <Link href="/dashboard/schedule?compose=manual">
                          <Button variant="outline">Tambah Manual</Button>
                        </Link>
                      </>
                    }
                  />
                ) : (
                  metrics.recent.map((row) => (
                    <div key={`${row.id ?? row.date}-${row.headline}`} className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{row.headline}</p>
                          <Badge variant="outline">{row.format}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{row.topic}</p>
                        <p className="text-xs text-muted-foreground">{row.date} • {row.day} • {row.scheduled_time}</p>
                      </div>
                      <Badge variant={row.status.toLowerCase().includes('done') ? 'default' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Shortcut workflow</CardDescription>
                <CardTitle>Langkah berikutnya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/schedule?compose=ai" className="block rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/60">
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">AI Wizard</p>
                      <p className="text-sm text-muted-foreground">Pilih preset, atur parameter, preview hasil, lalu simpan.</p>
                    </div>
                  </div>
                </Link>
                <Link href="/dashboard/schedule?compose=manual" className="block rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/60">
                  <div className="flex items-center gap-3">
                    <FilePenLine className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Manual Entry</p>
                      <p className="text-sm text-muted-foreground">Tambah satu item atau rapikan detail konten yang sudah ada.</p>
                    </div>
                  </div>
                </Link>
                <Link href="/dashboard/schedule" className="block rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/60">
                  <div className="flex items-center gap-3">
                    <CalendarRange className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Review Table</p>
                      <p className="text-sm text-muted-foreground">Lihat semua minggu, status publish, dan detail caption dalam satu tabel.</p>
                    </div>
                  </div>
                </Link>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <Target className="size-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">North star</p>
                      <p className="text-sm text-muted-foreground">Satu source of truth untuk ide, jadwal, draft, dan status publish.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </PageShell>
  )
}
