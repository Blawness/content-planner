'use client'

import type { ContentPlanRow } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-layout'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FORMAT_OPTIONS, STATUS_OPTIONS } from './constants'
import { detectWeekLabel, formatUiDate, getUiDay, parseUiDate } from './utils'

interface Props {
  open: boolean
  editingIndex: number | null
  formRow: ContentPlanRow
  formError: string
  saving: boolean
  rows: ContentPlanRow[]
  onChange: <K extends keyof ContentPlanRow>(key: K, value: ContentPlanRow[K]) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function CrudModal({ open, editingIndex, formRow, formError, saving, rows, onChange, onSubmit, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl" showCloseButton={false}>
        <div className="border-b border-border px-5 py-4">
          <DialogHeader>
            <DialogTitle>{editingIndex === null ? 'Tambah Item Manual' : 'Edit Item Content Plan'}</DialogTitle>
            <DialogDescription>Gunakan form yang sama untuk menjaga struktur data content plan tetap konsisten.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-5 py-5">
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
                  onChange={(e) => onChange('week_label', e.target.value)}
                  placeholder="Minggu 1 - April 2026"
                  className="h-10"
                />
              </FormField>

              <FormField label="Tanggal" htmlFor="date" required>
                <DatePicker
                  date={parseUiDate(formRow.date) || undefined}
                  onDateChange={(date) => {
                    if (!date) {
                      onChange('date', '')
                      onChange('day', '')
                      return
                    }
                    onChange('date', formatUiDate(date))
                    onChange('day', getUiDay(date))
                    onChange('week_label', detectWeekLabel(date, rows))
                  }}
                  placeholder="dd/mm/yyyy"
                  className="h-10"
                />
              </FormField>

              <FormField label="Hari" htmlFor="day" required>
                <Input id="day" value={formRow.day} readOnly placeholder="Otomatis dari tanggal" className="h-10" />
              </FormField>

              <FormField label="Format" required>
                <Select value={formRow.format} onValueChange={(value) => onChange('format', value ?? FORMAT_OPTIONS[0])}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Isi konten" description="Detail inti yang akan dipakai saat tim melakukan produksi atau publish.">
            <FormGrid>
              <FormField label="Topik" htmlFor="topic" required>
                <Input id="topic" value={formRow.topic} onChange={(e) => onChange('topic', e.target.value)} className="h-10" />
              </FormField>
              <FormField label="Headline" htmlFor="headline" required>
                <Input id="headline" value={formRow.headline} onChange={(e) => onChange('headline', e.target.value)} className="h-10" />
              </FormField>
            </FormGrid>

            <FormGrid className="md:grid-cols-3">
              <FormField label="Waktu publish" htmlFor="scheduledTime">
                <Input
                  id="scheduledTime"
                  value={formRow.scheduled_time}
                  onChange={(e) => onChange('scheduled_time', e.target.value)}
                  placeholder="10:00 WIB"
                  className="h-10"
                />
              </FormField>
              <FormField label="Status">
                <Select value={formRow.status} onValueChange={(value) => onChange('status', value ?? STATUS_OPTIONS[0])}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Keterangan" htmlFor="notes">
                <Input id="notes" value={formRow.notes} onChange={(e) => onChange('notes', e.target.value)} className="h-10" />
              </FormField>
            </FormGrid>

            <FormField label="Deskripsi visual" htmlFor="visualDescription">
              <Textarea id="visualDescription" value={formRow.visual_description} onChange={(e) => onChange('visual_description', e.target.value)} rows={3} />
            </FormField>
            <FormField label="Isi konten" htmlFor="contentBody">
              <Textarea id="contentBody" value={formRow.content_body} onChange={(e) => onChange('content_body', e.target.value)} rows={5} />
            </FormField>
            <FormField label="Hook / caption" htmlFor="hookCaption">
              <Textarea id="hookCaption" value={formRow.hook_caption} onChange={(e) => onChange('hook_caption', e.target.value)} rows={4} />
            </FormField>
          </FormSection>

          <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur">
            <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : editingIndex === null ? 'Tambah Item' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
