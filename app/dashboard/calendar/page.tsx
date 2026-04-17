'use client'

import Link from 'next/link'
import { CalendarClock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageEmptyState, PageHeader, PageShell } from '@/components/ui/page-shell'

export default function CalendarPage() {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Content Calendar' },
        ]}
        eyebrow="Superuser Lab"
        title="Content Calendar"
        description="Halaman ini masih experimental. Source of truth untuk user tetap berada di Content Plan."
        actions={
          <Link href="/dashboard/schedule">
            <Button>Lihat Content Plan</Button>
          </Link>
        }
      />

      <PageEmptyState
        icon={<CalendarClock className="size-6" aria-hidden="true" />}
        title="Calendar belum diaktifkan untuk user"
        description="Flow utama sengaja disederhanakan ke satu modul dulu. Saat ini review, generate, dan pengeditan dilakukan langsung dari Content Plan."
        action={
          <Link href="/dashboard/schedule?compose=ai">
            <Button>Buka AI Wizard</Button>
          </Link>
        }
      />
    </PageShell>
  )
}
