'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

import type { ContentIdea } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FormActions, FormField, FormGrid, FormSection } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { PageHeader, PageShell } from '@/components/ui/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateContent } from '@/lib/api/ai'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']

export default function IdeasPage() {
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [goal, setGoal] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [count, setCount] = useState(3)
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()
  const router = useRouter()

  function handleUseForSchedule() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'content_planner_schedule_prefill',
        JSON.stringify({ niche, platform, goal, targetAudience })
      )
    }
    router.push('/dashboard/schedule?compose=ai')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)
    setIdeas([])
    try {
      const res = await generateContent(
        { niche, platform, goal, target_audience: targetAudience, count },
        token
      )
      setIdeas(res.ideas ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal generate ide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Ideas' },
        ]}
        eyebrow="Superuser Lab"
        title="AI Content Ideas"
        description="Generator ide ini tetap tersedia untuk eksplorasi, tetapi output utamanya diarahkan kembali ke Content Plan wizard."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Idea brief" description="Masukkan konteks singkat sebelum AI menyusun daftar ide awal.">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <FormGrid>
            <FormField label="Niche bisnis" htmlFor="niche" required>
              <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Contoh: Skincare, F&B" className="h-10" />
            </FormField>
            <FormField label="Platform">
              <Select value={platform} onValueChange={(value) => setPlatform(value ?? PLATFORMS[0])}>
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
          </FormGrid>

          <FormField label="Goal konten" htmlFor="goal" required>
            <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Contoh: Brand awareness, konversi" className="h-10" />
          </FormField>

          <FormGrid>
            <FormField label="Target audience" htmlFor="audience" required>
              <Input id="audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Contoh: wanita 25-34 di kota besar" className="h-10" />
            </FormField>
            <FormField label="Jumlah ide" htmlFor="count">
              <Input id="count" type="number" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-10" />
            </FormField>
          </FormGrid>

          <FormActions className="justify-between sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">Jika hasilnya cocok, Anda bisa kirim brief ini ke AI wizard Content Plan.</p>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generate...' : 'Generate Ide'}
            </Button>
          </FormActions>
        </FormSection>
      </form>

      {ideas.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Hasil ide</h2>
              <p className="text-sm text-muted-foreground">Review cepat sebelum dikirim ke Content Plan.</p>
            </div>
            <Button type="button" variant="outline" onClick={handleUseForSchedule}>
              <Sparkles className="size-4" />
              Kirim ke AI Wizard
            </Button>
          </div>
          <div className="grid gap-4">
            {ideas.map((idea, index) => (
              <Card key={`${idea.title}-${index}`}>
                <CardHeader>
                  <CardTitle className="text-base">{idea.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Hook:</span> {idea.hook}</p>
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Format:</span> {idea.format}</p>
                  {idea.caption_draft ? <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Caption draft:</span> {idea.caption_draft}</p> : null}
                  {idea.cta ? <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">CTA:</span> {idea.cta}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
