'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import type { Project, Task, TaskStatus } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { TaskPredictionBadge } from '@/components/features/TaskPredictionBadge'
import { TaskStatusBadge } from '@/components/ui/TaskStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageEmptyState, PageErrorState, PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { getProject } from '@/lib/api/projects'
import { createTask, getTasks, updateTask } from '@/lib/api/tasks'

const STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done']

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { token, isLoading: authLoading } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token || !id) {
      setLoading(false)
      setError('Sesi login tidak ditemukan. Silakan login ulang.')
      return
    }

    Promise.all([
      getProject(id, token),
      getTasks(token, id),
    ])
      .then(([projectResult, tasksResult]) => {
        setProject(projectResult)
        setTasks(tasksResult)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat proyek'))
      .finally(() => setLoading(false))
  }, [authLoading, id, token])

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !newTaskTitle.trim()) return
    setAdding(true)
    try {
      await createTask({ project_id: id, title: newTaskTitle.trim(), status: 'Backlog' }, token)
      setNewTaskTitle('')
      setTasks(await getTasks(token, id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah task')
    } finally {
      setAdding(false)
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    if (!token) return
    try {
      await updateTask(taskId, { status }, token)
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui status task')
    }
  }

  if (loading) {
    return (
      <PageShell>
        <PageLoadingState title="Memuat detail proyek" />
      </PageShell>
    )
  }

  if (error || !project) {
    return (
      <PageShell>
        <PageErrorState
          description={error || 'Proyek tidak ditemukan.'}
          action={
            <Link href="/dashboard/projects">
              <Button variant="outline">Kembali ke Projects</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }

  const tasksByStatus = STATUSES.map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) }))

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/dashboard/projects' },
          { label: project.name },
        ]}
        eyebrow="Superuser Lab"
        title={project.name}
        description={project.description ?? 'Proyek internal untuk mengelola task produksi.'}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tambah Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="flex flex-col gap-3 md:flex-row">
            <Input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Contoh: Review caption minggu 2"
              className="h-10 flex-1"
            />
            <Button type="submit" disabled={adding || !newTaskTitle.trim()} className="h-10">
              {adding ? 'Menambah...' : 'Tambah Task'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <PageEmptyState
          title="Belum ada task"
          description="Task produksi untuk proyek ini akan muncul di sini setelah Anda menambahkannya."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {tasksByStatus.map(({ status, tasks: list }) => (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{status}</CardTitle>
                <TaskStatusBadge status={status} />
              </CardHeader>
              <CardContent className="space-y-3">
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada task.</p>
                ) : (
                  list.map((task) => (
                    <div key={task.id} className="space-y-3 rounded-xl border border-border bg-background p-3">
                      <div className="space-y-1">
                        <p className="font-medium">{task.title}</p>
                        {task.deadline ? <p className="text-xs text-muted-foreground">Deadline: {new Date(task.deadline).toLocaleDateString('id-ID')}</p> : null}
                      </div>
                      <TaskPredictionBadge taskId={task.id} taskTitle={task.title} token={token} />
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.filter((item) => item !== task.status).map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, nextStatus)}
                          >
                            {nextStatus}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
