import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types'

const variantMap: Record<TaskStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Backlog: 'secondary',
  'In Progress': 'default',
  Review: 'outline',
  Done: 'secondary',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={variantMap[status]}>{status}</Badge>
}
