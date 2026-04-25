'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { addDays, endOfWeek, format, isValid, parse, startOfWeek } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Brain, CalendarClock, CheckCheck, ChevronDown, ClipboardCheck, Copy, PencilLine, Plus, Sparkles, Trash2, WandSparkles } from 'lucide-react'
import Link from 'next/link'

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
import { DatePicker } from '@/components/ui/DatePicker'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { fetchContentPlan, createContentPlanItem, updateContentPlanItem, deleteContentPlanItem, deleteAllContentPlan, batchCreateContentPlan } from '@/lib/api/content-plan'
import { fetchUserSettings, type UserSettingData } from '@/lib/api/user-settings'
import { useGenerateScheduleStream } from '@/hooks/useGenerateScheduleStream'
import { cn } from '@/lib/utils'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']
const TONES = ['Edukatif', 'Promosi', 'Entertaining', 'Inspiratif', 'Story Telling']
const FORMAT_OPTIONS = ['Single Post', 'Carousel', 'Reels']
const STATUS_OPTIONS = ['To Do', 'In Review', 'Done']
const WIZARD_STEPS = ['Setup', 'Preview']

const AI_PRESETS = [
  {
    id: 'awareness',
    label: 'Awareness',
    summary: 'Edukasi ringan untuk menaikkan reach dan membangun trust awal.',
    defaults: {
      tone: 'Edukatif',
      contentIdea: 'Bangun awareness dengan edukasi sederhana dan topik yang mudah dibagikan.',
      contentPerWeek: 3,
      durationWeeks: 1,
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
      durationWeeks: 1,
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
      durationWeeks: 1,
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

type PreviewRow = ContentPlanRow & {
  preview_id: string
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

// Indonesian month names as produced by date-fns localeId
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// Week number within the month: week 1 = the Mon–Sun that contains the 1st of the month
function getWeekOfMonth(weekMonday: Date): number {
  const firstOfMonth = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), 1)
  const firstWeekMonday = startOfWeek(firstOfMonth, { weekStartsOn: 1 })
  const diffDays = Math.round((weekMonday.getTime() - firstWeekMonday.getTime()) / 86_400_000)
  return Math.floor(diffDays / 7) + 1
}

function buildWeekLabel(weekMonday: Date): string {
  const weekNum = getWeekOfMonth(weekMonday)
  const monthLabel = format(weekMonday, 'MMMM yyyy', { locale: localeId })
  return `Minggu ${weekNum} - ${monthLabel}`
}

function parseWeekLabel(label: string) {
  // New format: "Minggu 4 - April 2026"
  const newMatch = label.match(/^Minggu\s+(\d+)\s+-\s+(\w+)\s+(\d{4})$/)
  if (newMatch) {
    const weekNum = parseInt(newMatch[1])
    const monthIndex = MONTH_NAMES_ID.indexOf(newMatch[2])
    const year = parseInt(newMatch[3])
    if (monthIndex === -1 || isNaN(weekNum) || isNaN(year)) return null
    const firstWeekMonday = startOfWeek(new Date(year, monthIndex, 1), { weekStartsOn: 1 })
    const weekStart = addDays(firstWeekMonday, (weekNum - 1) * 7)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    return { weekNum: String(weekNum), start: weekStart, end: weekEnd }
  }
  // Old format: "Minggu 1 - 22/04/2026 - 24/04/2026"
  const oldMatch = label.match(/^Minggu\s+(\d+)\s+-\s+(\d{2}\/\d{2}\/\d{4})\s+-\s+(\d{2}\/\d{2}\/\d{4})/)
  if (oldMatch) {
    const start = parse(oldMatch[2], 'dd/MM/yyyy', new Date())
    const end = parse(oldMatch[3], 'dd/MM/yyyy', new Date())
    return isValid(start) && isValid(end) ? { weekNum: oldMatch[1], start, end } : null
  }
  return null
}

function detectWeekLabel(date: Date, existingRows: ContentPlanRow[]): string {
  // If date already belongs to an existing week group, keep that label
  for (const row of existingRows) {
    const parsed = parseWeekLabel(row.week_label ?? '')
    if (!parsed) continue
    if (date >= parsed.start && date <= parsed.end) return row.week_label!
  }
  // New week — derive label from week-of-month
  const weekMonday = startOfWeek(date, { weekStartsOn: 1 })
  return buildWeekLabel(weekMonday)
}

function sortRows<T extends ContentPlanRow>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const dateA = parseUiDate(a.date)
    const dateB = parseUiDate(b.date)
    if (!dateA || !dateB) return a.week_label.localeCompare(b.week_label)
    return dateA.getTime() - dateB.getTime()
  })
}

