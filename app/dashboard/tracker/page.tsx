'use client'

import { useEffect, useState } from 'react'

import type { Task, TimeEntry } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/Card'
import { FormField, FormSection } from '@/components/ui/form-layout'
import { PageEmptyState, PageErrorState, PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTasks } from '@/lib/api/tasks'
import { getTimeEntries, startTimeEntry, stopTimeEntry } from '@/lib/api/time-entries'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}j ${m}m`
  return `${m}m`
}

export default function TrackerPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [runningEntryId, setRunningEntryId] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token, isLoading: authLoading } = useAuth()
  const isUnauthorized = !authLoading && !token

  useEffect(() => {
    if (!token) return

    getTasks(token)
      .then(setTasks)
      .catch(() => setTasks([]))

    getTimeEntries(token)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!runningEntryId) return
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [runningEntryId])

  async function handleStart() {
    if (!token || !selectedTaskId) return
    setError('')
    try {
      const entry = await startTimeEntry(selectedTaskId, token)
      setRunningEntryId(entry.id)
      setElapsed(0)
      setEntries(await getTimeEntries(token))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal start timer')
    }
  }

  async function handleStop() {
    if (!token || !runningEntryId) return
    setError('')
    try {
      await stopTimeEntry(runningEntryId, token)
      setRunningEntryId(null)
      setEntries(await getTimeEntries(token))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal stop timer')
    }
  }

  const runningTask = runningEntryId
    ? tasks.find((task) => entries.some((entry) => entry.id === runningEntryId && entry.task_id === task.id))
    : null

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Time Tracker' },
        ]}
        eyebrow="Superuser Lab"
        title="Time Tracker"
        description="Pelacak waktu internal untuk task produksi. Flow user utama tetap tidak bergantung pada modul ini."
      />

      {authLoading || (token && loading) ? <PageLoadingState title="Memuat tracker" /> : null}
      {!authLoading && isUnauthorized ? <PageErrorState description="Sesi login tidak ditemukan. Silakan login ulang." /> : null}
      {!authLoading && !isUnauthorized && !loading && error ? <PageErrorState description={error} /> : null}

      {!authLoading && !isUnauthorized && !loading && !error ? (
        <>
          <FormSection title="Timer aktif" description="Pilih task lalu mulai timer untuk melacak waktu pengerjaan.">
            <FormField label="Pilih task">
              <Select value={selectedTaskId ?? ''} onValueChange={(value) => setSelectedTaskId(value || null)} disabled={Boolean(runningEntryId)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {tasks.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada task. Buat task di Projects.</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {!runningEntryId ? (
                <Button onClick={handleStart} disabled={!selectedTaskId}>Start Timer</Button>
              ) : (
                <>
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 font-mono text-lg">{formatDuration(elapsed)}</div>
                  <Button variant="outline" onClick={handleStop}>Stop Timer</Button>
                  {runningTask ? <p className="text-sm text-muted-foreground">Task aktif: {runningTask.title}</p> : null}
                </>
              )}
            </div>
          </FormSection>

          {entries.length === 0 ? (
            <PageEmptyState title="Belum ada time entry" description="Riwayat timer akan muncul di sini setelah Anda menjalankan tracker." />
          ) : (
            <Card>
              <CardContent className="space-y-2">
                <h2 className="font-semibold">Riwayat</h2>
                {entries.slice(0, 20).map((entry) => {
                  const task = tasks.find((item) => item.id === entry.task_id)
                  return (
                    <div key={entry.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0">
                      <span>{task?.title ?? entry.task_id}</span>
                      <span className="font-mono text-muted-foreground">{formatDuration(entry.duration ?? 0)}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </PageShell>
  )
}
