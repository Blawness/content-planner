'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getTasks } from '@/lib/api/tasks'
import { getTimeEntries, startTimeEntry, stopTimeEntry } from '@/lib/api/time-entries'
import type { Task, TimeEntry } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
  const { token } = useAuth()

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
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [runningEntryId])

  async function handleStart() {
    if (!token || !selectedTaskId) return
    setError('')
    try {
      const entry = await startTimeEntry(selectedTaskId, token)
      setRunningEntryId(entry.id)
      setElapsed(0)
      const list = await getTimeEntries(token)
      setEntries(list)
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
      const list = await getTimeEntries(token)
      setEntries(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal stop timer')
    }
  }

  const runningTask = runningEntryId
    ? tasks.find((t) => entries.some((e) => e.id === runningEntryId && e.task_id === t.id))
    : null

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Time Tracker</h1>
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Time Tracker</h1>
      <p className="text-gray-600 mb-6">Pilih task dan mulai timer untuk melacak waktu pengerjaan.</p>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
          {error}
        </p>
      )}

      <Card className="mb-6">
        <CardContent className="pt-4">
          <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
            Pilih task
          </label>
          <select
            id="task"
            value={selectedTaskId ?? ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            disabled={!!runningEntryId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-4"
          >
            <option value="">-- Pilih task --</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} {t.project_id ? `(Project)` : ''}
              </option>
            ))}
          </select>
          {tasks.length === 0 && (
            <p className="text-sm text-gray-500 mb-4">Belum ada task. Buat task di Projects.</p>
          )}
          <div className="flex items-center gap-4">
            {!runningEntryId ? (
              <Button onClick={handleStart} disabled={!selectedTaskId}>
                Start Timer
              </Button>
            ) : (
              <>
                <span className="font-mono text-lg">
                  {formatDuration(elapsed)}
                </span>
                <Button variant="secondary" onClick={handleStop}>
                  Stop Timer
                </Button>
                {runningTask && (
                  <span className="text-sm text-gray-500">Task: {runningTask.title}</span>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-2">Riwayat</h2>
      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada time entry.</p>
      ) : (
        <ul className="space-y-2">
          {entries.slice(0, 20).map((e) => {
            const task = tasks.find((t) => t.id === e.task_id)
            const dur = e.duration ?? 0
            return (
              <li key={e.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm">{task?.title ?? e.task_id}</span>
                <span className="text-sm text-gray-500 font-mono">{formatDuration(dur)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
