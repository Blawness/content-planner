'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { AIChatMessage } from '@/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/input'
import { PageHeader, PageShell } from '@/components/ui/page-shell'
import { aiChat } from '@/lib/api/ai'

const SUGGESTION_PROMPTS = [
  'Buatkan 30 ide konten untuk brand skincare.',
  'Kasih strategi naikkan engagement Instagram minggu ini.',
  'Buat template caption untuk promo produk baru.',
  'Analisis kenapa views Reels turun dan cara memperbaikinya.',
]

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-2 mt-3 text-2xl font-bold leading-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-3 text-xl font-semibold leading-tight">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-lg font-semibold leading-tight">{children}</h3>,
  p: ({ children }) => <p className="my-2 text-[14px] leading-7">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="text-[14px] leading-7">{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-4 border-border pl-3 italic text-muted-foreground">{children}</blockquote>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{children}</a>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }) => <th className="border-b border-border px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-border/60 px-3 py-2 align-top">{children}</td>,
  hr: () => <hr className="my-3 border-border" />,
  code: ({ className, children }) =>
    className ? (
      <code className="block overflow-x-auto rounded-md bg-foreground p-3 font-mono text-[12px] leading-6 text-background">{children}</code>
    ) : (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">{children}</code>
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
      const history = [...messages, userMessage].map((message) => ({ role: message.role, content: message.content }))
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
    <PageShell className="flex h-[calc(100vh-3.5rem)] max-w-5xl flex-col">
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Chat' },
        ]}
        eyebrow="Superuser Lab"
        title="AI Chat"
        description="Area eksplorasi percakapan AI untuk strategi konten. Flow user utama tetap dijalankan dari Content Plan wizard."
      />

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Mulai dari salah satu prompt singkat di bawah, atau tulis pertanyaan spesifik Anda.</p>
            ) : null}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                  {message.role === 'assistant' && typeof message.responseTimeMs === 'number' ? (
                    <p className="mt-2 text-xs text-muted-foreground">Response time: {(message.responseTimeMs / 1000).toFixed(2)}s</p>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">Mengetik...</div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border px-4 pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Suggestion prompt</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTION_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 border-t border-border p-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tulis pesan..." disabled={loading} className="h-10 flex-1" />
              <Button type="submit" disabled={loading || !input.trim()}>Kirim</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
