'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { generateSchedule } from '@/lib/api/ai'
import type { ContentPlanRow } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']
const TABLE_COLUMNS = [
  'Tanggal',
  'Hari',
  'Tema / Topik',
  'Format',
  'Headline / Judul Konten',
  'Deskripsi Visual',
  'Isi Konten',
  'Hook / Caption',
  'Scheduled Time',
  'Status',
  'Keterangan',
]

function getStatusCellClass(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('existing')) return 'bg-blue-50 text-blue-700'
  if (normalized.includes('done')) return 'bg-emerald-50 text-emerald-700'
  return 'bg-amber-50 text-amber-700'
}

export default function SchedulePage() {
  const [contentPerWeek, setContentPerWeek] = useState(3)
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [niche, setNiche] = useState('')
  const [contentIdea, setContentIdea] = useState('')
  const [monthLabel, setMonthLabel] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(2)
  const [schedule, setSchedule] = useState<ContentPlanRow[]>([])
  const [weeks, setWeeks] = useState<Record<string, ContentPlanRow[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)
    setSchedule([])
    setWeeks({})
    try {
      const res = await generateSchedule(
        {
          content_per_week: contentPerWeek,
          platform,
          niche,
          content_idea: contentIdea || undefined,
          month_label: monthLabel || undefined,
          duration_weeks: durationWeeks,
        },
        token
      )
      setSchedule(res.schedule ?? [])
      if (res.weeks) setWeeks(res.weeks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal generate jadwal')
    } finally {
      setLoading(false)
    }
  }

  const hasSchedule = schedule.length > 0 || Object.keys(weeks).length > 0
  const weekKeys = Object.keys(weeks).length ? Object.keys(weeks) : []
  const flatSlots = schedule.length ? schedule : weekKeys.flatMap((wk) => weeks[wk] ?? [])

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-2xl font-bold mb-4">AI Content Plan Generator</h1>
      <p className="text-gray-600 mb-6">
        Generate tabel content plan dengan format spreadsheet berdasarkan niche atau ide pilihan Anda.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
              Niche
            </label>
            <input
              id="niche"
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              required
              placeholder="Contoh: Properti, Kesehatan, Edukasi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contentIdea" className="block text-sm font-medium text-gray-700 mb-1">
              Ide / campaign utama (opsional)
            </label>
            <input
              id="contentIdea"
              type="text"
              value={contentIdea}
              onChange={(e) => setContentIdea(e.target.value)}
              placeholder="Contoh: Edukasi SHM vs HGB bulan ini"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="monthLabel" className="block text-sm font-medium text-gray-700 mb-1">
              Label periode (opsional)
            </label>
            <input
              id="monthLabel"
              type="text"
              value={monthLabel}
              onChange={(e) => setMonthLabel(e.target.value)}
              placeholder="Contoh: 17-30 April 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contentPerWeek" className="block text-sm font-medium text-gray-700 mb-1">
              Konten per minggu
            </label>
            <input
              id="contentPerWeek"
              type="number"
              min={1}
              max={14}
              value={contentPerWeek}
              onChange={(e) => setContentPerWeek(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Durasi (minggu)
            </label>
            <input
              id="duration"
              type="number"
              min={1}
              max={12}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Generate...' : 'Generate Jadwal'}
        </Button>
      </form>

      {hasSchedule && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Hasil Content Plan</h2>
          {weekKeys.length > 0 ? (
            <div className="space-y-6">
              {weekKeys.map((weekLabel) => (
                <Card key={weekLabel}>
                  <CardContent className="pt-4">
                    <div className="font-medium text-gray-900 mb-3">{weekLabel}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm min-w-[1320px]">
                        <thead>
                          <tr className="bg-gray-100 border-y border-gray-200">
                            {TABLE_COLUMNS.map((column) => (
                              <th key={column} className="p-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(weeks[weekLabel] ?? []).map((slot, i) => (
                            <tr key={`${slot.date}-${i}`} className="border-b border-gray-100 align-top">
                              <td className="p-2">{slot.date}</td>
                              <td className="p-2">{slot.day}</td>
                              <td className="p-2">{slot.topic}</td>
                              <td className="p-2">{slot.format}</td>
                              <td className="p-2 font-medium text-gray-900">{slot.headline}</td>
                              <td className="p-2 text-gray-600">{slot.visual_description}</td>
                              <td className="p-2 text-gray-600">{slot.content_body}</td>
                              <td className="p-2 text-gray-600">{slot.hook_caption}</td>
                              <td className="p-2 whitespace-nowrap">{slot.scheduled_time}</td>
                              <td className="p-2">
                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusCellClass(slot.status)}`}>
                                  {slot.status}
                                </span>
                              </td>
                              <td className="p-2">{slot.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse text-sm min-w-[1320px]">
                <thead>
                  <tr className="bg-gray-100 border-y border-gray-200">
                    {TABLE_COLUMNS.map((column) => (
                      <th key={column} className="p-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flatSlots.map((slot, i) => (
                    <tr key={`${slot.date}-${i}`} className="border-b border-gray-100 align-top">
                      <td className="p-2">{slot.date}</td>
                      <td className="p-2">{slot.day}</td>
                      <td className="p-2">{slot.topic}</td>
                      <td className="p-2">{slot.format}</td>
                      <td className="p-2 font-medium text-gray-900">{slot.headline}</td>
                      <td className="p-2 text-gray-600">{slot.visual_description}</td>
                      <td className="p-2 text-gray-600">{slot.content_body}</td>
                      <td className="p-2 text-gray-600">{slot.hook_caption}</td>
                      <td className="p-2 whitespace-nowrap">{slot.scheduled_time}</td>
                      <td className="p-2">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusCellClass(slot.status)}`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="p-2">{slot.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
