import type { TaskStatus as PrismaTaskStatus } from '@prisma/client'

export type ApiTaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done'

const statusMap: Record<PrismaTaskStatus, ApiTaskStatus> = {
  BACKLOG: 'Backlog',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
}

export function toApiTaskStatus(s: PrismaTaskStatus): ApiTaskStatus {
  return statusMap[s]
}

export function fromApiTaskStatus(s: string): PrismaTaskStatus | null {
  const entry = Object.entries(statusMap).find(([, v]) => v === s)
  return entry ? (entry[0] as PrismaTaskStatus) : null
}

export function formatDate(d: Date | null): string | null {
  return d ? d.toISOString() : null
}
