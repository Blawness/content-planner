'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DatePicker from 'react-datepicker'
import { format, isValid, parse } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarClock, ChevronDown, PencilLine, Sparkles, WandSparkles } from 'lucide-react'

import type { ContentPlanRow } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { PageEmptyState, PageErrorState, PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { fetchContentPlan, createContentPlanItem, updateContentPlanItem, deleteContentPlanItem, deleteAllContentPlan, batchCreateContentPlan } from '@/lib/api/content-plan'
import { useGenerateScheduleStream } from '@/hooks/useGenerateScheduleStream'
import { cn } from '@/lib/utils'
import 'react-datepicker/dist/react-datepicker.css'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']
const TONES = ['Edukatif', 'Promosi', 'Entertaining', 'Inspiratif', 'Story Telling']
const FORMAT_OPTIONS = ['Single Post', 'Carousel', 'Reels']
const STATUS_OPTIONS = ['To Do', 'In Review', 'Done']
const WIZARD_STEPS = ['Preset', 'Konfigurasi', 'Preview']

const AI_PRESETS = [
  {
    id: 'awareness',
    label: 'Awareness',
    summary: 'Edukasi ringan untuk menaikkan reach dan membangun trust awal.',
    defaults: {
      tone: 'Edukatif',
      contentIdea: 'Bangun awareness dengan edukasi sederhana dan topik yang mudah dibagikan.',
      contentPerWeek: 3,
      durationWeeks: 2,
    },
    examples: ['Mitos vs fakta', 'Kesalahan paling umum', 'FAQ singkat untuk pemula'],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    summary: 'Mendorong komentar, save, dan interaksi komunitas.',
    defaults: {
      tone: 'Entertaining',
      contentIdea: 'Aktifkan interaksi lewat opini, checklist, dan format yang mengundang respons.',
      contentPerWeek: 4,
      durationWeeks: 2,
    },
    examples: ['A atau B', 'Checklist mingguan', 'Cerita relatable dari audiens'],
  },
  {
    id: 'launch',
    label: 'Product Launch',
    summary: 'Menyiapkan rangkaian konten teaser, value, dan CTA menjelang promo.',
    defaults: {
      tone: 'Promosi',
      contentIdea: 'Bangun minat menuju peluncuran produk dengan teaser, demo, dan CTA yang jelas.',
      contentPerWeek: 5,
      durationWeeks: 3,
    },
    examples: ['Teaser fitur utama', 'Before-after', 'Social proof dan CTA'],
  },
]

const EMPTY_ROW: ContentPlanRow = {
  week_label: '',
  date: '',
  day: '',
  topic: '',
  format: 'Single Post',
  headline: '',
  visual_description: '',
  content_body: '',
  hook_caption: '',
  scheduled_time: '10:00 WIB',
  status: 'To Do',
  notes: 'Baru',
}

function getStatusCellClass(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('done')) return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
  if (normalized.includes('review')) return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
  return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
}

function parseUiDate(value: string) {
  const parsed = parse(value, 'dd/MM/yyyy', new Date())
  return isValid(parsed) ? parsed : null
}

function formatUiDate(date: Date) {
  return format(date, 'dd/MM/yyyy')
}

