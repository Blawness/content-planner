'use client'

import { useCallback, useRef, useState } from 'react'
import { format } from 'date-fns'
import type { ContentPlanRow } from '@/types'
import type { UserSettingData } from '@/lib/api/user-settings'
import { batchCreateContentPlan, deleteAllContentPlan } from '@/lib/api/content-plan'
import { useGenerateScheduleStream } from '@/hooks/useGenerateScheduleStream'
import {
  AI_PRESETS,
  FORMAT_OPTIONS,
  PLATFORMS,
  STATUS_OPTIONS,
  type AiPresetId,
  type PreviewRow,
} from '../constants'
import { clampNumber, createPreviewRow, sortRows, stripPreviewRows } from '../utils'

export type AiWizardState = ReturnType<typeof useAiWizard>

export function useAiWizard(
  businessContext: UserSettingData | null,
  token: string | null,
  onSaved: (saved: ContentPlanRow[], replace: boolean) => void
) {
  const { generateScheduleStream } = useGenerateScheduleStream()

  const [open, setOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState<AiPresetId>(AI_PRESETS[0].id)
  const [contentPerWeek, setContentPerWeek] = useState<number>(AI_PRESETS[0].defaults.contentPerWeek)
  const [platform, setPlatform] = useState<string>(PLATFORMS[0])
  const [niche, setNiche] = useState<string>('')
  const [contentIdea, setContentIdea] = useState<string>(AI_PRESETS[0].defaults.contentIdea)
  const [durationWeeks, setDurationWeeks] = useState<number>(AI_PRESETS[0].defaults.durationWeeks)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [tone, setTone] = useState<string>(AI_PRESETS[0].defaults.tone)
  const [targetAudience, setTargetAudience] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(false)

  const [error, setError] = useState('')
  const [recommendNote, setRecommendNote] = useState('')
  const [isRecommending, setIsRecommending] = useState(false)

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

  const pendingItemsRef = useRef<ContentPlanRow[]>([])
  const autoGenerateRef = useRef(false)
  const appliedContextRef = useRef(false)

  const normalizedContentPerWeek = clampNumber(Math.trunc(contentPerWeek || 0), 1, 14)
  const normalizedDurationWeeks = clampNumber(Math.trunc(durationWeeks || 0), 1, 12)
  const estimatedCount = normalizedContentPerWeek * normalizedDurationWeeks

  const selectedPreset = AI_PRESETS.find((p) => p.id === selectedPresetId) ?? AI_PRESETS[0]

  const previewWeekKeys = Array.from(
    new Set(sortRows(previewRows).map((r) => r.week_label).filter(Boolean))
  )

  const selectedPreviewRows = previewRows.filter((r) => selectedPreviewIds.includes(r.preview_id))
  const saveTargetRows = selectedPreviewRows.length > 0 ? selectedPreviewRows : previewRows

  const setPresetDefaults = useCallback((presetId: AiPresetId) => {
    const preset = AI_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setSelectedPresetId(preset.id)
    setTone(preset.defaults.tone)
    setContentIdea(preset.defaults.contentIdea)
    setContentPerWeek(preset.defaults.contentPerWeek)
    setDurationWeeks(preset.defaults.durationWeeks)
  }, [])

  const resetPreviewState = useCallback(() => {
    setError('')
    setPreviewRows([])
    setPreviewLoading(false)
    setSavingPreview(false)
    setStreamProgress({ current: 0, total: 0 })
    setStreamMessage('')
    setSelectedPreviewIds([])
    pendingItemsRef.current = []
  }, [])

  const reset = useCallback(() => {
    setWizardStep(0)
    setPresetDefaults(AI_PRESETS[0].id)
    setPlatform(PLATFORMS[0])
    setNiche('')
    setTargetAudience('')
    setStartDate(null)
    setReplaceExisting(false)
    setRecommendNote('')
    resetPreviewState()
    appliedContextRef.current = false
  }, [setPresetDefaults, resetPreviewState])

  // Draft exists if user has typed any identifying content
  const hasDraft = niche !== '' || targetAudience !== ''

  const openWizard = useCallback((options?: { preserveDraft?: boolean; prefill?: { niche?: string; platform?: string; goal?: string; targetAudience?: string } }) => {
    const currentHasDraft = niche !== '' || targetAudience !== ''
    if (options?.preserveDraft || currentHasDraft) {
      // Preserve form fields, only reset preview/stream state
      setWizardStep(0)
      resetPreviewState()
    } else {
      reset()
    }
    if (options?.prefill) {
      if (options.prefill.niche) setNiche(options.prefill.niche)
      if (options.prefill.platform) setPlatform(options.prefill.platform)
      if (options.prefill.goal) setContentIdea(options.prefill.goal)
      if (options.prefill.targetAudience) setTargetAudience(options.prefill.targetAudience)
    }
    // Auto-fill from business context if not already applied
    if (!appliedContextRef.current && businessContext) {
      appliedContextRef.current = true
      if (businessContext.niche) setNiche(businessContext.niche)
      if (businessContext.preferredPlatform) setPlatform(businessContext.preferredPlatform)
      if (businessContext.targetAudience) setTargetAudience(businessContext.targetAudience)
    }
    setOpen(true)
  }, [niche, targetAudience, reset, resetPreviewState, businessContext])

  // Close and save draft — called on backdrop click / Escape key
  const closeWithDraft = useCallback(() => {
    setOpen(false)
    // Intentionally no reset — form fields preserved in hook memory as draft
  }, [])

  // Full cancel — discards all draft data
  const closeWizard = useCallback(() => {
    setOpen(false)
    reset()
  }, [reset])

  const recommend = useCallback(async () => {
    if (!token) return
    setIsRecommending(true)
    setError('')
    setRecommendNote('')
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
      setPresetDefaults(rec.preset ?? 'awareness')
      if (rec.campaign_idea) setContentIdea(rec.campaign_idea)
      if (rec.tone) setTone(rec.tone)
      if (rec.content_per_week) setContentPerWeek(rec.content_per_week)
      if (rec.duration_weeks) setDurationWeeks(rec.duration_weeks)
      if (rec.reasoning) setRecommendNote(rec.reasoning)
      autoGenerateRef.current = true
      setWizardStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendapatkan rekomendasi AI')
    } finally {
      setIsRecommending(false)
    }
  }, [token, setPresetDefaults])

  const generatePreview = useCallback(async () => {
    if (!token) return
    resetPreviewState()
    setPreviewLoading(true)
    setWizardStep(1)
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
          target_audience: targetAudience || undefined,
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
            setPreviewRows((prev) => sortRows([...prev, createPreviewRow(item)]))
            setStreamProgress({ current: count, total })
            setStreamMessage(`Preview ${count}/${total} siap direview`)
          },
          onComplete: (total, message) => {
            setPreviewRows(sortRows(pendingItemsRef.current.map(createPreviewRow)))
            setStreamProgress({ current: total, total })
            setStreamMessage(message)
            setPreviewLoading(false)
          },
          onError: (message) => {
            setError(message)
            setPreviewLoading(false)
          },
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat preview AI')
      setPreviewLoading(false)
    }
  }, [
    token, resetPreviewState, generateScheduleStream,
    normalizedContentPerWeek, platform, niche, contentIdea,
    normalizedDurationWeeks, startDate, tone, targetAudience,
  ])

  const savePreview = useCallback(async () => {
    if (!token || saveTargetRows.length === 0) return
    setSavingPreview(true)
    setError('')
    try {
      if (replaceExisting) await deleteAllContentPlan(token)
      const saved = await batchCreateContentPlan(stripPreviewRows(saveTargetRows), token)
      setStreamMessage(`Tersimpan. ${saved.length} item masuk ke Content Plan.`)
      onSaved(saved, replaceExisting)
      setTimeout(() => closeWizard(), 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan preview ke database')
    } finally {
      setSavingPreview(false)
    }
  }, [token, saveTargetRows, replaceExisting, onSaved, closeWizard])

  const selectAll = useCallback(() => setSelectedPreviewIds(previewRows.map((r) => r.preview_id)), [previewRows])
  const clearSelection = useCallback(() => setSelectedPreviewIds([]), [])
  const toggleRow = useCallback((id: string) => {
    setSelectedPreviewIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }, [])
  const selectWeek = useCallback((weekLabel: string) => {
    const ids = previewRows.filter((r) => r.week_label === weekLabel).map((r) => r.preview_id)
    setSelectedPreviewIds((prev) => Array.from(new Set([...prev, ...ids])))
  }, [previewRows])
  const applyBulk = useCallback((updater: (row: PreviewRow) => PreviewRow) => {
    const targetIds = new Set(selectedPreviewIds.length > 0 ? selectedPreviewIds : previewRows.map((r) => r.preview_id))
    setPreviewRows((prev) => sortRows(prev.map((r) => (targetIds.has(r.preview_id) ? updater(r) : r))))
  }, [previewRows, selectedPreviewIds])
  const bulkRemove = useCallback(() => {
    const targetIds = new Set(selectedPreviewIds.length > 0 ? selectedPreviewIds : previewRows.map((r) => r.preview_id))
    setPreviewRows((prev) => prev.filter((r) => !targetIds.has(r.preview_id)))
    setSelectedPreviewIds([])
  }, [previewRows, selectedPreviewIds])
  const copyPreview = useCallback((id: string) => {
    setCopiedPreviewId(id)
    setTimeout(() => setCopiedPreviewId(null), 2000)
  }, [])

  return {
    // open state
    open, openWizard, closeWizard, closeWithDraft, hasDraft,
    // wizard navigation
    wizardStep, setWizardStep,
    autoGenerateRef,
    // setup fields
    selectedPresetId, selectedPreset,
    contentPerWeek, setContentPerWeek, normalizedContentPerWeek,
    platform, setPlatform,
    niche, setNiche,
    contentIdea, setContentIdea,
    durationWeeks, setDurationWeeks, normalizedDurationWeeks,
    startDate, setStartDate,
    tone, setTone,
    targetAudience, setTargetAudience,
    replaceExisting, setReplaceExisting,
    estimatedCount,
    setPresetDefaults,
    // AI actions
    recommend, isRecommending, recommendNote,
    generatePreview, previewLoading,
    savePreview, savingPreview,
    // stream
    streamProgress, streamMessage,
    // preview management
    previewRows, previewWeekKeys,
    selectedPreviewIds,
    selectedPreviewRows,
    saveTargetRows,
    selectAll, clearSelection, toggleRow, selectWeek,
    applyBulk, bulkRemove,
    bulkStatus, setBulkStatus,
    bulkFormat, setBulkFormat,
    bulkTime, setBulkTime,
    copiedPreviewId, copyPreview,
    // error
    error, setError,
  }
}
