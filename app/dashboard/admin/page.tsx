'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/providers/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { FormField } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api/client'

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

export default function AdminPage() {
  const router = useRouter()
  const { user, token, isLoading: authLoading } = useAuth()

  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings')
  const [draftModel, setDraftModel] = useState('')
  const [draftAiEnabled, setDraftAiEnabled] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user?.isSuperuser) {
      router.replace('/dashboard')
    }
  }, [authLoading, router, user])

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
    } catch (err) {
      setSettingsMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal memuat data admin' })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleSaveSettings() {
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
      setSettingsMsg({ type: 'ok', text: 'Settings berhasil disimpan.' })
    } catch (err) {
      setSettingsMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menyimpan settings' })
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleToggleSuperuser(targetUser: AdminUser) {
    if (!token) return
    try {
      await apiClient(`/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_superuser: !targetUser.is_superuser }),
      })
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, is_superuser: !targetUser.is_superuser } : item)))
    } catch (err) {
      setSettingsMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengubah role' })
    }
  }

  async function handleDeleteUser(targetUser: AdminUser) {
    if (!token) return
    if (!window.confirm(`Hapus user ${targetUser.email}? Semua datanya akan ikut terhapus.`)) return
    try {
      await apiClient(`/admin/users/${targetUser.id}`, { method: 'DELETE', token })
      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id))
    } catch (err) {
      setSettingsMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menghapus user' })
    }
  }

  if (!user?.isSuperuser) return null

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin Panel' },
        ]}
        eyebrow="Superuser"
        title="Admin Panel"
        description="Kelola konfigurasi AI dan pengguna dari satu halaman internal. Area ini hanya tampil untuk superuser."
      />

      {loading ? <PageLoadingState title="Memuat panel admin" /> : null}

      {!loading ? (
        <>
          <div className="flex gap-2 border-b border-border">
            {(['settings', 'users'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'settings' ? 'App Settings' : 'Users'}
              </button>
            ))}
          </div>

          {settingsMsg ? (
            <Alert variant={settingsMsg.type === 'err' ? 'destructive' : 'default'}>
              <AlertDescription>{settingsMsg.text}</AlertDescription>
            </Alert>
          ) : null}

          {activeTab === 'settings' && settings ? (
            <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>AI Model Configuration</CardTitle>
                  <CardDescription>Pengaturan ini berlaku global untuk fitur AI di aplikasi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField label="AI Features" description="Aktifkan atau nonaktifkan semua fitur AI untuk seluruh pengguna.">
                    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                      <div>
                        <p className="font-medium">{draftAiEnabled ? 'Aktif' : 'Nonaktif'}</p>
                        <p className="text-sm text-muted-foreground">Status sekarang mengikuti draft yang akan disimpan.</p>
                      </div>
                      <Switch checked={draftAiEnabled} onCheckedChange={setDraftAiEnabled} />
                    </div>
                  </FormField>

                  <FormField label="OpenRouter model" description="Pilih model utama yang akan dipakai seluruh fitur AI.">
                    <Select value={draftModel} onValueChange={(value) => setDraftModel(value ?? '')}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPENROUTER_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                        ))}
                        {!OPENROUTER_MODELS.find((model) => model.value === draftModel) ? (
                          <SelectItem value={draftModel}>{draftModel}</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Model custom" htmlFor="custom-model" description="Gunakan jika model yang Anda butuhkan belum ada di daftar preset.">
                    <Input id="custom-model" value={draftModel} onChange={(e) => setDraftModel(e.target.value)} placeholder="org/model-name" className="h-10" />
                  </FormField>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleSaveSettings} disabled={savingSettings}>
                      {savingSettings ? 'Menyimpan...' : 'Simpan Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nilai Aktif</CardTitle>
                  <CardDescription>Snapshot pengaturan yang saat ini tersimpan di database.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active Model</p>
                    <p className="mt-1 break-all font-mono">{settings.openrouter_model}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">AI Enabled</p>
                    <p className="mt-1 font-medium">{settings.ai_enabled !== 'false' ? 'Aktif' : 'Nonaktif'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'users' ? (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Kelola akses superuser dan hapus akun yang sudah tidak dipakai.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Role</th>
                      <th className="py-3 pr-4">Workspaces</th>
                      <th className="py-3 pr-4">AI Requests</th>
                      <th className="py-3 pr-4">Bergabung</th>
                      <th className="py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((targetUser) => (
                      <tr key={targetUser.id} className="border-b border-border/70 last:border-b-0">
                        <td className="py-3 pr-4 font-medium">
                          {targetUser.email}
                          {targetUser.id === user.id ? <span className="ml-2 text-xs text-muted-foreground">(kamu)</span> : null}
                        </td>
                        <td className="py-3 pr-4">{targetUser.is_superuser ? 'Superuser' : 'User'}</td>
                        <td className="py-3 pr-4">{targetUser.owned_workspaces}</td>
                        <td className="py-3 pr-4">{targetUser.ai_requests}</td>
                        <td className="py-3 pr-4">{new Date(targetUser.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 text-right">
                          {targetUser.id !== user.id ? (
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => handleToggleSuperuser(targetUser)}>
                                {targetUser.is_superuser ? 'Revoke Superuser' : 'Jadikan Superuser'}
                              </Button>
                              <Button type="button" variant="destructive" size="sm" onClick={() => handleDeleteUser(targetUser)}>
                                Hapus
                              </Button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </PageShell>
  )
}
