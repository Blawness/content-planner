import type { ContentPlanItem } from '@prisma/client'

export function rowToResponse(item: ContentPlanItem) {
  return {
    id: item.id,
    week_label: item.weekLabel,
    date: item.date,
    day: item.day,
    topic: item.topic,
    format: item.format,
    headline: item.headline,
    visual_description: item.visualDescription ?? '',
    content_body: item.contentBody ?? '',
    hook_caption: item.hookCaption ?? '',
    scheduled_time: item.scheduledTime,
    status: item.status,
    notes: item.notes,
  }
}
