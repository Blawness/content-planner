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
  theme: string,
  durationWeeks: number
) => `You are an expert Content Planner.
Create a content calendar for ${durationWeeks} weeks, with ${contentPerWeek} posts per week.
Context:
- Platform: ${platform}
- Theme/Campaign: ${theme}

Return ONLY a valid JSON array of objects, each representing a single post slot.
Keys must be: "week" (number), "day" (string: Mon, Tue, Wed, etc.), "topic" (string), "format" (string)

Example:
[
  { "week": 1, "day": "Mon", "topic": "Edukasi Dasar", "format": "Single Image" },
  { "week": 1, "day": "Wed", "topic": "Storytelling di balik layar", "format": "Video" }
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
