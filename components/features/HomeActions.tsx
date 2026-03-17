'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export function HomeActions() {
  const router = useRouter()
  const { enterAsGuest } = useAuth()

  function handleGuestEnter() {
    enterAsGuest()
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleGuestEnter}
      className="px-4 py-2 rounded-lg border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50"
    >
      Masuk sebagai tamu
    </button>
  )
}
