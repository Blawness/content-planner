'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

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
      <Alert variant="destructive" className="max-w-sm">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Terjadi kesalahan</AlertTitle>
        <AlertDescription>{error.message || 'Silakan coba lagi.'}</AlertDescription>
      </Alert>
      <Button onClick={reset} variant="outline">
        Coba lagi
      </Button>
    </div>
  )
}
