import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/components/ui/page-shell'

export default function DashboardLoading() {
  return (
    <PageShell className="space-y-4">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </PageShell>
  )
}
