'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { getProject } from '@/lib/api/projects'
import { getTasks, createTask, updateTask } from '@/lib/api/tasks'
import type { Project, Task, TaskStatus } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TaskStatusBadge } from '@/components/ui/TaskStatusBadge'
import { TaskPredictionBadge } from '@/components/features/TaskPredictionBadge'

const STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done']

const DEMO_PROJECTS: Record<string, Project> = {
  'demo-1': { id: 'demo-1', workspace_id: 'ws-1', name: 'Ramadan Campaign', description: 'Konten campaign Ramadan 30 hari', start_date: null, end_date: null },
  'demo-2': { id: 'demo-2', workspace_id: 'ws-1', name: 'Product Launch Q2', description: 'Launch produk baru Instagram + TikTok', start_date: null, end_date: null },
}

const DEMO_TASKS: Task[] = [
  { id: 't1', project_id: 'demo-1', title: 'Buat moodboard konten', description: null, status: 'Done', assignee: null, deadline: null },
  { id: 't2', project_id: 'demo-1', title: 'Script video Reels', description: null, status: 'In Progress', assignee: null, deadline: null },
  { id: 't3', project_id: 'demo-1', title: 'Review caption', description: null, status: 'Backlog', assignee: null, deadline: null },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const { token, isGuest } = useAuth()
  const router = useRouter()

  function load() {
    if (isGuest && (id === 'demo-1' || id === 'demo-2')) {
      setProject(DEMO_PROJECTS[id] ?? null)
      setTasks(id === 'demo-1' ? DEMO_TASKS : [])
      setLoading(false)
      return
    }
    if (!token || !id) {
      setLoading(false)
      return
    }
    getProject(id, token)
      .then(setProject)
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat proyek'))
    getTasks(token, id)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id, isGuest])

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (isGuest) return
    if (!token || !newTaskTitle.trim()) return
    setAdding(true)
    try {
      await createTask({ project_id: id, title: newTaskTitle.trim(), status: 'Backlog' }, token)
      setNewTaskTitle('')
      getTasks(token, id).then(setTasks)
    } finally {
      setAdding(false)
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    if (isGuest) return
    if (!token) return
    try {
      await updateTask(taskId, { status }, token)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Proyek tidak ditemukan.'}</p>
        <Link href="/dashboard/projects" className="text-sm text-gray-600 hover:underline mt-2 inline-block">
          Kembali ke Projects
        </Link>
      </div>
    )
  }

  const tasksByStatus = STATUSES.map((s) => ({ status: s, tasks: tasks.filter((t) => t.status === s) }))

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/dashboard/projects" className="text-sm text-gray-600 hover:underline">
          ← Projects
        </Link>
      </div>
      {isGuest && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
          Mode tamu: data contoh. Login untuk mengedit task.
        </p>
      )}
      <h1 className="text-2xl font-bold mb-1">{project.name}</h1>
      {project.description && <p className="text-gray-600 mb-6">{project.description}</p>}

      {!isGuest && (
      <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Judul task baru..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <Button type="submit" disabled={adding || !newTaskTitle.trim()}>
          {adding ? 'Menambah...' : 'Tambah Task'}
        </Button>
      </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tasksByStatus.map(({ status, tasks: list }) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="font-medium">{status}</span>
              <TaskStatusBadge status={status} />
            </CardHeader>
            <CardContent className="space-y-2">
              {list.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada</p>
              ) : (
                list.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 rounded border border-gray-100 bg-gray-50 group"
                  >
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.deadline && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Deadline: {new Date(task.deadline).toLocaleDateString('id-ID')}
                      </p>
                    )}
                    <TaskPredictionBadge taskId={task.id} taskTitle={task.title} token={token} />
                    {!isGuest && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {STATUSES.filter((s) => s !== task.status).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatusChange(task.id, s)}
                          className="text-xs px-2 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100"
                        >
                          → {s}
                        </button>
                      ))}
                    </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
