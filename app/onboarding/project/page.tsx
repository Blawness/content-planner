'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createProject } from '@/lib/api/projects'

const WORKSPACE_KEY = 'content_planner_workspace_id'
const ONBOARDING_DONE = 'content_planner_onboarding_done'

export default function OnboardingProjectPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    if (typeof window !== 'undefined' && !localStorage.getItem(WORKSPACE_KEY)) {
      router.push('/onboarding/workspace')
    }
  }, [token, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    const workspaceId = typeof window !== 'undefined' ? localStorage.getItem(WORKSPACE_KEY) : null
    setError('')
    setLoading(true)
    try {
      await createProject(
        {
          name,
          description: description || undefined,
          workspace_id: workspaceId || undefined,
        },
        token
      )
      if (typeof window !== 'undefined') {
        localStorage.setItem(ONBOARDING_DONE, '1')
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat proyek')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Buat Proyek Pertama</h1>
        <p className="text-gray-600 text-center text-sm">
          Proyek untuk mengelompokkan task dan konten (misal: Ramadan Campaign).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Proyek
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Ramadan Campaign"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi (opsional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat proyek"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Membuat...' : 'Selesai & ke Dashboard'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500">
          Setelah ini Anda bisa generate content plan dari dashboard.
        </p>
      </div>
    </div>
  )
}
