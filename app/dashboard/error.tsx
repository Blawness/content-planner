'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
      <p className="text-red-600 text-center">Terjadi kesalahan.</p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  )
}
