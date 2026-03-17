'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createWorkspace } from '@/lib/api/workspaces'

const WORKSPACE_KEY = 'content_planner_workspace_id'

export default function OnboardingWorkspacePage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      router.push('/login')
      return
    }
    setError('')
    setLoading(true)
    try {
      const ws = await createWorkspace({ name }, token)
      if (typeof window !== 'undefined') {
        localStorage.setItem(WORKSPACE_KEY, ws.id)
      }
      router.push('/onboarding/project')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Buat Workspace</h1>
        <p className="text-gray-600 text-center text-sm">
          Workspace untuk mengelola proyek dan tim konten.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Workspace
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Tim Marketing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Membuat...' : 'Lanjut'}
          </button>
        </form>
      </div>
    </div>
  )
}
