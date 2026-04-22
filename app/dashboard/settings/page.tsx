'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { fetchUserSettings, updateUserSettings, type UserSettingData } from '@/lib/api/user-settings'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']
const TONES = ['Edukatif', 'Promosi', 'Entertaining', 'Inspiratif', 'Story Telling']
const POSTING_GOALS = [
  { value: 'awareness', label: 'Brand Awareness — naikkan reach dan kenalkan brand' },
  { value: 'engagement', label: 'Engagement — dorong interaksi dan komunitas' },
  { value: 'sales', label: 'Sales / Konversi — arahkan ke pembelian atau sign-up' },
]

const EMPTY_SETTING: UserSettingData = {
  brandName: '',
  industry: '',
  niche: '',
  targetAudience: '',
  preferredPlatform: 'Instagram',
  brandVoice: 'Edukatif',
  postingGoal: 'awareness',
}

export default function SettingsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [form, setForm] = useState<UserSettingData>(EMPTY_SETTING)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchUserSettings(token)
      .then((data) => setForm(data))
      .catch(() => setError('Gagal memuat pengaturan. Coba muat ulang halaman.'))
      .finally(() => setLoading(false))
  }, [token])

  function handleChange<K extends keyof UserSettingData>(key: K, value: UserSettingData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!form.niche.trim()) {
      setError('Niche wajib diisi agar AI Wizard bisa auto-fill dan merekomendasikan campaign.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateUserSettings(form, token)
      setForm(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <PageLoadingState title="Memuat pengaturan" />

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pengaturan' },
        ]}
        eyebrow="Profil Bisnis"
        title="Pengaturan"
        description="Isi sekali, dipakai selamanya. AI Wizard akan auto-fill form berdasarkan profil ini dan bisa merekomendasikan campaign terbaik untuk bisnis Anda."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Ada masalah</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {saved ? (
          <Alert>
            <AlertTitle>Tersimpan</AlertTitle>
            <AlertDescription>
              Profil bisnis berhasil disimpan. AI Wizard akan menggunakan data ini mulai sekarang.{' '}
              <Link href="/dashboard/schedule?compose=ai" className="inline-flex items-center gap-1 font-medium underline underline-offset-4">
                Buka AI Wizard <ExternalLink className="size-3" />
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        <FormSection
          title="Identitas brand"
          description="Informasi dasar tentang brand atau bisnis Anda."
        >
          <FormGrid>
            <FormField label="Nama brand" htmlFor="brandName">
              <Input
                id="brandName"
                value={form.brandName}
                onChange={(e) => handleChange('brandName', e.target.value)}
                placeholder="Contoh: Klinik Sehat Bersama, Toko Kopi Nusantara"
                className="h-10"
              />
            </FormField>

            <FormField label="Industri" htmlFor="industry">
              <Input
                id="industry"
                value={form.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                placeholder="Contoh: Healthcare, F&B, Fashion, Properti, Edutech"
                className="h-10"
              />
            </FormField>
          </FormGrid>

          <FormField
            label="Niche"
            htmlFor="niche"
            required
            description="Lebih spesifik dari industri. Ini yang dipakai AI untuk generate konten."
          >
            <Input
              id="niche"
              value={form.niche}
              onChange={(e) => handleChange('niche', e.target.value)}
              placeholder="Contoh: klinik gigi keluarga, skincare acne-prone, catering sehat untuk kantor"
              className="h-10"
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Audiens & platform"
          description="Bantu AI memahami siapa yang dituju dan di mana konten akan dipublikasikan."
        >
          <FormField
            label="Target audience"
            htmlFor="targetAudience"
            description="Deskripsikan siapa audiens ideal Anda: demografi, masalah, kebiasaan."
          >
            <Textarea
              id="targetAudience"
              value={form.targetAudience}
              onChange={(e) => handleChange('targetAudience', e.target.value)}
              placeholder="Contoh: wanita 25-34 di kota besar yang peduli kulit tapi belum punya rutinitas skincare konsisten, banyak scroll Instagram di malam hari"
              rows={3}
            />
          </FormField>

          <FormGrid>
            <FormField label="Platform utama" description="Platform yang paling sering Anda posting.">
              <Select value={form.preferredPlatform} onValueChange={(v) => handleChange('preferredPlatform', v ?? 'Instagram')}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Brand voice" description="Tone konten yang paling mewakili brand Anda.">
              <Select value={form.brandVoice} onValueChange={(v) => handleChange('brandVoice', v ?? 'Edukatif')}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Tujuan konten"
          description="Prioritas utama konten sosial media Anda saat ini."
        >
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pilih tujuan utama posting</CardTitle>
              <CardDescription>AI akan merekomendasikan jenis campaign yang sesuai berdasarkan pilihan ini.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {POSTING_GOALS.map((goal) => {
                const active = form.postingGoal === goal.value
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => handleChange('postingGoal', goal.value)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    <p className={`text-sm font-medium leading-6 ${active ? 'text-background' : ''}`}>
                      {goal.label}
                    </p>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Profil Bisnis'}
          </Button>
        </div>
      </form>
    </PageShell>
  )
}
