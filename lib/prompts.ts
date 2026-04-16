export const generateContentPrompt = (
  niche: string,
  platform: string,
  goal: string,
  targetAudience: string,
  count: number
) => `You are an expert Social Media Manager and Content Strategist.
Generate ${count} content ideas for the following context:
- Niche: ${niche}
- Platform: ${platform}
- Goal: ${goal}
- Target Audience: ${targetAudience}

Return ONLY a valid JSON array of objects with the exact keys:
"title", "hook", "format", "caption_draft", "cta"

Example:
[
  {
    "title": "5 Kesalahan Branding UMKM",
    "hook": "90% UMKM gagal branding karena hal sepele ini",
    "format": "Instagram Carousel",
    "caption_draft": "Membangun brand bukan sekadar logo. Perhatikan 5 hal ini...",
    "cta": "Simpan post ini untuk panduanmu!"
  }
]`;

export const generateSchedulePrompt = (
  contentPerWeek: number,
  platform: string,
  niche: string,
  contentIdea: string | undefined,
  durationWeeks: number,
  monthLabel: string | undefined,
  startDate?: string,
  tone?: string,
  targetAudience?: string
) => `You are an expert Content Planner.
Create a detailed Instagram-like content plan table for ${durationWeeks} weeks, with ${contentPerWeek} posts per week.
Total: ${durationWeeks * contentPerWeek} content plan items.

Context:
- Platform: ${platform}
- Niche: ${niche}
- Main idea/campaign: ${contentIdea || 'General brand awareness'}
- Month/period label: ${monthLabel || 'Use reasonable period label from current date'}
- Start date: ${startDate ? `Begin from ${startDate} (DD/MM/YYYY), distribute posts across days of the week sequentially from this date` : 'Use today as start date, estimate based on current context'}
- Tone/Style: ${tone || 'Edukatif'}
- Target Audience: ${targetAudience || 'General audience'}

CRITICAL: Return ONLY a valid JSON ARRAY (start with [ and end with ]) containing ${durationWeeks * contentPerWeek} objects.
Each object represents ONE table row with these keys:
"week_label", "date", "day", "topic", "format", "headline", "visual_description", "content_body", "hook_caption", "scheduled_time", "status", "notes"

Rules:
- Use Bahasa Indonesia for all content text.
- "date" format must be DD/MM/YYYY.
- "day" must be Indonesian day name (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu).
- "format" should be one of: Single Post, Carousel, Reels.
- "scheduled_time" example: 10:00 WIB or 04:00 WIB.
- "status" should be "To Do" for new plans unless there is a strong reason otherwise.
- "notes" default to "Baru".
- Fill every key with practical and usable value (not empty).
- DO NOT return a single object or nested object - return a flat ARRAY with all ${durationWeeks * contentPerWeek} items.

Example (for 2 weeks, 2 posts per week = 4 items):
[
  {
    "week_label": "Minggu 1 - 17-20 April 2026 : Topik SHM",
    "date": "17/04/2026",
    "day": "Jumat",
    "topic": "SHM",
    "format": "Carousel",
    "headline": "SHM Turun-Temurun: Aman atau Perlu Diperbarui?",
    "visual_description": "Slide 1 cover, slide 2 definisi, slide 3 risiko, slide 4 CTA",
    "content_body": "Jelaskan definisi SHM, kapan wajib update data, dan langkah praktis mengecek keabsahan dokumen.",
    "hook_caption": "Warisan tanah tanpa balik nama itu risiko. Yuk pahami aturan SHM supaya segara urus sebelum waris.",
    "scheduled_time": "10:00 WIB",
    "status": "To Do",
    "notes": "Baru"
  },
  {
    "week_label": "Minggu 1 - 17-20 April 2026 : Topik SHM",
    "date": "19/04/2026",
    "day": "Minggu",
    "topic": "SHM",
    "format": "Reels",
    "headline": "Cerita Nyata: Kasus Balik Nama SHM",
    "visual_description": "Video testimoni singkat dengan subtitle",
    "content_body": "Cerita dari user yang mengalami masalah dengan SHM.",
    "hook_caption": "Kisah nyata yang mengubah segalanya...",
    "scheduled_time": "19:00 WIB",
    "status": "To Do",
    "notes": "Baru"
  }
]`;

export const predictTaskPrompt = (taskTitle: string) => `You are an expert Project Manager.
Based on the following task title/description, predict the estimated time to complete it if done by a professional.
Task: "${taskTitle}"

Return ONLY a valid JSON object with exact keys:
- "predictedHours": number (e.g., 2.5)
- "confidence": number between 0 and 100 representing your confidence in this estimation.

Example:
{
  "predictedHours": 2.5,
  "confidence": 85
}`;