function createPreviewRow(row: ContentPlanRow): PreviewRow {
  return {
    ...row,
    preview_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }
}

function stripPreviewRows(rows: PreviewRow[]): ContentPlanRow[] {
  return rows.map(({ preview_id: _previewId, ...row }) => row)
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

function buildCopyText(row: ContentPlanRow): string {
  const sep = '─'.repeat(40)
  const lines: string[] = [
    `${row.format.toUpperCase()} · ${row.topic}`,
    `${row.date} · ${row.day} · ${row.scheduled_time}`,
    sep,
    '',
    'HEADLINE',
    row.headline || '-',
    '',
    'HOOK / CAPTION',
    row.hook_caption || '-',
    '',
    'ISI KONTEN',
    row.content_body || '-',
    '',
    'DESKRIPSI VISUAL',
    row.visual_description || '-',
  ]
  return lines.join('\n')
}

function renderValidationList(items: string[]) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
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

  const [showWeekLabelPicker, setShowWeekLabelPicker] = useState(false)
  const [editingWeekLabel, setEditingWeekLabel] = useState<string | null>(null)
  const [weekRange, setWeekRange] = useState<[Date | null, Date | null]>([null, null])
  const [savingWeekLabel, setSavingWeekLabel] = useState(false)

  const [wizardStep, setWizardStep] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState(AI_PRESETS[0].id)
  const [contentPerWeek, setContentPerWeek] = useState(AI_PRESETS[0].defaults.contentPerWeek)
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [niche, setNiche] = useState('')
  const [contentIdea, setContentIdea] = useState(AI_PRESETS[0].defaults.contentIdea)
  const [durationWeeks, setDurationWeeks] = useState(AI_PRESETS[0].defaults.durationWeeks)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [tone, setTone] = useState(AI_PRESETS[0].defaults.tone)
  const [aiTargetAudience, setAiTargetAudience] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [aiError, setAiError] = useState('')
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [savingPreview, setSavingPreview] = useState(false)
  const [streamProgress, setStreamProgress] = useState({ current: 0, total: 0 })
  const [streamMessage, setStreamMessage] = useState('')
  const [selectedPreviewIds, setSelectedPreviewIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState(STATUS_OPTIONS[0])
  const [bulkFormat, setBulkFormat] = useState(FORMAT_OPTIONS[0])
  const [bulkTime, setBulkTime] = useState('10:00 WIB')
  const [copiedPreviewId, setCopiedPreviewId] = useState<string | null>(null)
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null)
  const isUnauthorized = !authLoading && !token

  const [businessContext, setBusinessContext] = useState<UserSettingData | null>(null)
  const [isRecommending, setIsRecommending] = useState(false)
  const [aiRecommendNote, setAiRecommendNote] = useState('')
  const appliedContextRef = useRef(false)
  const autoGenerateRef = useRef(false)

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

  const normalizedContentPerWeek = clampNumber(Math.trunc(contentPerWeek || 0), 1, 14)
  const normalizedDurationWeeks = clampNumber(Math.trunc(durationWeeks || 0), 1, 12)
  const estimatedCount = normalizedContentPerWeek * normalizedDurationWeeks
  const setupBlockingIssues = useMemo(() => {
    const issues: string[] = []
    if (!selectedPresetId) issues.push('Pilih salah satu preset untuk memberi arah hasil AI.')
    if (!platform) issues.push('Pilih platform utama.')
    if (niche.trim().length < 3) issues.push('Isi niche minimal 3 karakter agar brief cukup jelas.')
    if (!contentIdea.trim()) issues.push('Isi campaign atau angle utama sebelum membuat preview.')
    if (!tone) issues.push('Pilih tone konten.')
    if (!Number.isInteger(contentPerWeek) || contentPerWeek < 1 || contentPerWeek > 14) {
      issues.push('Konten per minggu harus antara 1 sampai 14.')
    }
    if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 12) {
      issues.push('Durasi minggu harus antara 1 sampai 12.')
    }
    return issues
  }, [niche, platform, selectedPresetId, contentIdea, contentPerWeek, durationWeeks, tone])
  const setupHints = useMemo(() => {
    const hints: string[] = []
    if (!aiTargetAudience.trim()) hints.push('Target audience belum wajib, tetapi akan membantu AI membuat hook yang lebih tajam.')
    if (!startDate) hints.push('Tanggal mulai kosong. AI tetap bisa berjalan, tetapi urutan tanggal akan lebih presisi jika diisi.')
    if (estimatedCount > 20) hints.push('Estimasi output cukup besar. Pertimbangkan preview bertahap agar review lebih cepat.')
    return hints
  }, [aiTargetAudience, startDate, estimatedCount])
  const selectedPreviewRows = useMemo(
    () => previewRows.filter((row) => selectedPreviewIds.includes(row.preview_id)),
    [previewRows, selectedPreviewIds]
  )
  const saveTargetRows = selectedPreviewRows.length > 0 ? selectedPreviewRows : previewRows
  const canGeneratePreview = setupBlockingIssues.length === 0 && !previewLoading
  const canSavePreview = !previewLoading && !savingPreview && saveTargetRows.length > 0

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
    setStartDate(null)
    setReplaceExisting(false)
    setAiError('')
    setPreviewRows([])
    setPreviewLoading(false)
    setSavingPreview(false)
    setStreamProgress({ current: 0, total: 0 })
    setStreamMessage('')
    setSelectedPreviewIds([])
    setBulkStatus(STATUS_OPTIONS[0])
    setBulkFormat(FORMAT_OPTIONS[0])
    setBulkTime('10:00 WIB')
    pendingItemsRef.current = []
  }, [setWizardDefaultsFromPreset])

  const openAiWizard = useCallback((options?: { preserveDraft?: boolean }) => {
    if (!options?.preserveDraft) {
      resetWizardState()
    } else {
      setWizardStep(0)
      setAiError('')
      setPreviewRows([])
      setPreviewLoading(false)
      setSavingPreview(false)
      setStreamProgress({ current: 0, total: 0 })
      setStreamMessage('')
      setSelectedPreviewIds([])
      pendingItemsRef.current = []
    }
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
    setSelectedPreviewIds([])
  }, [])

  const openCreateModalForWeek = useCallback((weekLabel = '') => {
    setEditingIndex(null)
    setFormRow({ ...EMPTY_ROW, week_label: weekLabel })
    setFormError('')
    setShowCrudModal(true)
  }, [])

  function openWeekLabelPicker(label: string) {
    const parsed = parseWeekLabel(label)
    setWeekRange(parsed ? [parsed.start, parsed.end] : [null, null])
    setEditingWeekLabel(label)
    setShowWeekLabelPicker(true)
  }

  async function handleApplyWeekLabel() {
    if (!editingWeekLabel || !weekRange[0] || !token) return
    const weekMonday = startOfWeek(weekRange[0], { weekStartsOn: 1 })
    const newLabel = buildWeekLabel(weekMonday)
    if (newLabel === editingWeekLabel) { setShowWeekLabelPicker(false); setEditingWeekLabel(null); return }
    setSavingWeekLabel(true)
    try {
      const targets = rows.filter((r) => r.week_label === editingWeekLabel)
      await Promise.all(targets.map((r) => updateContentPlanItem(r.id!, { ...r, week_label: newLabel }, token)))
      setRows((prev) => prev.map((r) => r.week_label === editingWeekLabel ? { ...r, week_label: newLabel } : r))
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Gagal memperbarui label minggu')
    } finally {
      setSavingWeekLabel(false)
      setShowWeekLabelPicker(false)
      setEditingWeekLabel(null)
    }
  }

  useEffect(() => {
    if (!token) return

    fetchContentPlan(token)
      .then((items) => setRows(sortRows(items)))
      .catch((err) => setPageError(err instanceof Error ? err.message : 'Gagal memuat content plan'))
      .finally(() => setLoadingItems(false))
  }, [token])

  useEffect(() => {
    if (!token) return
    fetchUserSettings(token)
      .then(setBusinessContext)
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!showAiModal) {
      appliedContextRef.current = false
      return
    }
    if (appliedContextRef.current || !businessContext) return
    appliedContextRef.current = true
    if (businessContext.niche) setNiche(businessContext.niche)
    if (businessContext.preferredPlatform) setPlatform(businessContext.preferredPlatform)
    if (businessContext.targetAudience) setAiTargetAudience(businessContext.targetAudience)
  }, [showAiModal, businessContext])

  useEffect(() => {
    const compose = searchParams.get('compose')
    if (compose === 'manual') {
      openCreateModalForWeek()
      router.replace('/dashboard/schedule', { scroll: false })
    }
    if (compose === 'ai') {
      openAiWizard()
      router.replace('/dashboard/schedule', { scroll: false })
    }
  }, [openAiWizard, openCreateModalForWeek, router, searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('content_planner_schedule_prefill')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      openAiWizard({ preserveDraft: true })
      if (data.niche) setNiche(data.niche)
      if (data.platform) setPlatform(data.platform)
      if (data.goal) setContentIdea(data.goal)
      if (data.targetAudience) setAiTargetAudience(data.targetAudience)
    } catch {
      // Ignore invalid local storage payload.
    }
    localStorage.removeItem('content_planner_schedule_prefill')
  }, [openAiWizard])

  const selectAllPreviewRows = useCallback(() => {
    setSelectedPreviewIds(previewRows.map((row) => row.preview_id))
  }, [previewRows])

  const clearPreviewSelection = useCallback(() => {
    setSelectedPreviewIds([])
  }, [])

  const togglePreviewRow = useCallback((previewId: string) => {
    setSelectedPreviewIds((prev) =>
      prev.includes(previewId) ? prev.filter((item) => item !== previewId) : [...prev, previewId]
    )
  }, [])

  const selectPreviewWeek = useCallback((weekLabel: string) => {
    const weekIds = previewRows.filter((row) => row.week_label === weekLabel).map((row) => row.preview_id)
    setSelectedPreviewIds((prev) => Array.from(new Set([...prev, ...weekIds])))
  }, [previewRows])

  const applyBulkPreviewUpdate = useCallback((updater: (row: PreviewRow) => PreviewRow) => {
    const targetIds = new Set(
      selectedPreviewIds.length > 0 ? selectedPreviewIds : previewRows.map((row) => row.preview_id)
    )
    setPreviewRows((prev) => sortRows(prev.map((row) => (targetIds.has(row.preview_id) ? updater(row) : row))))
  }, [previewRows, selectedPreviewIds])

  const handleBulkRemove = useCallback(() => {
    const targetIds = new Set(
      selectedPreviewIds.length > 0 ? selectedPreviewIds : previewRows.map((row) => row.preview_id)
    )
    setPreviewRows((prev) => prev.filter((row) => !targetIds.has(row.preview_id)))
    setSelectedPreviewIds([])
  }, [previewRows, selectedPreviewIds])

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

  async function handleQuickStatusChange(index: number, nextStatus: string) {
    const current = rows[index]
    if (!current || current.status === nextStatus) return

    try {
      if (current.id && token) {
        const saved = await updateContentPlanItem(current.id, { ...current, status: nextStatus }, token)
        setRows((prev) => sortRows(prev.map((row, itemIndex) => (itemIndex === index ? saved : row))))
        return
      }

      setRows((prev) => sortRows(prev.map((row, itemIndex) => (itemIndex === index ? { ...row, status: nextStatus } : row))))
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Gagal mengubah status item')
    }
  }

  const handleAiRecommend = useCallback(async () => {
    if (!token) return
    setIsRecommending(true)
    setAiError('')
    setAiRecommendNote('')
    try {
      const res = await fetch('/api/ai/recommend-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Gagal mendapatkan rekomendasi' }))
        throw new Error(err.message || 'Gagal mendapatkan rekomendasi')
      }
      const rec = await res.json()
      setWizardDefaultsFromPreset(rec.preset ?? 'awareness')
      if (rec.campaign_idea) setContentIdea(rec.campaign_idea)
      if (rec.tone) setTone(rec.tone)
      if (rec.content_per_week) setContentPerWeek(rec.content_per_week)
      if (rec.duration_weeks) setDurationWeeks(rec.duration_weeks)
      if (rec.reasoning) setAiRecommendNote(rec.reasoning)
      autoGenerateRef.current = true
      setWizardStep(1)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal mendapatkan rekomendasi AI')
    } finally {
      setIsRecommending(false)
    }
  }, [token, setWizardDefaultsFromPreset])

  const handlePreviewGenerate = useCallback(async () => {
    if (!token) return
    setAiError('')
    setPreviewRows([])
    setPreviewLoading(true)
    setSelectedPreviewIds([])
    setWizardStep(1)
    setStreamProgress({ current: 0, total: 0 })
    setStreamMessage('')
    pendingItemsRef.current = []

    try {
      await generateScheduleStream(
        {
          content_per_week: normalizedContentPerWeek,
          platform,
          niche,
          content_idea: contentIdea || undefined,
          duration_weeks: normalizedDurationWeeks,
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
            const previewItem = createPreviewRow(item)
            pendingItemsRef.current.push(item)
            setPreviewRows((prev) => sortRows([...prev, previewItem]))
            setStreamProgress({ current: count, total })
            setStreamMessage(`Preview ${count}/${total} siap direview`)
          },
          onComplete: (total, message) => {
            setPreviewRows(sortRows(pendingItemsRef.current.map((row) => createPreviewRow(row))))
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
  }, [aiTargetAudience, contentIdea, generateScheduleStream, niche, normalizedContentPerWeek, normalizedDurationWeeks, platform, startDate, token, tone])

  const handleSavePreview = useCallback(async () => {
    if (!token || saveTargetRows.length === 0) return
    setSavingPreview(true)
    setAiError('')

    try {
      if (replaceExisting) {
        await deleteAllContentPlan(token)
      }
      const saved = await batchCreateContentPlan(stripPreviewRows(saveTargetRows), token)
      setRows((prev) => sortRows(replaceExisting ? saved : [...prev, ...saved]))
      setStreamMessage(`Tersimpan. ${saved.length} item masuk ke Content Plan.`)
      setTimeout(() => closeAiWizard(), 700)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menyimpan preview ke database')
    } finally {
      setSavingPreview(false)
    }
  }, [closeAiWizard, replaceExisting, saveTargetRows, token])

  useEffect(() => {
    if (wizardStep === 1 && autoGenerateRef.current) {
      autoGenerateRef.current = false
      void handlePreviewGenerate()
    }
  }, [wizardStep, handlePreviewGenerate])

  useEffect(() => {
    if (!showAiModal) return

    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      const hasPrimaryModifier = event.ctrlKey || event.metaKey

      if (hasPrimaryModifier && key === 'enter') {
        event.preventDefault()
        if (wizardStep === 0 && canGeneratePreview) {
          void handlePreviewGenerate()
        } else if (wizardStep === 1 && canSavePreview) {
          void handleSavePreview()
        }
        return
      }

      if (event.altKey && event.key === 'ArrowLeft' && wizardStep > 0 && !previewLoading && !savingPreview) {
        event.preventDefault()
        setWizardStep((prev) => Math.max(prev - 1, 0))
        return
      }

      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        if (wizardStep === 0 && canGeneratePreview) {
          void handlePreviewGenerate()
        }
        return
      }

      if (wizardStep === 1 && event.shiftKey && key === 'a' && previewRows.length > 0) {
        event.preventDefault()
        selectAllPreviewRows()
        return
      }

      if (wizardStep === 1 && event.shiftKey && key === 'x') {
        event.preventDefault()
        clearPreviewSelection()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    canGeneratePreview,
    canSavePreview,
    clearPreviewSelection,
    handlePreviewGenerate,
    handleSavePreview,
    previewLoading,
    previewRows.length,
    savingPreview,
    selectAllPreviewRows,
    showAiModal,
    wizardStep,
  ])

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
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Headline</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6">{row.headline || '-'}</p>
                </div>
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
                <Button
                  type="button"
                  variant="outline"
                  className="sm:mr-auto"
                  onClick={() => {
                    void navigator.clipboard.writeText(buildCopyText(row)).then(() => {
                      const key = row.id ?? String(globalIndex)
                      setCopiedRowId(key)
                      setTimeout(() => setCopiedRowId(null), 2000)
                    })
                  }}
                >
                  {copiedRowId === (row.id ?? String(globalIndex)) ? (
                    <><ClipboardCheck className="size-4" />Copied!</>
                  ) : (
                    <><Copy className="size-4" />Copy konten</>
                  )}
                </Button>
                <Select value={row.status} onValueChange={(value) => void handleQuickStatusChange(globalIndex, value ?? STATUS_OPTIONS[0])}>
                  <SelectTrigger className="h-9 w-full sm:w-[180px]">
                    <SelectValue placeholder="Ubah status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Button type="button" variant="outline" onClick={() => openCreateModalForWeek()}>
              <PencilLine className="size-4" />
              Tambah Manual
            </Button>
            <Button type="button" onClick={() => openAiWizard()}>
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
              <Button type="button" variant="outline" onClick={() => openCreateModalForWeek()}>
                Tambah Manual
              </Button>
              <Button type="button" onClick={() => openAiWizard()}>
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => openWeekLabelPicker(weekLabel)}
                        title="Klik untuk ubah rentang tanggal"
                      >
                        <CardTitle className="decoration-dashed underline-offset-4 hover:underline">
                          {weekLabel}
                        </CardTitle>
                      </button>
                      <CardDescription>{weekRows.length} item konten</CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary">{weekRows[0]?.status ?? 'Planned'}</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        title="Tambah item ke minggu ini"
                        onClick={() => openCreateModalForWeek(weekLabel)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">{renderRows(weekRows)}</CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      <Dialog
        open={showWeekLabelPicker}
        onOpenChange={(open) => {
          if (!open) { setShowWeekLabelPicker(false); setEditingWeekLabel(null) }
        }}
      >
        <DialogContent className="w-auto max-w-fit p-0" showCloseButton={false}>
          <div className="border-b border-border px-5 py-4">
            <DialogHeader>
              <DialogTitle>Ubah Rentang Tanggal Minggu</DialogTitle>
              <DialogDescription>Pilih tanggal mulai dan akhir untuk label minggu ini.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 py-4">
            <DateRangePicker
              dateRange={{ from: weekRange[0] || undefined, to: weekRange[1] || undefined }}
              onDateRangeChange={(range) => setWeekRange([range?.from || null, range?.to || null])}
              placeholder="Pilih rentang tanggal minggu"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowWeekLabelPicker(false); setEditingWeekLabel(null) }}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={!weekRange[0] || !weekRange[1] || savingWeekLabel}
              onClick={() => void handleApplyWeekLabel()}
            >
              {savingWeekLabel ? 'Menyimpan...' : 'Terapkan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    date={parseUiDate(formRow.date) || undefined}
                    onDateChange={(date) => {
                      if (!date) {
                        handleFormRowChange('date', '')
                        handleFormRowChange('day', '')
                        return
                      }
                      handleFormRowChange('date', formatUiDate(date))
                      handleFormRowChange('day', getUiDay(date))
                      handleFormRowChange('week_label', detectWeekLabel(date, rows))
                    }}
                    placeholder="dd/mm/yyyy"
                    className="h-10"
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
                {businessContext?.niche ? (
                  <Card>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profil Bisnis Tersimpan</p>
                        <p className="mt-1 font-medium">{businessContext.brandName || businessContext.niche}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {businessContext.niche} · {businessContext.preferredPlatform} · {businessContext.brandVoice}
                        </p>
                      </div>
                      <Link
                        href="/dashboard/settings"
                        className="shrink-0 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        onClick={() => setShowAiModal(false)}
                      >
                        Edit profil
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <AlertTitle>Profil bisnis belum diatur</AlertTitle>
                    <AlertDescription>
                      <Link
                        href="/dashboard/settings"
                        className="font-medium underline underline-offset-4"
                        onClick={() => setShowAiModal(false)}
                      >
                        Isi profil bisnis di Pengaturan
                      </Link>{' '}
                      agar wizard bisa auto-fill dan AI bisa merekomendasikan campaign terbaik untuk bisnis Anda.
                    </AlertDescription>
                  </Alert>
                )}

                {aiRecommendNote ? (
                  <Alert>
                    <Brain className="size-4" />
                    <AlertTitle>AI merekomendasikan konfigurasi ini</AlertTitle>
                    <AlertDescription>{aiRecommendNote}</AlertDescription>
                  </Alert>
                ) : null}

                {setupBlockingIssues.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertTitle>Lengkapi setup dulu</AlertTitle>
                    <AlertDescription>{renderValidationList(setupBlockingIssues)}</AlertDescription>
                  </Alert>
                ) : null}

                {setupHints.length > 0 ? (
                  <Alert>
                    <AlertTitle>Tips sebelum generate</AlertTitle>
                    <AlertDescription>{renderValidationList(setupHints)}</AlertDescription>
                  </Alert>
                ) : null}

                <FormSection
                  title="Pilih preset"
                  description="Preset memberi starting point yang lebih cepat. Semua parameter di bawah masih bisa diubah."
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

                    <FormField label="Niche" htmlFor="aiNiche" required description="Contoh: klinik gigi keluarga, skincare acne-prone, catering sehat untuk kantor.">
                      <Input id="aiNiche" value={niche} onChange={(e) => setNiche(e.target.value)} className="h-10" />
                    </FormField>

                    <FormField label="Target audience" htmlFor="aiAudience" description="Contoh: wanita 25-34 di kota besar, pemilik UMKM F&B, orang tua dengan anak balita." className="md:col-span-2">
                      <Input id="aiAudience" value={aiTargetAudience} onChange={(e) => setAiTargetAudience(e.target.value)} className="h-10" />
                    </FormField>
                  </FormGrid>
                </FormSection>

                <FormSection title="Konfigurasi campaign" description="Atur campaign dan jadwal. Semua hasil preview masih aman untuk direview sebelum disimpan.">
                  <FormGrid>
                    <FormField label="Campaign / angle utama" htmlFor="aiContentIdea" description="Boleh ubah suggestion bawaan preset jika ingin angle yang lebih spesifik.">
                      <Textarea id="aiContentIdea" value={contentIdea} onChange={(e) => setContentIdea(e.target.value)} rows={3} />
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
                        date={startDate || undefined}
                        onDateChange={(date) => setStartDate(date || null)}
                        placeholder="Pilih tanggal mulai"
                        className="h-10"
                      />
                    </FormField>

                    <FormField label="Konten per minggu" htmlFor="aiContentPerWeek">
                      <Input
                        id="aiContentPerWeek"
                        type="number"
                        min={1}
                        max={14}
                        value={contentPerWeek}
                        onChange={(e) => setContentPerWeek(Number(e.target.value))}
                        onBlur={() => setContentPerWeek(normalizedContentPerWeek)}
                        className="h-10"
                      />
                    </FormField>

                    <FormField label="Durasi (minggu)" htmlFor="aiDurationWeeks">
                      <Input
                        id="aiDurationWeeks"
                        type="number"
                        min={1}
                        max={12}
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        onBlur={() => setDurationWeeks(normalizedDurationWeeks)}
                        className="h-10"
                      />
                    </FormField>
                  </FormGrid>

                  <div className="flex h-10 w-full max-w-[18rem] items-center rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
                    Estimasi output: <span className="ml-1 font-semibold text-foreground">{estimatedCount} konten</span>
                  </div>
                </FormSection>
              </div>
            ) : null}

            {wizardStep === 1 ? (
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

                    <Card>
                      <CardHeader>
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <CardTitle className="text-base">Bulk actions untuk preview</CardTitle>
                            <CardDescription>
                              {selectedPreviewIds.length > 0
                                ? `${selectedPreviewIds.length} baris dipilih. Aksi akan berlaku ke selection ini.`
                                : 'Belum ada baris dipilih. Aksi akan berlaku ke semua preview rows.'}
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={selectAllPreviewRows}>
                              <CheckCheck className="size-4" />
                              Pilih Semua
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={clearPreviewSelection} disabled={selectedPreviewIds.length === 0}>
                              Clear Selection
                            </Button>
                            <Button type="button" variant="destructive" size="sm" onClick={handleBulkRemove} disabled={previewRows.length === 0}>
                              <Trash2 className="size-4" />
                              Hapus dari Preview
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
                        <FormField label="Set status">
                          <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value ?? STATUS_OPTIONS[0])}>
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
                        <div className="flex items-end">
                          <Button type="button" variant="outline" onClick={() => applyBulkPreviewUpdate((row) => ({ ...row, status: bulkStatus }))}>
                            Terapkan
                          </Button>
                        </div>

                        <FormField label="Set format">
                          <Select value={bulkFormat} onValueChange={(value) => setBulkFormat(value ?? FORMAT_OPTIONS[0])}>
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
                        <div className="flex items-end">
                          <Button type="button" variant="outline" onClick={() => applyBulkPreviewUpdate((row) => ({ ...row, format: bulkFormat }))}>
                            Terapkan
                          </Button>
                        </div>

                        <FormField label="Set waktu publish">
                          <Input value={bulkTime} onChange={(e) => setBulkTime(e.target.value)} placeholder="10:00 WIB" className="h-10" />
                        </FormField>
                        <div className="flex items-end">
                          <Button type="button" variant="outline" onClick={() => applyBulkPreviewUpdate((row) => ({ ...row, scheduled_time: bulkTime || '10:00 WIB' }))}>
                            Terapkan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {previewWeekKeys.map((weekLabel) => {
                      const groupRows = previewRows.filter((row) => row.week_label === weekLabel)
                      return (
                        <Card key={weekLabel}>
                          <CardHeader className="border-b border-border bg-muted/40">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <CardTitle className="text-base">{weekLabel}</CardTitle>
                                <CardDescription>{groupRows.length} konten preview</CardDescription>
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={() => selectPreviewWeek(weekLabel)}>
                                Pilih minggu ini
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-4">
                            {groupRows.map((row) => (
                              <div key={row.preview_id} className={cn('rounded-xl border border-border bg-background p-4', selectedPreviewIds.includes(row.preview_id) ? 'ring-2 ring-ring/40' : undefined)}>
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <label className="mr-1 inline-flex items-center gap-2 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                                        <input
                                          type="checkbox"
                                          checked={selectedPreviewIds.includes(row.preview_id)}
                                          onChange={() => togglePreviewRow(row.preview_id)}
                                          className="size-3.5 rounded border-border"
                                        />
                                        Pilih
                                      </label>
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
                                <div className="mt-3 border-t border-border pt-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Isi Konten</p>
                                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{row.content_body}</p>
                                  <div className="mt-3 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        void navigator.clipboard.writeText(buildCopyText(row)).then(() => {
                                          setCopiedPreviewId(row.preview_id)
                                          setTimeout(() => setCopiedPreviewId(null), 2000)
                                        })
                                      }}
                                    >
                                      {copiedPreviewId === row.preview_id ? (
                                        <><ClipboardCheck className="size-4" />Copied!</>
                                      ) : (
                                        <><Copy className="size-4" />Copy konten</>
                                      )}
                                    </Button>
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
                {businessContext?.niche ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleAiRecommend()}
                    disabled={isRecommending}
                  >
                    <Brain className="size-4" />
                    {isRecommending ? 'AI sedang memilih...' : 'AI Pilihkan Campaign'}
                  </Button>
                ) : null}
                <Button type="button" onClick={() => void handlePreviewGenerate()} disabled={!canGeneratePreview}>
                  {previewLoading ? 'Menyiapkan preview...' : 'Buat Preview AI'}
                </Button>
              </>
            ) : null}

            {wizardStep === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => setWizardStep(0)} disabled={previewLoading || savingPreview}>
                  Edit Setup
                </Button>
                <Button type="button" variant="outline" onClick={() => void handlePreviewGenerate()} disabled={previewLoading || savingPreview}>
                  Preview Ulang
                </Button>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3">
                  <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} id="replaceExisting" />
                  <label htmlFor="replaceExisting" className="cursor-pointer text-sm text-muted-foreground">Hapus item lama</label>
                </div>
                <Button type="button" onClick={() => void handleSavePreview()} disabled={!canSavePreview}>
                  {savingPreview ? 'Menyimpan...' : `Simpan ${saveTargetRows.length} Baris`}
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
