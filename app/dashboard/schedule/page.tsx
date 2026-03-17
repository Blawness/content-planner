'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { generateSchedule } from '@/lib/api/ai'
import type { ScheduleSlot } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']

export default function SchedulePage() {
  const [contentPerWeek, setContentPerWeek] = useState(3)
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [theme, setTheme] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(2)
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [weeks, setWeeks] = useState<Record<string, ScheduleSlot[]>>({})
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
        { content_per_week: contentPerWeek, platform, theme, duration_weeks: durationWeeks },
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
  const weekKeys = Object.keys(weeks).length ? Object.keys(weeks).sort() : []
  const flatSlots = schedule.length ? schedule : weekKeys.flatMap((wk) => weeks[wk] ?? [])

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">AI Content Schedule Generator</h1>
      <p className="text-gray-600 mb-6">
        Generate jadwal konten per minggu berdasarkan platform dan tema campaign.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
            {error}
          </p>
        )}
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
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
              Tema campaign
            </label>
            <input
              id="theme"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              required
              placeholder="Contoh: Ramadan, New Year"
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
          <h2 className="text-lg font-semibold">Content Calendar</h2>
          {weekKeys.length > 0 ? (
            <div className="space-y-6">
              {weekKeys.map((weekLabel) => (
                <Card key={weekLabel}>
                  <CardHeader className="font-medium text-gray-900">{weekLabel}</CardHeader>
                  <CardContent>
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {(weeks[weekLabel] ?? []).map((slot, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                        >
                          <span className="font-medium text-gray-900">{slot.day}</span>
                          <span className="text-gray-600"> — {slot.theme}</span>
                          {slot.label && (
                            <span className="block text-gray-500 text-xs mt-0.5">{slot.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {flatSlots.map((slot, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <p className="font-medium text-gray-900">{slot.day}</p>
                    <p className="text-sm text-gray-600">{slot.theme}</p>
                    {slot.label && <p className="text-xs text-gray-500 mt-1">{slot.label}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
