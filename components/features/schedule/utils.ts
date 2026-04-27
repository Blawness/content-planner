import { addDays, endOfWeek, format, isValid, parse, startOfWeek } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { ContentPlanRow } from '@/types'
import type { PreviewRow } from './constants'

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function getStatusCellClass(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('done')) return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
  if (normalized.includes('review')) return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
  return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
}

export function parseUiDate(value: string) {
  const parsed = parse(value, 'dd/MM/yyyy', new Date())
  return isValid(parsed) ? parsed : null
}

export function formatUiDate(date: Date) {
  return format(date, 'dd/MM/yyyy')
}

export function getUiDay(date: Date) {
  const label = format(date, 'EEEE', { locale: localeId })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getWeekOfMonth(weekMonday: Date): number {
  const firstOfMonth = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), 1)
  const firstWeekMonday = startOfWeek(firstOfMonth, { weekStartsOn: 1 })
  const diffDays = Math.round((weekMonday.getTime() - firstWeekMonday.getTime()) / 86_400_000)
  return Math.floor(diffDays / 7) + 1
}

export function buildWeekLabel(weekMonday: Date): string {
  const weekNum = getWeekOfMonth(weekMonday)
  const monthLabel = format(weekMonday, 'MMMM yyyy', { locale: localeId })
  return `Minggu ${weekNum} - ${monthLabel}`
}

export function parseWeekLabel(label: string) {
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
  // Legacy format: "Minggu 1 - 22/04/2026 - 24/04/2026"
  const oldMatch = label.match(/^Minggu\s+(\d+)\s+-\s+(\d{2}\/\d{2}\/\d{4})\s+-\s+(\d{2}\/\d{2}\/\d{4})/)
  if (oldMatch) {
    const start = parse(oldMatch[2], 'dd/MM/yyyy', new Date())
    const end = parse(oldMatch[3], 'dd/MM/yyyy', new Date())
    return isValid(start) && isValid(end) ? { weekNum: oldMatch[1], start, end } : null
  }
  return null
}

export function detectWeekLabel(date: Date, existingRows: ContentPlanRow[]): string {
  for (const row of existingRows) {
    const parsed = parseWeekLabel(row.week_label ?? '')
    if (!parsed) continue
    if (date >= parsed.start && date <= parsed.end) return row.week_label!
  }
  const weekMonday = startOfWeek(date, { weekStartsOn: 1 })
  return buildWeekLabel(weekMonday)
}

export function sortRows<T extends ContentPlanRow>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const dateA = parseUiDate(a.date)
    const dateB = parseUiDate(b.date)
    if (!dateA || !dateB) return a.week_label.localeCompare(b.week_label)
    return dateA.getTime() - dateB.getTime()
  })
}

export function createPreviewRow(row: ContentPlanRow): PreviewRow {
  return {
    ...row,
    preview_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }
}

export function stripPreviewRows(rows: PreviewRow[]): ContentPlanRow[] {
  return rows.map(({ preview_id: _previewId, ...row }) => row)
}

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

const CSV_HEADERS = [
  'Minggu', 'Tanggal', 'Hari', 'Topik', 'Format', 'Headline',
  'Deskripsi Visual', 'Isi Konten', 'Hook / Caption',
  'Waktu Publish', 'Status', 'Catatan',
]

function csvCell(value: string | undefined | null): string {
  const str = value ?? ''
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCsv(rows: ContentPlanRow[], filename = 'content-plan.csv'): void {
  const lines = [
    CSV_HEADERS.join(','),
    ...rows.map((r) =>
      [
        r.week_label, r.date, r.day, r.topic, r.format, r.headline,
        r.visual_description, r.content_body, r.hook_caption,
        r.scheduled_time, r.status, r.notes,
      ]
        .map(csvCell)
        .join(',')
    ),
  ]
  const bom = '﻿'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildCopyText(row: ContentPlanRow): string {
  const sep = '─'.repeat(40)
  return [
    `${row.format.toUpperCase()} · ${row.topic}`,
    `${row.date} · ${row.day} · ${row.scheduled_time}`,
    sep, '',
    'HEADLINE', row.headline || '-', '',
    'HOOK / CAPTION', row.hook_caption || '-', '',
    'ISI KONTEN', row.content_body || '-', '',
    'DESKRIPSI VISUAL', row.visual_description || '-',
  ].join('\n')
}
