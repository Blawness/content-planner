'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'

const FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']

interface Props {
  message: string
  current: number
  total: number
  estimatedCount: number
}

export function StreamingLoader({ message, current, total, estimatedCount }: Props) {
  const [frame, setFrame] = useState(0)
  const [log, setLog] = useState<{ id: number; text: string }[]>([])
  const prevMessage = useRef('')
  const counter = useRef(0)

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!message || message === prevMessage.current) return
    prevMessage.current = message
    counter.current += 1
    setLog((prev) => [...prev.slice(-3), { id: counter.current, text: message }])
  }, [message])

  const resolvedTotal = total || estimatedCount
  const percent = resolvedTotal > 0 ? Math.max((current / resolvedTotal) * 100, 3) : 3

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div className="flex items-center gap-3">
          <span className="select-none font-mono text-lg leading-none text-foreground">
            {FRAMES[frame]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">AI sedang menyiapkan preview</p>
            <p className="truncate text-sm text-muted-foreground">
              {resolvedTotal > 0
                ? `${current} dari ${resolvedTotal} konten selesai`
                : 'Menghubungi AI...'}
            </p>
          </div>
          {resolvedTotal > 0 && (
            <span className="shrink-0 rounded-full border border-border bg-muted/60 px-2.5 py-1 font-mono text-xs tabular-nums text-foreground">
              {current}/{resolvedTotal}
            </span>
          )}
        </div>

        <div className="min-h-[4rem] space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-mono text-xs">
          {log.length === 0 ? (
            <p className="text-muted-foreground/50">Waiting for AI response...</p>
          ) : (
            log.map((entry, i) => {
              const isLatest = i === log.length - 1
              return (
                <p
                  key={entry.id}
                  className={cn('ai-log-in', isLatest ? 'text-foreground' : 'text-muted-foreground/40')}
                >
                  <span className={cn('mr-2', isLatest ? 'text-foreground' : 'text-muted-foreground/30')}>
                    {isLatest ? '▶' : '·'}
                  </span>
                  {entry.text}
                  {isLatest && (
                    <span className="ai-cursor ml-0.5 inline-block h-3 w-1.5 align-middle bg-foreground" />
                  )}
                </p>
              )
            })
          )}
        </div>

        <div className="space-y-1.5">
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="relative h-full overflow-hidden bg-foreground transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            >
              <div className="ai-shimmer" />
            </div>
          </div>
          <p className="text-right font-mono text-xs tabular-nums text-muted-foreground">
            {Math.round(percent)}%
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