function getUiDay(date: Date) {
  const label = format(date, 'EEEE', { locale: localeId })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function sortRows(rows: ContentPlanRow[]) {
  return [...rows].sort((a, b) => {
    const dateA = parseUiDate(a.date)
    const dateB = parseUiDate(b.date)
    if (!dateA || !dateB) return a.week_label.localeCompare(b.week_label)
    return dateA.getTime() - dateB.getTime()
  })
}

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, isLoading: authLoading } = useAuth()
  const { generateScheduleStream } = useGenerateScheduleStream()

  const [rows, setRows] = useState<ContentPlanRow[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [pageError, setPageError] = useState('')

  const [showCrudModal, setShowCrudModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formRow, setFormRow] = useState<ContentPlanRow>(EMPTY_ROW)
  const [formError, setFormError] = useState('')
  const [savingRow, setSavingRow] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const [wizardStep, setWizardStep] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState(AI_PRESETS[0].id)
  const [contentPerWeek, setContentPerWeek] = useState(AI_PRESETS[0].defaults.contentPerWeek)
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [niche, setNiche] = useState('')
  const [contentIdea, setContentIdea] = useState(AI_PRESETS[0].defaults.contentIdea)
  const [monthLabel, setMonthLabel] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(AI_PRESETS[0].defaults.durationWeeks)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [tone, setTone] = useState(AI_PRESETS[0].defaults.tone)
  const [aiTargetAudience, setAiTargetAudience] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [aiError, setAiError] = useState('')
  const [previewRows, setPreviewRows] = useState<ContentPlanRow[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [savingPreview, setSavingPreview] = useState(false)
  const [streamProgress, setStreamProgress] = useState({ current: 0, total: 0 })
  const [streamMessage, setStreamMessage] = useState('')
  const isUnauthorized = !authLoading && !token

  const pendingItemsRef = useRef<ContentPlanRow[]>([])

  const selectedPreset = useMemo(
    () => AI_PRESETS.find((preset) => preset.id === selectedPresetId) ?? AI_PRESETS[0],
    [selectedPresetId]
  )

  const weekKeys = useMemo(
    () => Array.from(new Set(sortRows(rows).map((row) => row.week_label).filter(Boolean))),
    [rows]
  )

  const previewWeekKeys = useMemo(
    () => Array.from(new Set(sortRows(previewRows).map((row) => row.week_label).filter(Boolean))),
    [previewRows]
  )

  const estimatedCount = contentPerWeek * durationWeeks

  const setWizardDefaultsFromPreset = useCallback((presetId: string) => {
    const preset = AI_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    setSelectedPresetId(preset.id)
    setTone(preset.defaults.tone)
    setContentIdea(preset.defaults.contentIdea)
    setContentPerWeek(preset.defaults.contentPerWeek)
    setDurationWeeks(preset.defaults.durationWeeks)
  }, [])

  const resetWizardState = useCallback(() => {
    setWizardStep(0)
    setWizardDefaultsFromPreset(AI_PRESETS[0].id)
    setPlatform(PLATFORMS[0])
    setNiche('')
    setAiTargetAudience('')
    setMonthLabel('')
    setStartDate(null)
    setReplaceExisting(false)
    setAiError('')
    setPreviewRows([])
    setPreviewLoading(false)
    setSavingPreview(false)
    setStreamProgress({ current: 0, total: 0 })
    setStreamMessage('')
    pendingItemsRef.current = []
  }, [setWizardDefaultsFromPreset])

  const openAiWizard = useCallback(() => {
    resetWizardState()
    setShowAiModal(true)
  }, [resetWizardState])

  const closeAiWizard = useCallback(() => {
    setShowAiModal(false)
    setAiError('')
    setPreviewRows([])
    setPreviewLoading(false)
    setSavingPreview(false)
    setStreamProgress({ current: 0, total: 0 })
    setStreamMessage('')
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingIndex(null)
    setFormRow(EMPTY_ROW)
    setFormError('')
    setShowCrudModal(true)
  }, [])

  useEffect(() => {
    if (!token) return

    fetchContentPlan(token)
      .then((items) => setRows(sortRows(items)))
      .catch((err) => setPageError(err instanceof Error ? err.message : 'Gagal memuat content plan'))
      .finally(() => setLoadingItems(false))
  }, [token])

  useEffect(() => {
    const compose = searchParams.get('compose')
    if (compose === 'manual') {
      openCreateModal()
      router.replace('/dashboard/schedule', { scroll: false })
    }
    if (compose === 'ai') {
      openAiWizard()
      router.replace('/dashboard/schedule', { scroll: false })
    }
  }, [openAiWizard, openCreateModal, router, searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('content_planner_schedule_prefill')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.niche) setNiche(data.niche)
      if (data.platform) setPlatform(data.platform)
      if (data.goal) setContentIdea(data.goal)
      if (data.targetAudience) setAiTargetAudience(data.targetAudience)
      openAiWizard()
    } catch {
      // Ignore invalid local storage payload.
    }
    localStorage.removeItem('content_planner_schedule_prefill')
  }, [openAiWizard])

  function handleFormRowChange<K extends keyof ContentPlanRow>(key: K, value: ContentPlanRow[K]) {
    setFormRow((prev) => ({ ...prev, [key]: value }))
  }

  function handleEdit(index: number) {
    setFormRow(rows[index])
    setEditingIndex(index)
    setFormError('')
    setShowCrudModal(true)
  }

  function handleCancelCrudModal() {
    setShowCrudModal(false)
    setEditingIndex(null)
    setFormRow(EMPTY_ROW)
    setFormError('')
  }

  async function handleRowSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!formRow.week_label || !formRow.date || !formRow.day || !formRow.topic || !formRow.headline) {
      setFormError('Lengkapi minimal minggu, tanggal, hari, topik, dan headline.')
      return
    }

    if (!token) return
    setSavingRow(true)
    try {
      if (editingIndex === null) {
        const saved = await createContentPlanItem(formRow, token)
        setRows((prev) => sortRows([...prev, saved]))
      } else {
        const item = rows[editingIndex]
        if (item.id) {
          const saved = await updateContentPlanItem(item.id, formRow, token)
          setRows((prev) => sortRows(prev.map((row, index) => (index === editingIndex ? saved : row))))
        }
      }
      handleCancelCrudModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan item')
    } finally {
      setSavingRow(false)
    }
  }

  async function handleDelete(index: number) {
    const item = rows[index]
    const confirmed = window.confirm(`Hapus item "${item.headline}" dari content plan?`)
    if (!confirmed) return

    try {
      if (item.id && token) {
        await deleteContentPlanItem(item.id, token)
      }
      setRows((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
      if (expandedIndex === index) setExpandedIndex(null)
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Gagal menghapus item')
    }
  }

  async function handlePreviewGenerate() {
    if (!token) return
    setAiError('')
    setPreviewRows([])
    setPreviewLoading(true)
    setWizardStep(2)
    setStreamProgress({ current: 0, total: 0 })
    setStreamMessage('')
    pendingItemsRef.current = []

    try {
      await generateScheduleStream(
        {
          content_per_week: contentPerWeek,
          platform,
          niche,
          content_idea: contentIdea || undefined,
          month_label: monthLabel || undefined,
          duration_weeks: durationWeeks,
          start_date: startDate ? format(startDate, 'dd/MM/yyyy') : undefined,
          tone,
          target_audience: aiTargetAudience || undefined,
        },
        token,
        {
          onStart: (total) => {
            setStreamProgress({ current: 0, total })
            setStreamMessage(`Menyiapkan preview ${total} konten`)
          },
          onProgress: (message, generated, total) => {
            setStreamMessage(message)
            setStreamProgress({ current: generated, total })
          },
          onItem: (item, count, total) => {
            pendingItemsRef.current.push(item)
            setPreviewRows((prev) => sortRows([...prev, item]))
            setStreamProgress({ current: count, total })
            setStreamMessage(`Preview ${count}/${total} siap direview`)
          },
          onComplete: (total, message) => {
            setPreviewRows(sortRows([...pendingItemsRef.current]))
            setStreamProgress({ current: total, total })
            setStreamMessage(message)
            setPreviewLoading(false)
          },
          onError: (message) => {
            setAiError(message)
            setPreviewLoading(false)
          },
        }
      )
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal membuat preview AI')
      setPreviewLoading(false)
    }
  }

  async function handleSavePreview() {
    if (!token || previewRows.length === 0) return
    setSavingPreview(true)
    setAiError('')

    try {
      if (replaceExisting) {
        await deleteAllContentPlan(token)
      }
      const saved = await batchCreateContentPlan(previewRows, token)
      setRows((prev) => sortRows(replaceExisting ? saved : [...prev, ...saved]))
      setStreamMessage(`Tersimpan. ${saved.length} item masuk ke Content Plan.`)
      setTimeout(() => closeAiWizard(), 700)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menyimpan preview ke database')
    } finally {
      setSavingPreview(false)
    }
  }

  function renderRows(groupRows: ContentPlanRow[]) {
    return groupRows.map((row, idx) => {
      const globalIndex = rows.indexOf(row)
      const isExpanded = expandedIndex === globalIndex

      return (
        <div key={`${row.id ?? row.date}-${idx}`} className="border-t border-border first:border-t-0">
          <button
            type="button"
            onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
            className="w-full px-4 py-4 text-left transition-colors hover:bg-muted/40 md:px-6"
          >
            <div className="grid gap-3 md:grid-cols-[7rem_minmax(0,1fr)_auto_minmax(0,1.4fr)_auto] md:items-center">
              <div>
                <p className="text-sm font-medium">{row.date}</p>
                <p className="text-xs text-muted-foreground">{row.day}</p>
              </div>
              <div className="hidden md:block">
                <p className="truncate text-sm text-muted-foreground">{row.topic}</p>
              </div>
              <Badge variant="outline">{row.format}</Badge>
              <p className="truncate text-sm font-medium">{row.headline}</p>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', getStatusCellClass(row.status))}>
                  {row.status}
                </span>
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isExpanded ? 'rotate-180' : undefined)} />
              </div>
            </div>
          </button>

          {isExpanded ? (
            <div className="border-t border-border bg-muted/20 px-4 py-4 md:px-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Topik</p>
                  <p className="mt-1 text-sm">{row.topic}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Waktu Publish</p>
                  <p className="mt-1 text-sm">{row.scheduled_time}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Deskripsi Visual</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{row.visual_description || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Catatan</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{row.notes || '-'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Isi Konten</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{row.content_body || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hook / Caption</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{row.hook_caption || '-'}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => handleEdit(globalIndex)}>
                  <PencilLine className="size-4" />
                  Edit
                </Button>
                <Button type="button" variant="destructive" onClick={() => handleDelete(globalIndex)}>
                  Hapus
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )
    })
  }

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Content Plan' },
        ]}
        eyebrow="Core Module"
        title="Content Plan"
        description="Satu source of truth untuk ide, AI generate, jadwal publish, dan detail setiap konten. Preview AI tidak akan tersimpan sebelum Anda konfirmasi."
        actions={
          <>
            <Button type="button" variant="outline" onClick={openCreateModal}>
              <PencilLine className="size-4" />
              Tambah Manual
            </Button>
            <Button type="button" onClick={openAiWizard}>
              <WandSparkles className="size-4" />
              AI Wizard
            </Button>
          </>
        }
      />

      {authLoading || (token && loadingItems) ? <PageLoadingState title="Memuat content plan" /> : null}
      {!authLoading && isUnauthorized ? <PageErrorState description="Sesi login tidak ditemukan. Silakan login ulang untuk membuka Content Plan." /> : null}
      {!authLoading && !isUnauthorized && !loadingItems && pageError ? <PageErrorState description={pageError} /> : null}

      {!authLoading && !isUnauthorized && !loadingItems && !pageError && rows.length === 0 ? (
        <PageEmptyState
          icon={<CalendarClock className="size-6" aria-hidden="true" />}
          title="Content Plan masih kosong"
          description="Mulai dari AI Wizard jika Anda ingin generate draft cepat dengan preset, atau tambah manual jika struktur kontennya sudah siap."
          action={
            <>
              <Button type="button" variant="outline" onClick={openCreateModal}>
                Tambah Manual
              </Button>
              <Button type="button" onClick={openAiWizard}>
                <Sparkles className="size-4" />
                Buka AI Wizard
              </Button>
            </>
          }
        />
      ) : null}

      {!authLoading && !isUnauthorized && !loadingItems && !pageError && rows.length > 0 ? (
        <div className="space-y-4">
          {weekKeys.map((weekLabel) => {
            const weekRows = rows.filter((row) => row.week_label === weekLabel)
            return (
              <Card key={weekLabel} className="overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/40">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>{weekLabel}</CardTitle>
                      <CardDescription>{weekRows.length} item konten</CardDescription>
                    </div>
                    <Badge variant="secondary">{weekRows[0]?.status ?? 'Planned'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">{renderRows(weekRows)}</CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      <Dialog open={showCrudModal} onOpenChange={(nextOpen) => (!nextOpen ? handleCancelCrudModal() : setShowCrudModal(true))}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl" showCloseButton={false}>
          <div className="border-b border-border px-5 py-4">
            <DialogHeader>
              <DialogTitle>{editingIndex === null ? 'Tambah Item Manual' : 'Edit Item Content Plan'}</DialogTitle>
              <DialogDescription>Gunakan form yang sama untuk menjaga struktur data content plan tetap konsisten.</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleRowSubmit} className="space-y-5 px-5 py-5">
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Form belum lengkap</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <FormSection title="Informasi jadwal" description="Kolom dasar untuk mengelompokkan konten per minggu dan tanggal.">
              <FormGrid>
                <FormField label="Label minggu" htmlFor="weekLabel" required>
                  <Input
                    id="weekLabel"
                    value={formRow.week_label}
                    onChange={(e) => handleFormRowChange('week_label', e.target.value)}
                    placeholder="Minggu 1 - April 2026"
                    className="h-10"
                  />
                </FormField>

                <FormField label="Tanggal" htmlFor="date" required>
                  <DatePicker
                    id="date"
                    selected={parseUiDate(formRow.date)}
                    onChange={(date: Date | null) => {
                      if (!date) {
                        handleFormRowChange('date', '')
                        handleFormRowChange('day', '')
                        return
                      }
                      handleFormRowChange('date', formatUiDate(date))
                      handleFormRowChange('day', getUiDay(date))
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    calendarClassName="text-sm"
                    popperClassName="z-[70]"
                    popperPlacement="bottom-start"
                  />
                </FormField>

                <FormField label="Hari" htmlFor="day" required>
                  <Input id="day" value={formRow.day} readOnly placeholder="Otomatis dari tanggal" className="h-10" />
                </FormField>

                <FormField label="Format" required>
                  <Select value={formRow.format} onValueChange={(value) => handleFormRowChange('format', value ?? FORMAT_OPTIONS[0])}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Isi konten" description="Detail inti yang akan dipakai saat tim melakukan produksi atau publish.">
              <FormGrid>
                <FormField label="Topik" htmlFor="topic" required>
                  <Input id="topic" value={formRow.topic} onChange={(e) => handleFormRowChange('topic', e.target.value)} className="h-10" />
                </FormField>

                <FormField label="Headline" htmlFor="headline" required>
                  <Input id="headline" value={formRow.headline} onChange={(e) => handleFormRowChange('headline', e.target.value)} className="h-10" />
                </FormField>
              </FormGrid>

              <FormGrid className="md:grid-cols-3">
                <FormField label="Waktu publish" htmlFor="scheduledTime">
                  <Input
                    id="scheduledTime"
                    value={formRow.scheduled_time}
                    onChange={(e) => handleFormRowChange('scheduled_time', e.target.value)}
                    placeholder="10:00 WIB"
                    className="h-10"
                  />
                </FormField>

                <FormField label="Status">
                  <Select value={formRow.status} onValueChange={(value) => handleFormRowChange('status', value ?? STATUS_OPTIONS[0])}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Keterangan" htmlFor="notes">
                  <Input id="notes" value={formRow.notes} onChange={(e) => handleFormRowChange('notes', e.target.value)} className="h-10" />
                </FormField>
              </FormGrid>

              <FormField label="Deskripsi visual" htmlFor="visualDescription">
                <Textarea
                  id="visualDescription"
                  value={formRow.visual_description}
                  onChange={(e) => handleFormRowChange('visual_description', e.target.value)}
                  rows={3}
                />
              </FormField>

              <FormField label="Isi konten" htmlFor="contentBody">
                <Textarea id="contentBody" value={formRow.content_body} onChange={(e) => handleFormRowChange('content_body', e.target.value)} rows={5} />
              </FormField>

              <FormField label="Hook / caption" htmlFor="hookCaption">
                <Textarea id="hookCaption" value={formRow.hook_caption} onChange={(e) => handleFormRowChange('hook_caption', e.target.value)} rows={4} />
              </FormField>
            </FormSection>

            <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur">
              <Button type="button" variant="outline" onClick={handleCancelCrudModal}>Batal</Button>
              <Button type="submit" disabled={savingRow}>
                {savingRow ? 'Menyimpan...' : editingIndex === null ? 'Tambah Item' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiModal} onOpenChange={(nextOpen) => (!nextOpen ? closeAiWizard() : setShowAiModal(true))}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0 sm:max-w-5xl" showCloseButton={false}>
          <div className="border-b border-border px-5 py-4">
            <DialogHeader>
              <DialogTitle>AI Content Plan Wizard</DialogTitle>
              <DialogDescription>Pilih preset, atur parameter, review preview hasil AI, lalu simpan ke content plan ketika sudah yakin.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="grid gap-2 md:grid-cols-3">
              {WIZARD_STEPS.map((label, index) => {
                const isActive = wizardStep === index
                const isComplete = wizardStep > index
                return (
                  <div
                    key={label}
                    className={cn(
                      'rounded-xl border px-4 py-3',
                      isActive ? 'border-foreground bg-foreground text-background' : undefined,
                      !isActive && isComplete ? 'border-border bg-muted/40 text-foreground' : undefined,
                      !isActive && !isComplete ? 'border-border bg-background text-muted-foreground' : undefined
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Step {index + 1}</p>
                    <p className="mt-1 font-medium">{label}</p>
                  </div>
                )
              })}
            </div>

            {aiError ? (
              <Alert variant="destructive">
                <AlertTitle>Proses AI belum berhasil</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            ) : null}

            {wizardStep === 0 ? (
              <div className="space-y-5">
                <FormSection
                  title="Pilih preset"
                  description="Preset memberi starting point yang lebih cepat. Anda tetap bisa mengubah semua parameter di langkah berikutnya."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    {AI_PRESETS.map((preset) => {
                      const active = selectedPresetId === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setWizardDefaultsFromPreset(preset.id)}
                          className={cn(
                            'rounded-xl border p-4 text-left transition-colors',
                            active ? 'border-foreground bg-foreground text-background' : 'border-border bg-background hover:bg-muted/40'
                          )}
                        >
                          <p className="font-medium">{preset.label}</p>
                          <p className={cn('mt-2 text-sm leading-6', active ? 'text-background/80' : 'text-muted-foreground')}>{preset.summary}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {preset.examples.map((example) => (
                              <span
                                key={example}
                                className={cn(
                                  'rounded-full border px-2 py-1 text-xs',
                                  active ? 'border-background/20 text-background/80' : 'border-border text-muted-foreground'
                                )}
                              >
                                {example}
                              </span>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </FormSection>

                <FormSection title="Business context" description="Semakin jelas niche dan target audience, semakin tajam preview yang dihasilkan.">
                  <FormGrid>
                    <FormField label="Platform" required>
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

                    <FormField
                      label="Niche"
                      htmlFor="aiNiche"
                      required
                      description="Contoh input: klinik gigi keluarga, skincare acne-prone, catering sehat untuk kantor."
                    >
                      <Input id="aiNiche" value={niche} onChange={(e) => setNiche(e.target.value)} className="h-10" />
                    </FormField>

                    <FormField
                      label="Target audience"
                      htmlFor="aiAudience"
                      description="Contoh: wanita 25-34 di kota besar, pemilik UMKM F&B, orang tua dengan anak balita."
                      className="md:col-span-2"
                    >
                      <Input id="aiAudience" value={aiTargetAudience} onChange={(e) => setAiTargetAudience(e.target.value)} className="h-10" />
                    </FormField>
                  </FormGrid>
                </FormSection>
              </div>
            ) : null}

            {wizardStep === 1 ? (
              <div className="space-y-5">
                <FormSection title="Konfigurasi plan" description="Atur parameter sebelum AI membuat preview. Semua hasil di step berikutnya masih aman untuk direview dulu.">
                  <FormField label="Preset aktif">
                    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                      <p className="font-medium">{selectedPreset.label}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedPreset.summary}</p>
                    </div>
                  </FormField>

                  <FormGrid>
                    <FormField label="Campaign / angle utama" htmlFor="aiContentIdea" description="Boleh ubah suggestion bawaan preset jika Anda ingin angle yang lebih spesifik.">
                      <Textarea id="aiContentIdea" value={contentIdea} onChange={(e) => setContentIdea(e.target.value)} rows={4} />
                    </FormField>

                    <FormField label="Tone konten">
                      <Select value={tone} onValueChange={(value) => setTone(value ?? TONES[0])}>
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

                  <FormGrid className="md:grid-cols-3">
                    <FormField label="Tanggal mulai" htmlFor="aiStartDate">
                      <DatePicker
                        id="aiStartDate"
                        selected={startDate}
                        onChange={(date: Date | null) => setStartDate(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Pilih tanggal mulai"
                        className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        calendarClassName="text-sm"
                        popperClassName="z-[70]"
                        popperPlacement="bottom-start"
                      />
                    </FormField>

                    <FormField label="Label periode" htmlFor="aiMonthLabel">
                      <Input id="aiMonthLabel" value={monthLabel} onChange={(e) => setMonthLabel(e.target.value)} placeholder="April 2026" className="h-10" />
                    </FormField>

                    <FormField label="Konten per minggu" htmlFor="aiContentPerWeek">
                      <Input
                        id="aiContentPerWeek"
                        type="number"
                        min={1}
                        max={14}
                        value={contentPerWeek}
                        onChange={(e) => setContentPerWeek(Number(e.target.value))}
                        className="h-10"
                      />
                    </FormField>
                  </FormGrid>

                  <FormGrid className="md:grid-cols-[1fr_1fr_auto]">
                    <FormField label="Durasi (minggu)" htmlFor="aiDurationWeeks">
                      <Input
                        id="aiDurationWeeks"
                        type="number"
                        min={1}
                        max={12}
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        className="h-10"
                      />
                    </FormField>

                    <FormField label="Total estimasi output">
                      <div className="flex h-10 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium">
                        {estimatedCount} konten
                      </div>
                    </FormField>

                    <FormField label="Replace existing">
                      <div className="flex h-10 items-center gap-3 rounded-lg border border-border px-3">
                        <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} />
                        <span className="text-sm text-muted-foreground">Hapus item lama saat save</span>
                      </div>
                    </FormField>
                  </FormGrid>
                </FormSection>

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Contoh arah hasil dari preset</CardTitle>
                    <CardDescription>Preview akhir tetap dibuat oleh AI, tetapi contoh ini membantu Anda mengecek apakah preset dan niche sudah tepat.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selectedPreset.examples.map((example) => (
                      <Badge key={example} variant="secondary">{example}</Badge>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {wizardStep === 2 ? (
              <div className="space-y-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ringkasan konfigurasi</CardTitle>
                    <CardDescription>AI akan membuat preview berdasarkan parameter berikut. Data belum disimpan ke database.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preset</p>
                      <p className="mt-1 font-medium">{selectedPreset.label}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Platform</p>
                      <p className="mt-1 font-medium">{platform}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Niche</p>
                      <p className="mt-1 font-medium">{niche || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Output</p>
                      <p className="mt-1 font-medium">{estimatedCount} konten</p>
                    </div>
                  </CardContent>
                </Card>

                {previewLoading ? (
                  <Card>
                    <CardContent className="space-y-4 py-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">AI sedang menyiapkan preview</p>
                          <p className="text-sm text-muted-foreground">{streamMessage || 'Mohon tunggu, hasil akan muncul bertahap.'}</p>
                        </div>
                        <Badge variant="secondary">
                          {streamProgress.current}/{streamProgress.total || estimatedCount}
                        </Badge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-foreground transition-all duration-300"
                          style={{ width: `${streamProgress.total ? (streamProgress.current / streamProgress.total) * 100 : 8}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {!previewLoading && previewRows.length === 0 ? (
                  <PageEmptyState
                    title="Preview belum dibuat"
                    description="Kembali ke langkah konfigurasi lalu jalankan AI untuk membuat draft yang bisa direview."
                  />
                ) : null}

                {!previewLoading && previewRows.length > 0 ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTitle>Preview aman direview</AlertTitle>
                      <AlertDescription>Item di bawah belum masuk database. Simpan hanya jika hasilnya sudah sesuai.</AlertDescription>
                    </Alert>

                    {previewWeekKeys.map((weekLabel) => {
                      const groupRows = previewRows.filter((row) => row.week_label === weekLabel)
                      return (
                        <Card key={weekLabel}>
                          <CardHeader className="border-b border-border bg-muted/40">
                            <CardTitle className="text-base">{weekLabel}</CardTitle>
                            <CardDescription>{groupRows.length} konten preview</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-4">
                            {groupRows.map((row, index) => (
                              <div key={`${row.date}-${row.headline}-${index}`} className="rounded-xl border border-border bg-background p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-medium">{row.headline}</p>
                                      <Badge variant="outline">{row.format}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{row.date} • {row.day} • {row.scheduled_time}</p>
                                    <p className="text-sm text-muted-foreground">{row.topic}</p>
                                  </div>
                                  <Badge variant="secondary">{row.status}</Badge>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Visual</p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{row.visual_description}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hook / Caption</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{row.hook_caption}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            {wizardStep === 0 ? (
              <>
                <Button type="button" variant="outline" onClick={closeAiWizard}>Batal</Button>
                <Button type="button" onClick={() => setWizardStep(1)} disabled={!niche.trim()}>
                  Lanjut ke Konfigurasi
                </Button>
              </>
            ) : null}

            {wizardStep === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => setWizardStep(0)}>Kembali</Button>
                <Button type="button" onClick={handlePreviewGenerate} disabled={!niche.trim() || previewLoading}>
                  {previewLoading ? 'Menyiapkan preview...' : 'Buat Preview AI'}
                </Button>
              </>
            ) : null}

            {wizardStep === 2 ? (
              <>
                <Button type="button" variant="outline" onClick={() => setWizardStep(1)} disabled={previewLoading || savingPreview}>
                  Edit Konfigurasi
                </Button>
                <Button type="button" variant="outline" onClick={handlePreviewGenerate} disabled={previewLoading || savingPreview}>
                  Preview Ulang
                </Button>
                <Button type="button" onClick={handleSavePreview} disabled={previewLoading || savingPreview || previewRows.length === 0}>
                  {savingPreview ? 'Menyimpan...' : 'Simpan ke Content Plan'}
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
