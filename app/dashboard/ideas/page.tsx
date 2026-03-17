'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { generateContent } from '@/lib/api/ai'
import type { ContentIdea } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']

export default function IdeasPage() {
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [goal, setGoal] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [count, setCount] = useState(3)
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)
    setIdeas([])
    try {
      const res = await generateContent(
        { niche, platform, goal, target_audience: targetAudience, count },
        token
      )
      setIdeas(res.ideas ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal generate ide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">AI Content Idea Generator</h1>
      <p className="text-gray-600 mb-6">
        Masukkan niche, platform, goal, dan target audience untuk mendapatkan ide konten.
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
              Niche bisnis
            </label>
            <input
              id="niche"
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              required
              placeholder="Contoh: Skincare, F&B"
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
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
            Goal konten
          </label>
          <input
            id="goal"
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            placeholder="Contoh: Brand awareness, konversi"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
            Target audience
          </label>
          <input
            id="audience"
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            required
            placeholder="Contoh: Wanita 25-34, urban"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah ide
          </label>
          <input
            id="count"
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full max-w-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Generate...' : 'Generate Ide'}
        </Button>
      </form>

      {ideas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Hasil</h2>
          <ul className="space-y-4">
            {ideas.map((idea, i) => (
              <li key={i}>
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <p className="font-semibold text-gray-900">{idea.title}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Hook:</span> {idea.hook}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Format:</span> {idea.format}
                    </p>
                    {idea.caption_draft && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Caption draft:</span> {idea.caption_draft}
                      </p>
                    )}
                    {idea.cta && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">CTA:</span> {idea.cta}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
