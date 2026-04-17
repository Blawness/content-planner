import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight, FileText, LoaderCircle, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'

type BreadcrumbItem = {
  label: string
  href?: string
}

export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8', className)}>{children}</div>
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  eyebrow,
}: {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  eyebrow?: string
}) {
  return (
    <header className="flex flex-col gap-4">
      {breadcrumbs && breadcrumbs.length > 0 ? <PageBreadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl space-y-2">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p> : null}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            {description ? <p className="text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-medium text-foreground' : undefined)}>{item.label}</span>
            )}
            {!isLast ? <ChevronRight className="size-3.5" aria-hidden="true" /> : null}
          </span>
        )
      })}
    </nav>
  )
}

export function PageLoadingState({
  title = 'Memuat halaman',
  description = 'Menyiapkan data terbaru untuk Anda.',
}: {
  title?: string
  description?: string
}) {
  return (
    <Card>
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-center">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function PageEmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon ?? <FileText className="size-6" aria-hidden="true" />}
        </div>
        <div className="max-w-md space-y-1">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
      </CardContent>
    </Card>
  )
}

export function PageErrorState({
  title = 'Terjadi kesalahan',
  description,
  action,
}: {
  title?: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </div>
        <div className="max-w-md space-y-1">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
