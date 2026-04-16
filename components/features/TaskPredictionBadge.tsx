'use client'

import { useState, useEffect } from 'react'
import { predictTask } from '@/lib/api/ai'

export function TaskPredictionBadge({
  taskId,
  taskTitle: _taskTitle,
  token,
}: {
  taskId: string
  taskTitle: string
  token: string | null
}) {
  const [prediction, setPrediction] = useState<{ predictedHours: number; confidence: number } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    const run = async () => {
      setLoading(true)
      try {
        const res = await predictTask(taskId, token)
        setPrediction({ predictedHours: res.predictedHours, confidence: res.confidence })
      } catch {
        setPrediction(null)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [taskId, token])

  if (loading || !prediction) return null

  return (
    <p className="text-xs text-gray-500 mt-1">
      Prediksi: {prediction.predictedHours} jam · Confidence: {Math.round(prediction.confidence)}%
    </p>
  )
}
