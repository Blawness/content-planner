'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/providers/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api/client'

type AppSettings = {
  openrouter_model: string
  ai_enabled: string
}

type UserRole = 'superuser' | 'admin' | 'user'

type AdminUser = {
  id: string
  email: string
  is_superuser: boolean
  is_admin: boolean
  role: UserRole
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

const ROLE_BADGE: Record<UserRole, string> = {
  superuser: 'bg-destructive/15 text-destructive',
  admin:     'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  user:      'bg-muted text-muted-foreground',
}

const ROLE_LABEL: Record<UserRole, string> = {
  superuser: 'Superuser',
  admin:     'Admin',
  user:      'User',
}

type CreateForm = { email: string; password: string; role: 'admin' | 'user' }
type EditForm   = { email: string; password: string; role: 'admin' | 'user' }

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

  // Create user modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({ email: '', password: '', role: 'user' })
  const [createErr, setCreateErr] = useState('')

  // Edit user modal
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({ email: '', password: '', role: 'user' })
  const [editErr, setEditErr] = useState('')

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

  function openCreateModal() {
    setCreateForm({ email: '', password: '', role: 'user' })
    setCreateErr('')
    setShowCreate(true)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setCreating(true)
    setCreateErr('')
    try {
      const newUser = await apiClient<AdminUser>('/admin/users', {
        method: 'POST',
        token,
        body: JSON.stringify(createForm),
      })
      setUsers((prev) => [...prev, newUser])
      setShowCreate(false)
    } catch (err) {
      setCreateErr(err instanceof Error ? err.message : 'Gagal membuat user')
    } finally {
      setCreating(false)
    }
  }

  function openEditModal(targetUser: AdminUser) {
    const role: 'admin' | 'user' = targetUser.is_admin ? 'admin' : 'user'
    setEditForm({ email: targetUser.email, password: '', role })
    setEditErr('')
    setEditingUser(targetUser)
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editingUser) return
    setSaving(true)
    setEditErr('')
    try {
      const body: Record<string, unknown> = { role: editForm.role }
      if (editForm.email !== editingUser.email) body.email = editForm.email
      if (editForm.password) body.password = editForm.password

      const updated = await apiClient<AdminUser>(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(body),
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setEditingUser(null)
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
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
                {tab === 'settings' ? 'App Settings' : `Users (${users.length})`}
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
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Buat akun baru atau edit data user. Registrasi publik dinonaktifkan.
                    Role <strong>Superuser</strong> hanya bisa diatur via console/DB.
                  </CardDescription>
                </div>
                <Button type="button" onClick={openCreateModal} className="shrink-0">
                  + Buat User
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
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
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[targetUser.role]}`}>
                            {ROLE_LABEL[targetUser.role]}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{targetUser.owned_workspaces}</td>
                        <td className="py-3 pr-4">{targetUser.ai_requests}</td>
                        <td className="py-3 pr-4">{new Date(targetUser.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(targetUser)}
                              disabled={targetUser.is_superuser && targetUser.id !== user.id}
                            >
                              Edit
                            </Button>
                            {targetUser.id !== user.id && !targetUser.is_superuser ? (
                              <Button type="button" variant="destructive" size="sm" onClick={() => handleDeleteUser(targetUser)}>
                                Hapus
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada user.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {/* Create User Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat User Baru</DialogTitle>
            <DialogDescription>
              Akun akan langsung aktif. User bisa login dengan email dan password yang kamu isi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            {createErr ? (
              <Alert variant="destructive">
                <AlertDescription>{createErr}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                required
                autoComplete="off"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Minimal 6 karakter"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as 'admin' | 'user' }))}
              >
                <SelectTrigger id="create-role" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                Batal
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Membuat...' : 'Buat User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Kosongkan field password jika tidak ingin mengubahnya.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            {editErr ? (
              <Alert variant="destructive">
                <AlertDescription>{editErr}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                required
                autoComplete="off"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password Baru</Label>
              <Input
                id="edit-password"
                type="password"
                autoComplete="new-password"
                placeholder="Kosongkan jika tidak ingin diubah"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as 'admin' | 'user' }))}
              >
                <SelectTrigger id="edit-role" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
