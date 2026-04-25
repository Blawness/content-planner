'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DateRangePicker } from '@/components/ui/DateRangePicker'

interface Props {
  open: boolean
  weekRange: [Date | null, Date | null]
  saving: boolean
  onWeekRangeChange: (range: [Date | null, Date | null]) => void
  onApply: () => void
  onClose: () => void
}

export function WeekLabelPickerDialog({ open, weekRange, saving, onWeekRangeChange, onApply, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
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
            onDateRangeChange={(range) => onWeekRangeChange([range?.from || null, range?.to || null])}
            placeholder="Pilih rentang tanggal minggu"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button
            type="button"
            disabled={!weekRange[0] || !weekRange[1] || saving}
            onClick={onApply}
          >
            {saving ? 'Menyimpan...' : 'Terapkan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
