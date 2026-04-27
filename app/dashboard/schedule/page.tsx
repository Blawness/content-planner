'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { startOfWeek } from 'date-fns'
import { CalendarClock, Download, PencilLine, WandSparkles } from 'lucide-react'

import type { ContentPlanRow } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { PageEmptyState, PageErrorState, PageHeader, PageLoadingState, PageShell } from '@/components/ui/page-shell'
import { fetchContentPlan, createContentPlanItem, updateContentPlanItem, deleteContentPlanItem } from '@/lib/api/content-plan'
import { fetchUserSettings, type UserSettingData } from '@/lib/api/user-settings'

import { AiWizardModal } from '@/components/features/schedule/AiWizardModal'
import { ContentPlanTable } from '@/components/features/schedule/ContentPlanTable'
import { CrudModal } from '@/components/features/schedule/CrudModal'
import { WeekLabelPickerDialog } from '@/components/features/schedule/WeekLabelPickerDialog'
import { useAiWizard } from '@/components/features/schedule/hooks/useAiWizard'
import { EMPTY_ROW } from '@/components/features/schedule/constants'
import { buildWeekLabel, exportToCsv, parseWeekLabel, sortRows } from '@/components/features/schedule/utils'

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, isLoading: authLoading } = useAuth()

  const [rows, setRows] = useState<ContentPlanRow[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [pageError, setPageError] = useState('')

  const [showCrudModal, setShowCrudModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formRow, setFormRow] = useState<ContentPlanRow>(EMPTY_ROW)
  const [formError, setFormError] = useState('')
  const [savingRow, setSavingRow] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null)

  const [showWeekPicker, setShowWeekPicker] = useState(false)
  const [editingWeekLabel, setEditingWeekLabel] = useState<string | null>(null)
  const [weekRange, setWeekRange] = useState<[Date | null, Date | null]>([null, null])
  const [savingWeekLabel, setSavingWeekLabel] = useState(false)

  const [businessContext, setBusinessContext] = useState<UserSettingData | null>(null)

  const isUnauthorized = !authLoading && !token

  const weekKeys = useMemo(
    () => Array.from(new Set(sortRows(rows).map((r) => r.week_label).filter(Boolean))),
    [rows]
  )

  const wizard = useAiWizard(businessContext, token, (saved, replace) => {
    setRows((prev) => sortRows(replace ? saved : [...prev, ...saved]))
  })

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    fetchContentPlan(token)
      .then((items) => setRows(sortRows(items)))
      .catch((err) => setPageError(err instanceof Error ? err.message : 'Gagal memuat content plan'))
      .finally(() => setLoadingItems(false))
  }, [token])

  useEffect(() => {
    if (!token) return
    fetchUserSettings(token).then(setBusinessContext).catch(() => {})
  }, [token])

  // ── URL param triggers ─────────────────────────────────────────────────────
  const openCreateModalForWeek = useCallback((weekLabel = '') => {
    setEditingIndex(null)
    setFormRow({ ...EMPTY_ROW, week_label: weekLabel })
    setFormError('')
    setShowCrudModal(true)
  }, [])

  useEffect(() => {
    const compose = searchParams.get('compose')
    if (compose === 'manual') {
      openCreateModalForWeek()
      router.replace('/dashboard/schedule', { scroll: false })
    }
    if (compose === 'ai') {
      wizard.openWizard()
      router.replace('/dashboard/schedule', { scroll: false })
    }
  }, [openCreateModalForWeek, router, searchParams, wizard])

  // ── localStorage prefill (from other pages) ────────────────────────────────
  const prefillApplied = useRef(false)
  useEffect(() => {
    if (prefillApplied.current || typeof window === 'undefined') return
    const raw = localStorage.getItem('content_planner_schedule_prefill')
    if (!raw) return
    prefillApplied.current = true
    try {
      const data = JSON.parse(raw)
      wizard.openWizard({ preserveDraft: true, prefill: data })
    } catch { /* ignore */ }
    localStorage.removeItem('content_planner_schedule_prefill')
  }, [wizard])

  // ── Week label picker ─────────────────────────────────────────────────────
  function openWeekLabelPicker(label: string) {
    const parsed = parseWeekLabel(label)
    setWeekRange(parsed ? [parsed.start, parsed.end] : [null, null])
    setEditingWeekLabel(label)
    setShowWeekPicker(true)
  }

  async function handleApplyWeekLabel() {
    if (!editingWeekLabel || !weekRange[0] || !token) return
    const weekMonday = startOfWeek(weekRange[0], { weekStartsOn: 1 })
    const newLabel = buildWeekLabel(weekMonday)
    if (newLabel === editingWeekLabel) { setShowWeekPicker(false); setEditingWeekLabel(null); return }
    setSavingWeekLabel(true)
    try {
      const targets = rows.filter((r) => r.week_label === editingWeekLabel)
      await Promise.all(targets.map((r) => updateContentPlanItem(r.id!, { ...r, week_label: newLabel }, token)))
      setRows((prev) => prev.map((r) => r.week_label === editingWeekLabel ? { ...r, week_label: newLabel } : r))
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Gagal memperbarui label minggu')
    } finally {
      setSavingWeekLabel(false)
      setShowWeekPicker(false)
      setEditingWeekLabel(null)
    }
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  function handleEdit(index: number) {
    setFormRow(rows[index])
    setEditingIndex(index)
    setFormError('')
    setShowCrudModal(true)
  }

  function handleCancelCrud() {
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
          setRows((prev) => sortRows(prev.map((r, i) => (i === editingIndex ? saved : r))))
        }
      }
      handleCancelCrud()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan item')
    } finally {
      setSavingRow(false)
    }
  }

  async function handleDelete(index: number) {
    const item = rows[index]
    if (!window.confirm(`Hapus item "${item.headline}" dari content plan?`)) return
    try {
      if (item.id && token) await deleteContentPlanItem(item.id, token)
      setRows((prev) => prev.filter((_, i) => i !== index))
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
        setRows((prev) => sortRows(prev.map((r, i) => (i === index ? saved : r))))
      } else {
        setRows((prev) => sortRows(prev.map((r, i) => (i === index ? { ...r, status: nextStatus } : r))))
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Gagal mengubah status item')
    }
  }

  function handleCopyRow(key: string) {
    setCopiedRowId(key)
    setTimeout(() => setCopiedRowId(null), 2000)
  }

  // ── Validation for wizard ──────────────────────────────────────────────────
  const blockingIssues = useMemo(() => {
    const issues: string[] = []
    if (!wizard.selectedPresetId) issues.push('Pilih salah satu preset untuk memberi arah hasil AI.')
    if (!wizard.platform) issues.push('Pilih platform utama.')
    if (wizard.niche.trim().length < 3) issues.push('Isi niche minimal 3 karakter agar brief cukup jelas.')
    if (!wizard.contentIdea.trim()) issues.push('Isi campaign atau angle utama sebelum membuat preview.')
    if (!wizard.tone) issues.push('Pilih tone konten.')
    if (!Number.isInteger(wizard.contentPerWeek) || wizard.contentPerWeek < 1 || wizard.contentPerWeek > 14) {
      issues.push('Konten per minggu harus antara 1 sampai 14.')
    }
    if (!Number.isInteger(wizard.durationWeeks) || wizard.durationWeeks < 1 || wizard.durationWeeks > 12) {
      issues.push('Durasi minggu harus antara 1 sampai 12.')
    }
    return issues
  }, [wizard.selectedPresetId, wizard.platform, wizard.niche, wizard.contentIdea, wizard.tone, wizard.contentPerWeek, wizard.durationWeeks])

  const hints = useMemo(() => {
    const h: string[] = []
    if (!wizard.targetAudience.trim()) h.push('Target audience belum wajib, tetapi akan membantu AI membuat hook yang lebih tajam.')
    if (!wizard.startDate) h.push('Tanggal mulai kosong. AI tetap bisa berjalan, tetapi urutan tanggal akan lebih presisi jika diisi.')
    if (wizard.estimatedCount > 20) h.push('Estimasi output cukup besar. Pertimbangkan preview bertahap agar review lebih cepat.')
    return h
  }, [wizard.targetAudience, wizard.startDate, wizard.estimatedCount])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Content Plan' }]}
        eyebrow="Core Module"
        title="Content Plan"
        description="Satu source of truth untuk ide, AI generate, jadwal publish, dan detail setiap konten. Preview AI tidak akan tersimpan sebelum Anda konfirmasi."
        actions={
          <>
            {rows.length > 0 ? (
              <Button type="button" variant="outline" onClick={() => exportToCsv(rows)}>
                <Download className="size-4" />Export CSV
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => openCreateModalForWeek()}>
              <PencilLine className="size-4" />Tambah Manual
            </Button>
            <Button type="button" onClick={() => wizard.openWizard()}>
              <WandSparkles className="size-4" />AI Wizard
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
              <Button type="button" variant="outline" onClick={() => openCreateModalForWeek()}>Tambah Manual</Button>
              <Button type="button" onClick={() => wizard.openWizard()}>Buka AI Wizard</Button>
            </>
          }
        />
      ) : null}

      {!authLoading && !isUnauthorized && !loadingItems && !pageError && rows.length > 0 ? (
        <ContentPlanTable
          rows={rows}
          weekKeys={weekKeys}
          expandedIndex={expandedIndex}
          copiedRowId={copiedRowId}
          onExpandToggle={setExpandedIndex}
          onWeekLabelClick={openWeekLabelPicker}
          onAddToWeek={openCreateModalForWeek}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleQuickStatusChange}
          onCopy={handleCopyRow}
        />
      ) : null}

      <WeekLabelPickerDialog
        open={showWeekPicker}
        weekRange={weekRange}
        saving={savingWeekLabel}
        onWeekRangeChange={setWeekRange}
        onApply={() => void handleApplyWeekLabel()}
        onClose={() => { setShowWeekPicker(false); setEditingWeekLabel(null) }}
      />

      <CrudModal
        open={showCrudModal}
        editingIndex={editingIndex}
        formRow={formRow}
        formError={formError}
        saving={savingRow}
        rows={rows}
        onChange={(key, value) => setFormRow((prev) => ({ ...prev, [key]: value }))}
        onSubmit={handleRowSubmit}
        onCancel={handleCancelCrud}
      />

      <AiWizardModal
        wizard={wizard}
        hasBusinessContext={Boolean(businessContext?.niche)}
        blockingIssues={blockingIssues}
        hints={hints}
      />
    </PageShell>
  )
}
