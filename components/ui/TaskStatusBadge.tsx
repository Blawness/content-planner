import type { TaskStatus } from '@/types'

const styles: Record<TaskStatus, string> = {
  Backlog: 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-800',
  Review: 'bg-amber-100 text-amber-800',
  Done: 'bg-green-100 text-green-800',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  )
}
