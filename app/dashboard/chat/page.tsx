'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { aiChat } from '@/lib/api/ai'
import type { AIChatMessage } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SUGGESTION_PROMPTS = [
  'Buatkan 30 ide konten untuk brand skincare.',
  'Kasih strategi naikkan engagement Instagram minggu ini.',
  'Buat template caption untuk promo produk baru.',
  'Analisis kenapa views Reels turun dan cara memperbaikinya.',
  'Buat content pillar untuk bisnis kuliner rumahan.',
  'Rancang kalender konten 2 minggu untuk TikTok.',
]

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold mt-3 mb-2 leading-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold mt-3 mb-2 leading-tight">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold mt-3 mb-1.5 leading-tight">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold mt-2.5 mb-1.5 leading-tight">{children}</h4>,
  p: ({ children }) => <p className="my-2 leading-7 text-[14px]">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-7 text-[14px]">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-gray-300 pl-3 italic text-gray-700">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-gray-200">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
  th: ({ children }) => <th className="border-b border-gray-200 px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-gray-100 px-3 py-2 align-top">{children}</td>,
  hr: () => <hr className="my-3 border-gray-300" />,
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[12px] text-gray-800">
        {children}
      </code>
    ) : (
      <code className="block overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-[12px] leading-6 text-gray-100">
        {children}
      </code>
    ),
}

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

  async function sendMessage(rawMessage: string) {
    const content = rawMessage.trim()
    if (!token || !content || loading) return
    const userMessage: AIChatMessage = { role: 'user', content }
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
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.response ?? '',
          responseTimeMs: res.responseTimeMs,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await sendMessage(input)
  }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-0px)] max-w-5xl mx-auto w-full">
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
                  className={`max-w-[92%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div className="max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                  {m.role === 'assistant' && typeof m.responseTimeMs === 'number' && (
                    <p className="mt-2 text-xs text-gray-500">
                      Response time: {(m.responseTimeMs / 1000).toFixed(2)}s
                    </p>
                  )}
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
          <div className="px-4 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">Suggestion prompt:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTION_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
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
