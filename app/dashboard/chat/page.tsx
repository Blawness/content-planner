'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { aiChat } from '@/lib/api/ai'
import type { AIChatMessage } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ChatPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !input.trim()) return
    const userMessage: AIChatMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError('')
    setLoading(true)
    try {
      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const res = await aiChat(userMessage.content, token, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response ?? '' }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-0px)] max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Chat Assistant</h1>
      <p className="text-gray-600 mb-4">
        Tanyakan strategi konten, minta ide, atau template caption.
      </p>

      <Card className="flex-1 flex flex-col min-h-0 mb-4">
        <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm">
                Contoh: &quot;Buatkan 30 ide konten untuk brand skincare&quot; atau &quot;Bagaimana meningkatkan engagement Instagram?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
                  Mengetik...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex gap-2">
            {error && (
              <p className="absolute bottom-full left-4 right-4 text-sm text-red-600 bg-red-50 p-2 rounded mb-2" role="alert">
                {error}
              </p>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan..."
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Kirim
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
