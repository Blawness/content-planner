'use client'

import { ChevronDown, ClipboardCheck, Copy, PencilLine, Plus } from 'lucide-react'
import type { ContentPlanRow } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { STATUS_OPTIONS } from './constants'
import { buildCopyText, getStatusCellClass } from './utils'

interface Props {
  rows: ContentPlanRow[]
  weekKeys: string[]
  expandedIndex: number | null
  copiedRowId: string | null
  onExpandToggle: (index: number) => void
  onWeekLabelClick: (label: string) => void
  onAddToWeek: (weekLabel: string) => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onStatusChange: (index: number, status: string) => void
  onCopy: (key: string) => void
}

function ContentRow({
  row,
  globalIndex,
  isExpanded,
  copiedRowId,
  onExpandToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onCopy,
}: {
  row: ContentPlanRow
  globalIndex: number
  isExpanded: boolean
  copiedRowId: string | null
  onExpandToggle: (index: number) => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onStatusChange: (index: number, status: string) => void
  onCopy: (key: string) => void
}) {
  const copyKey = row.id ?? String(globalIndex)

  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={() => onExpandToggle(globalIndex)}
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
                void navigator.clipboard.writeText(buildCopyText(row)).then(() => onCopy(copyKey))
              }}
            >
              {copiedRowId === copyKey ? (
                <><ClipboardCheck className="size-4" />Copied!</>
              ) : (
                <><Copy className="size-4" />Copy konten</>
              )}
            </Button>
            <Select value={row.status} onValueChange={(value) => onStatusChange(globalIndex, value ?? STATUS_OPTIONS[0])}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]">
                <SelectValue placeholder="Ubah status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => onEdit(globalIndex)}>
              <PencilLine className="size-4" />Edit
            </Button>
            <Button type="button" variant="destructive" onClick={() => onDelete(globalIndex)}>Hapus</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ContentPlanTable({ rows, weekKeys, expandedIndex, copiedRowId, onExpandToggle, onWeekLabelClick, onAddToWeek, onEdit, onDelete, onStatusChange, onCopy }: Props) {
  return (
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
                    onClick={() => onWeekLabelClick(weekLabel)}
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
                    onClick={() => onAddToWeek(weekLabel)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {weekRows.map((row, idx) => (
                <ContentRow
                  key={`${row.id ?? row.date}-${idx}`}
                  row={row}
                  globalIndex={rows.indexOf(row)}
                  isExpanded={expandedIndex === rows.indexOf(row)}
                  copiedRowId={copiedRowId}
                  onExpandToggle={onExpandToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onCopy={onCopy}
                />
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
