'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { apiClient } from '@/lib/api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type AppSettings = {
  openrouter_model: string
  ai_enabled: string
}

type AdminUser = {
  id: string
  email: string
  is_superuser: boolean
  owned_workspaces: number
  ai_requests: number
  created_at: string
}

// Popular OpenRouter models for the dropdown
const OPENROUTER_MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Google Gemini 2.5 Pro' },
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
  { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
  { value: 'openai/gpt-4.1', label: 'OpenAI GPT-4.1' },
  { value: 'anthropic/claude-sonnet-4', label: 'Anthropic Claude Sonnet 4' },
  { value: 'anthropic/claude-haiku-4', label: 'Anthropic Claude Haiku 4' },
  { value: 'meta-llama/llama-4-maverick', label: 'Meta Llama 4 Maverick' },
  { value: 'deepseek/deepseek-r2', label: 'DeepSeek R2' },
  { value: 'mistralai/mistral-small-3.1-24b-instruct', label: 'Mistral Small 3.1 24B' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const { user, token } = useAuth()

  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings')

  // Local editable state for settings form
  const [draftModel, setDraftModel] = useState('')
  const [draftAiEnabled, setDraftAiEnabled] = useState(true)

  // Redirect non-superusers
  useEffect(() => {
    if (!user?.isSuperuser) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const fetchAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [settingsRes, usersRes] = await Promise.all([
        apiClient<{ settings: AppSettings }>('/admin/settings', { token }),
        apiClient<AdminUser[]>('/admin/users', { token }),
      ])
      setSettings(settingsRes.settings)
      setDraftModel(settingsRes.settings.openrouter_model)
      setDraftAiEnabled(settingsRes.settings.ai_enabled !== 'false')
      setUsers(usersRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSaveSettings = async () => {
    if (!token) return
    setSavingSettings(true)
    setSettingsMsg(null)
    try {
      await apiClient('/admin/settings', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          openrouter_model: draftModel,
          ai_enabled: draftAiEnabled ? 'true' : 'false',
        }),
      })
      setSettings({ openrouter_model: draftModel, ai_enabled: draftAiEnabled ? 'true' : 'false' })
      setSettingsMsg({ type: 'ok', text: 'Settings saved successfully.' })
    } catch (e) {
      setSettingsMsg({ type: 'err', text: e instanceof Error ? e.message : 'Failed to save' })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleToggleSuperuser = async (u: AdminUser) => {
    if (!token) return
    try {
      await apiClient(`/admin/users/${u.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_superuser: !u.is_superuser }),
      })
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_superuser: !u.is_superuser } : x)))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  const handleDeleteUser = async (u: AdminUser) => {
    if (!token) return
    if (!confirm(`Hapus user ${u.email}? Semua datanya akan ikut terhapus.`)) return
    try {
      await apiClient(`/admin/users/${u.id}`, { method: 'DELETE', token })
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  if (!user?.isSuperuser) return null

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengaturan aplikasi dan pengguna. Akses khusus superuser.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['settings', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'settings' ? '⚙ App Settings' : '👥 Users'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat...</p>
      ) : (
        <>
          {/* ─── Settings Tab ─────────────────────────────────────────────── */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-6 max-w-xl">
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                <h2 className="font-semibold text-gray-800 text-base">AI Model Configuration</h2>

                {/* AI Enabled Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">AI Features</p>
                    <p className="text-xs text-gray-500">Aktifkan atau nonaktifkan semua fitur AI untuk seluruh pengguna.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftAiEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      draftAiEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                        draftAiEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Model Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="model-select">
                    OpenRouter Model
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Model yang aktif saat ini akan dipakai oleh semua fitur AI (chat, generate konten, predict task).
                  </p>
                  <select
                    id="model-select"
                    value={draftModel}
                    onChange={(e) => setDraftModel(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    {OPENROUTER_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                    {/* Show current value if not in list */}
                    {!OPENROUTER_MODELS.find((m) => m.value === draftModel) && (
                      <option value={draftModel}>{draftModel} (custom)</option>
                    )}
                  </select>

                  {/* Custom model input */}
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">Atau masukkan model ID custom (opsional):</label>
                    <input
                      type="text"
                      placeholder="org/model-name"
                      value={draftModel}
                      onChange={(e) => setDraftModel(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </div>

                {settingsMsg && (
                  <p className={`text-sm ${settingsMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                    {settingsMsg.text}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {savingSettings ? 'Menyimpan...' : 'Simpan Settings'}
                </button>
              </div>

              {/* Current active values read-only */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nilai Aktif di DB</p>
                <dl className="space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-gray-500 w-36 shrink-0">Active Model</dt>
                    <dd className="font-mono text-gray-800 text-xs break-all">{settings.openrouter_model}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-gray-500 w-36 shrink-0">AI Enabled</dt>
                    <dd className={`font-medium ${settings.ai_enabled !== 'false' ? 'text-green-600' : 'text-red-500'}`}>
                      {settings.ai_enabled !== 'false' ? 'Aktif' : 'Nonaktif'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* ─── Users Tab ────────────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-center">Role</th>
                    <th className="px-4 py-3 text-center">Workspaces</th>
                    <th className="px-4 py-3 text-center">AI Requests</th>
                    <th className="px-4 py-3 text-center">Bergabung</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {u.email}
                        {u.id === user?.id && (
                          <span className="ml-2 text-xs text-gray-400">(kamu)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.is_superuser ? (
                          <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Superuser
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{u.owned_workspaces}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{u.ai_requests}</td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {u.id !== user?.id && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleSuperuser(u)}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${
                                  u.is_superuser
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {u.is_superuser ? 'Revoke Superuser' : 'Jadikan Superuser'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">Belum ada pengguna.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
