import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Pendaftaran Dinonaktifkan</h1>
          <p className="text-sm text-muted-foreground">
            Akun baru hanya dapat dibuat oleh admin. Hubungi superuser untuk mendapatkan akses.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Kembali ke Login</Link>
        </Button>
      </div>
    </main>
  )
}
