import type { ContentPlanRow } from '@/types'

export const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn']
export const TONES = ['Edukatif', 'Promosi', 'Entertaining', 'Inspiratif', 'Story Telling']
export const FORMAT_OPTIONS = ['Single Post', 'Carousel', 'Reels']
export const STATUS_OPTIONS = ['To Do', 'In Review', 'Done']
export const WIZARD_STEPS = ['Setup', 'Preview']

export const AI_PRESETS = [
  {
    id: 'awareness',
    label: 'Awareness',
    summary: 'Edukasi ringan untuk menaikkan reach dan membangun trust awal.',
    defaults: {
      tone: 'Edukatif',
      contentIdea: 'Bangun awareness dengan edukasi sederhana dan topik yang mudah dibagikan.',
      contentPerWeek: 3,
      durationWeeks: 1,
    },
    examples: ['Mitos vs fakta', 'Kesalahan paling umum', 'FAQ singkat untuk pemula'],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    summary: 'Mendorong komentar, save, dan interaksi komunitas.',
    defaults: {
      tone: 'Entertaining',
      contentIdea: 'Aktifkan interaksi lewat opini, checklist, dan format yang mengundang respons.',
      contentPerWeek: 4,
      durationWeeks: 1,
    },
    examples: ['A atau B', 'Checklist mingguan', 'Cerita relatable dari audiens'],
  },
  {
    id: 'launch',
    label: 'Product Launch',
    summary: 'Menyiapkan rangkaian konten teaser, value, dan CTA menjelang promo.',
    defaults: {
      tone: 'Promosi',
      contentIdea: 'Bangun minat menuju peluncuran produk dengan teaser, demo, dan CTA yang jelas.',
      contentPerWeek: 5,
      durationWeeks: 1,
    },
    examples: ['Teaser fitur utama', 'Before-after', 'Social proof dan CTA'],
  },
] as const

export type AiPresetId = (typeof AI_PRESETS)[number]['id']

export const EMPTY_ROW: ContentPlanRow = {
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

export type PreviewRow = ContentPlanRow & { preview_id: string }
