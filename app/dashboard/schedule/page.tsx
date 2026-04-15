'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useGenerateScheduleStream } from '@/hooks/useGenerateScheduleStream'
import type { ContentPlanRow } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronDown } from 'lucide-react'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']
const TABLE_COLUMNS = [
  'Tanggal',
  'Hari',
  'Tema / Topik',
  'Format',
  'Headline / Judul Konten',
  'Status',
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
  if (normalized.includes('existing')) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (normalized.includes('done')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

export default function SchedulePage() {
  const [rows, setRows] = useState<ContentPlanRow[]>([])
  const [formRow, setFormRow] = useState<ContentPlanRow>(EMPTY_ROW)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const [showCrudModal, setShowCrudModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)

  const [contentPerWeek, setContentPerWeek] = useState(3)
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [niche, setNiche] = useState('')
  const [contentIdea, setContentIdea] = useState('')
  const [monthLabel, setMonthLabel] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(2)
  const [loading, setLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [streamProgress, setStreamProgress] = useState({ current: 0, total: 0 })
  const [streamMessage, setStreamMessage] = useState('')
  const { token } = useAuth()
  const { generateScheduleStream } = useGenerateScheduleStream()

  function handleFormRowChange<K extends keyof ContentPlanRow>(key: K, value: ContentPlanRow[K]) {
    setFormRow((prev) => ({ ...prev, [key]: value }))
  }

  function openCreateModal() {
    setEditingIndex(null)
    setFormRow(EMPTY_ROW)
    setFormError('')
    setShowCrudModal(true)
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

  function handleRowSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!formRow.week_label || !formRow.date || !formRow.day || !formRow.topic || !formRow.headline) {
      setFormError('Lengkapi minimal minggu, tanggal, hari, topik, dan headline.')
      return
    }

    if (editingIndex === null) {
      setRows((prev) => [...prev, formRow])
    } else {
      setRows((prev) => prev.map((item, index) => (index === editingIndex ? formRow : item)))
    }

    handleCancelCrudModal()
  }

  function handleDelete(index: number) {
    setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
    if (expandedIndex === index) {
      setExpandedIndex(null)
    }
  }

  async function handleGenerateAi(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setAiError('')
    setLoading(true)
    setStreamProgress({ current: 0, total: 0 })
    setStreamMessage('')

    try {
      const totalItems = contentPerWeek * durationWeeks

      await generateScheduleStream(
        {
          content_per_week: contentPerWeek,
          platform,
          niche,
          content_idea: contentIdea || undefined,
          month_label: monthLabel || undefined,
          duration_weeks: durationWeeks,
        },
        token,
        {
          onStart: (total) => {
            setStreamProgress({ current: 0, total })
            setStreamMessage(`🚀 Starting... ${total} konten akan digenerate`)
          },
          onProgress: (message, generated, total) => {
            setStreamProgress({ current: generated, total })
            setStreamMessage(`⏳ ${message}`)
          },
          onItem: (item, count, total) => {
            setRows((prev) => [...prev, item])
            setStreamProgress({ current: count, total })
            setStreamMessage(`✅ Konten ${count}/${total} selesai`)
          },
          onComplete: (total, message) => {
            setStreamProgress({ current: total, total })
            setStreamMessage(`✨ ${message}`)
            setTimeout(() => {
              setShowAiModal(false)
              setLoading(false)
            }, 1000)
          },
          onError: (message) => {
            setAiError(`❌ ${message}`)
            setLoading(false)
          },
        }
      )
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal generate jadwal'
      setAiError(`❌ ${errorMsg}`)
      setLoading(false)
    }
  }

  const weekKeys = Array.from(new Set(rows.map((row) => row.week_label).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Content Plan</h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl">
            Kelola jadwal konten Anda dengan mudah. Tambah secara manual atau gunakan AI generator.
          </p>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <Button type="button" onClick={openCreateModal} className="gap-2 px-6 py-3 text-base font-semibold sm:w-auto">
            ➕ Tambah Baris Manual
          </Button>
          <Button type="button" onClick={() => setShowAiModal(true)} variant="secondary" className="gap-2 px-6 py-3 text-base font-semibold sm:w-auto">
            ✨ Buka AI Generator
          </Button>
        </div>

        <div className="space-y-6">
        {weekKeys.length > 0 ? (
          weekKeys.map((weekLabel) => {
            const weekRows = rows.filter((row) => row.week_label === weekLabel)
            return (
              <Card key={weekLabel} className="overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 md:px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{weekLabel}</h2>
                    <p className="text-sm text-gray-600 mt-1">{weekRows.length} konten</p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {weekRows.map((row, idx) => {
                      const globalIndex = rows.indexOf(row)
                      const isExpanded = expandedIndex === globalIndex
                      return (
                        <div key={`${row.date}-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                            className="w-full px-4 md:px-6 py-4 text-left"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 items-center">
                              <div className="col-span-1">
                                <p className="text-sm font-medium text-gray-900">{row.date}</p>
                                <p className="text-xs text-gray-500">{row.day}</p>
                              </div>
                              <div className="col-span-1 hidden md:block">
                                <p className="text-sm text-gray-700 truncate">{row.topic}</p>
                              </div>
                              <div className="col-span-1 hidden lg:block">
                                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                  {row.format}
                                </span>
                              </div>
                              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{row.headline}</p>
                              </div>
                              <div className="col-span-1 flex items-center justify-between gap-2">
                                <span
                                  className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusCellClass(row.status)}`}
                                >
                                  {row.status}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tema / Topik</p>
                                  <p className="text-sm text-gray-900">{row.topic}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Format</p>
                                  <p className="text-sm text-gray-900">{row.format}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Waktu Publish</p>
                                  <p className="text-sm text-gray-900">{row.scheduled_time}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Keterangan</p>
                                  <p className="text-sm text-gray-900">{row.notes}</p>
                                </div>
                              </div>

                              {row.visual_description && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Deskripsi Visual</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{row.visual_description}</p>
                                </div>
                              )}

                              {row.content_body && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Isi Konten</p>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{row.content_body}</p>
                                </div>
                              )}

                              {row.hook_caption && (
                                <div className="mb-4">
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hook / Caption</p>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{row.hook_caption}</p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(globalIndex)}
                                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(globalIndex)}
                                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  🗑️ Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="rounded-2xl border-2 border-dashed border-gray-300">
            <CardContent className="py-16 md:py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">Tabel masih kosong</p>
              <p className="text-sm text-gray-500 mb-6">Klik tombol di atas untuk menambah konten baru</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button type="button" onClick={openCreateModal} className="gap-2 px-4 py-2 text-sm">
                  ➕ Tambah Manual
                </Button>
                <Button type="button" onClick={() => setShowAiModal(true)} variant="secondary" className="gap-2 px-4 py-2 text-sm">
                  ✨ Generate AI
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* CRUD Modal */}
      {showCrudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-8 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIndex === null ? '➕ Tambah Baris Manual' : '✏️ Edit Baris'}
              </h3>
              <button
                type="button"
                onClick={handleCancelCrudModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRowSubmit} className="p-4 md:p-6 space-y-4">
              {formError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg" role="alert">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="weekLabel" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Label Minggu *
                  </label>
                  <input
                    id="weekLabel"
                    type="text"
                    value={formRow.week_label}
                    onChange={(e) => handleFormRowChange('week_label', e.target.value)}
                    placeholder="Minggu 1 - 17-20 April 2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tanggal *
                  </label>
                  <input
                    id="date"
                    type="text"
                    value={formRow.date}
                    onChange={(e) => handleFormRowChange('date', e.target.value)}
                    placeholder="17/04/2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hari *
                  </label>
                  <input
                    id="day"
                    type="text"
                    value={formRow.day}
                    onChange={(e) => handleFormRowChange('day', e.target.value)}
                    placeholder="Jumat"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Format *
                  </label>
                  <select
                    id="format"
                    value={formRow.format}
                    onChange={(e) => handleFormRowChange('format', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Single Post</option>
                    <option>Carousel</option>
                    <option>Reels</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tema / Topik *
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={formRow.topic}
                    onChange={(e) => handleFormRowChange('topic', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Headline / Judul *
                  </label>
                  <input
                    id="headline"
                    type="text"
                    value={formRow.headline}
                    onChange={(e) => handleFormRowChange('headline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Waktu Publish
                  </label>
                  <input
                    id="scheduledTime"
                    type="text"
                    value={formRow.scheduled_time}
                    onChange={(e) => handleFormRowChange('scheduled_time', e.target.value)}
                    placeholder="10:00 WIB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <input
                    id="status"
                    type="text"
                    value={formRow.status}
                    onChange={(e) => handleFormRowChange('status', e.target.value)}
                    placeholder="To Do"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Keterangan
                  </label>
                  <input
                    id="notes"
                    type="text"
                    value={formRow.notes}
                    onChange={(e) => handleFormRowChange('notes', e.target.value)}
                    placeholder="Baru"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="visualDescription" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deskripsi Visual
                </label>
                <textarea
                  id="visualDescription"
                  value={formRow.visual_description}
                  onChange={(e) => handleFormRowChange('visual_description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="contentBody" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Isi Konten
                </label>
                <textarea
                  id="contentBody"
                  value={formRow.content_body}
                  onChange={(e) => handleFormRowChange('content_body', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="hookCaption" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hook / Caption
                </label>
                <textarea
                  id="hookCaption"
                  value={formRow.hook_caption}
                  onChange={(e) => handleFormRowChange('hook_caption', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelCrudModal}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <Button type="submit" className="px-5 py-2.5 text-sm font-semibold">
                  {editingIndex === null ? 'Tambah Baris' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-8 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-900">✨ AI Content Plan Generator</h3>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleGenerateAi} className="p-4 md:p-6 space-y-4">
              {aiError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg" role="alert">
                  {aiError}
                </div>
              )}

              {loading && (
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">{streamMessage}</span>
                    <span className="text-sm font-bold text-blue-600">
                      {streamProgress.current}/{streamProgress.total}
                    </span>
                  </div>
                  {streamProgress.total > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{
                          width: `${(streamProgress.current / streamProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className={`grid gap-4 md:grid-cols-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label htmlFor="aiNiche" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Niche *
                  </label>
                  <input
                    id="aiNiche"
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="e.g., Digital Marketing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="aiPlatform" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Platform *
                  </label>
                  <select
                    id="aiPlatform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`grid gap-4 md:grid-cols-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label htmlFor="aiContentIdea" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ide / Campaign Utama
                  </label>
                  <input
                    id="aiContentIdea"
                    type="text"
                    value={contentIdea}
                    onChange={(e) => setContentIdea(e.target.value)}
                    disabled={loading}
                    placeholder="Opsional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="aiMonthLabel" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Label Periode
                  </label>
                  <input
                    id="aiMonthLabel"
                    type="text"
                    value={monthLabel}
                    onChange={(e) => setMonthLabel(e.target.value)}
                    disabled={loading}
                    placeholder="Opsional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className={`grid gap-4 md:grid-cols-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label htmlFor="aiContentPerWeek" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Konten per Minggu *
                  </label>
                  <input
                    id="aiContentPerWeek"
                    type="number"
                    min={1}
                    max={14}
                    value={contentPerWeek}
                    onChange={(e) => setContentPerWeek(Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="aiDurationWeeks" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Durasi (Minggu) *
                  </label>
                  <input
                    id="aiDurationWeeks"
                    type="number"
                    min={1}
                    max={12}
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <Button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-semibold">
                  {loading
                    ? `⏳ ${streamProgress.current}/${streamProgress.total}...`
                    : '✨ Generate & Tambah'
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
