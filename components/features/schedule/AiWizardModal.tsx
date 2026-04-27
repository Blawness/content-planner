'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Brain, CheckCheck, ClipboardCheck, Copy, Save, Trash2, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { DatePicker } from '@/components/ui/DatePicker'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { PageEmptyState } from '@/components/ui/page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AI_PRESETS, PLATFORMS, TONES, FORMAT_OPTIONS, STATUS_OPTIONS, WIZARD_STEPS } from './constants'
import { buildCopyText } from './utils'
import type { AiWizardState } from './hooks/useAiWizard'

function ValidationList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

interface Props {
  wizard: AiWizardState
  hasBusinessContext: boolean
  blockingIssues: string[]
  hints: string[]
}

export function AiWizardModal({ wizard, hasBusinessContext, blockingIssues, hints }: Props) {
  const {
    open, closeWizard, closeWithDraft, hasDraft, wizardStep, setWizardStep,
    selectedPresetId, selectedPreset, setPresetDefaults,
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
    recommend, isRecommending, recommendNote,
    generatePreview, previewLoading,
    savePreview, savingPreview, saveTargetRows,
    streamProgress, streamMessage,
    previewRows, previewWeekKeys,
    selectedPreviewIds, selectAll, clearSelection, toggleRow, selectWeek,
    applyBulk, bulkRemove,
    bulkStatus, setBulkStatus, bulkFormat, setBulkFormat, bulkTime, setBulkTime,
    copiedPreviewId, copyPreview,
    error, autoGenerateRef,
  } = wizard

  const canGeneratePreview = blockingIssues.length === 0 && !previewLoading
  const canSavePreview = !previewLoading && !savingPreview && saveTargetRows.length > 0

  useEffect(() => {
    if (wizardStep === 1 && autoGenerateRef.current) {
      autoGenerateRef.current = false
      void generatePreview()
    }
  }, [wizardStep, generatePreview, autoGenerateRef])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      const primary = event.ctrlKey || event.metaKey
      if (primary && key === 'enter') {
        event.preventDefault()
        if (wizardStep === 0 && canGeneratePreview) void generatePreview()
        else if (wizardStep === 1 && canSavePreview) void savePreview()
        return
      }
      if (event.altKey && event.key === 'ArrowLeft' && wizardStep > 0 && !previewLoading && !savingPreview) {
        event.preventDefault()
        setWizardStep((prev) => Math.max(prev - 1, 0))
        return
      }
      if (event.altKey && event.key === 'ArrowRight' && wizardStep === 0 && canGeneratePreview) {
        event.preventDefault()
        void generatePreview()
        return
      }
      if (wizardStep === 1 && event.shiftKey && key === 'a' && previewRows.length > 0) {
        event.preventDefault()
        selectAll()
        return
      }
      if (wizardStep === 1 && event.shiftKey && key === 'x') {
        event.preventDefault()
        clearSelection()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, wizardStep, canGeneratePreview, canSavePreview, previewLoading, savingPreview, previewRows.length, generatePreview, savePreview, setWizardStep, selectAll, clearSelection])

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) closeWithDraft() }}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0 sm:max-w-5xl" showCloseButton={false}>
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader>
              <DialogTitle>AI Content Plan Wizard</DialogTitle>
              <DialogDescription>Pilih preset, atur parameter, review preview hasil AI, lalu simpan ke content plan ketika sudah yakin.</DialogDescription>
            </DialogHeader>
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              {hasDraft ? (
                <span className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                  <Save className="size-3" />Draft tersimpan
                </span>
              ) : null}
              <button
                type="button"
                onClick={closeWithDraft}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Tutup (simpan draft)"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
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

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Proses AI belum berhasil</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {wizardStep === 0 ? (
            <div className="space-y-5">
              {hasBusinessContext ? (
                <Card>
                  <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profil Bisnis Tersimpan</p>
                      <p className="mt-1 font-medium">{niche}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{platform} · {tone}</p>
                    </div>
                    <Link href="/dashboard/settings" className="shrink-0 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={closeWizard}>
                      Edit profil
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertTitle>Profil bisnis belum diatur</AlertTitle>
                  <AlertDescription>
                    <Link href="/dashboard/settings" className="font-medium underline underline-offset-4" onClick={closeWizard}>
                      Isi profil bisnis di Pengaturan
                    </Link>{' '}
                    agar wizard bisa auto-fill dan AI bisa merekomendasikan campaign terbaik untuk bisnis Anda.
                  </AlertDescription>
                </Alert>
              )}

              {recommendNote ? (
                <Alert>
                  <Brain className="size-4" />
                  <AlertTitle>AI merekomendasikan konfigurasi ini</AlertTitle>
                  <AlertDescription>{recommendNote}</AlertDescription>
                </Alert>
              ) : null}

              {blockingIssues.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTitle>Lengkapi setup dulu</AlertTitle>
                  <AlertDescription><ValidationList items={blockingIssues} /></AlertDescription>
                </Alert>
              ) : null}

              {hints.length > 0 ? (
                <Alert>
                  <AlertTitle>Tips sebelum generate</AlertTitle>
                  <AlertDescription><ValidationList items={hints} /></AlertDescription>
                </Alert>
              ) : null}

              <FormSection title="Pilih preset" description="Preset memberi starting point yang lebih cepat. Semua parameter di bawah masih bisa diubah.">
                <div className="grid gap-4 md:grid-cols-3">
                  {AI_PRESETS.map((preset) => {
                    const active = selectedPresetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setPresetDefaults(preset.id)}
                        className={cn(
                          'rounded-xl border p-4 text-left transition-colors',
                          active ? 'border-foreground bg-foreground text-background' : 'border-border bg-background hover:bg-muted/40'
                        )}
                      >
                        <p className="font-medium">{preset.label}</p>
                        <p className={cn('mt-2 text-sm leading-6', active ? 'text-background/80' : 'text-muted-foreground')}>{preset.summary}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preset.examples.map((example) => (
                            <span key={example} className={cn('rounded-full border px-2 py-1 text-xs', active ? 'border-background/20 text-background/80' : 'border-border text-muted-foreground')}>
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
                      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{PLATFORMS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Niche" htmlFor="aiNiche" required description="Contoh: klinik gigi keluarga, skincare acne-prone, catering sehat untuk kantor.">
                    <Input id="aiNiche" value={niche} onChange={(e) => setNiche(e.target.value)} className="h-10" />
                  </FormField>
                  <FormField label="Target audience" htmlFor="aiAudience" description="Contoh: wanita 25-34 di kota besar, pemilik UMKM F&B, orang tua dengan anak balita." className="md:col-span-2">
                    <Input id="aiAudience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="h-10" />
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
                      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{TONES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                </FormGrid>
                <FormGrid className="md:grid-cols-3">
                  <FormField label="Tanggal mulai" htmlFor="aiStartDate">
                    <DatePicker date={startDate || undefined} onDateChange={(date) => setStartDate(date || null)} placeholder="Pilih tanggal mulai" className="h-10" />
                  </FormField>
                  <FormField label="Konten per minggu" htmlFor="aiContentPerWeek">
                    <Input id="aiContentPerWeek" type="number" min={1} max={14} value={contentPerWeek}
                      onChange={(e) => setContentPerWeek(Number(e.target.value))}
                      onBlur={() => setContentPerWeek(normalizedContentPerWeek)}
                      className="h-10"
                    />
                  </FormField>
                  <FormField label="Durasi (minggu)" htmlFor="aiDurationWeeks">
                    <Input id="aiDurationWeeks" type="number" min={1} max={12} value={durationWeeks}
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
                  {[
                    { label: 'Preset', value: selectedPreset.label },
                    { label: 'Platform', value: platform },
                    { label: 'Niche', value: niche || '-' },
                    { label: 'Output', value: `${estimatedCount} konten` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                      <p className="mt-1 font-medium">{value}</p>
                    </div>
                  ))}
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
                      <Badge variant="secondary">{streamProgress.current}/{streamProgress.total || estimatedCount}</Badge>
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
                <PageEmptyState title="Preview belum dibuat" description="Kembali ke langkah konfigurasi lalu jalankan AI untuk membuat draft yang bisa direview." />
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
                              ? `${selectedPreviewIds.length} baris dipilih.`
                              : 'Belum ada baris dipilih. Aksi berlaku ke semua preview.'}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                            <CheckCheck className="size-4" />Pilih Semua
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={clearSelection} disabled={selectedPreviewIds.length === 0}>
                            Clear Selection
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={bulkRemove} disabled={previewRows.length === 0}>
                            <Trash2 className="size-4" />Hapus dari Preview
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
                      <FormField label="Set status">
                        <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v ?? STATUS_OPTIONS[0])}>
                          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormField>
                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={() => applyBulk((row) => ({ ...row, status: bulkStatus }))}>Terapkan</Button>
                      </div>
                      <FormField label="Set format">
                        <Select value={bulkFormat} onValueChange={(v) => setBulkFormat(v ?? FORMAT_OPTIONS[0])}>
                          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>{FORMAT_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormField>
                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={() => applyBulk((row) => ({ ...row, format: bulkFormat }))}>Terapkan</Button>
                      </div>
                      <FormField label="Set waktu publish">
                        <Input value={bulkTime} onChange={(e) => setBulkTime(e.target.value)} placeholder="10:00 WIB" className="h-10" />
                      </FormField>
                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={() => applyBulk((row) => ({ ...row, scheduled_time: bulkTime || '10:00 WIB' }))}>Terapkan</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {previewWeekKeys.map((weekLabel) => {
                    const groupRows = previewRows.filter((r) => r.week_label === weekLabel)
                    return (
                      <Card key={weekLabel}>
                        <CardHeader className="border-b border-border bg-muted/40">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <CardTitle className="text-base">{weekLabel}</CardTitle>
                              <CardDescription>{groupRows.length} konten preview</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => selectWeek(weekLabel)}>
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
                                      <input type="checkbox" checked={selectedPreviewIds.includes(row.preview_id)} onChange={() => toggleRow(row.preview_id)} className="size-3.5 rounded border-border" />
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
                                  <Button type="button" variant="outline" size="sm"
                                    onClick={() => void navigator.clipboard.writeText(buildCopyText(row)).then(() => copyPreview(row.preview_id))}
                                  >
                                    {copiedPreviewId === row.preview_id
                                      ? <><ClipboardCheck className="size-4" />Copied!</>
                                      : <><Copy className="size-4" />Copy konten</>
                                    }
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
              <Button type="button" variant="outline" onClick={closeWizard}>Buang Draft</Button>
              {hasBusinessContext ? (
                <Button type="button" variant="outline" onClick={() => void recommend()} disabled={isRecommending}>
                  <Brain className="size-4" />
                  {isRecommending ? 'AI sedang memilih...' : 'AI Pilihkan Campaign'}
                </Button>
              ) : null}
              <Button type="button" onClick={() => void generatePreview()} disabled={!canGeneratePreview}>
                {previewLoading ? 'Menyiapkan preview...' : 'Buat Preview AI'}
              </Button>
            </>
          ) : null}
          {wizardStep === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={() => setWizardStep(0)} disabled={previewLoading || savingPreview}>Edit Setup</Button>
              <Button type="button" variant="outline" onClick={() => void generatePreview()} disabled={previewLoading || savingPreview}>Preview Ulang</Button>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3">
                <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} id="replaceExisting" />
                <label htmlFor="replaceExisting" className="cursor-pointer text-sm text-muted-foreground">Hapus item lama</label>
              </div>
              <Button type="button" onClick={() => void savePreview()} disabled={!canSavePreview}>
                {savingPreview ? 'Menyimpan...' : `Simpan ${saveTargetRows.length} Baris`}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
