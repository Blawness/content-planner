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

export const generateScheduleIdeasPrompt = (
  totalItems: number,
  platform: string,
  niche: string,
  contentIdea: string | undefined,
  durationWeeks: number,
  contentPerWeek: number,
  tone?: string,
  targetAudience?: string,
  monthLabel?: string
) => `You are an expert Content Strategist.
Create exactly ${totalItems} UNIQUE content idea seeds for a ${durationWeeks}-week campaign with ${contentPerWeek} posts per week.

Context:
- Platform: ${platform}
- Niche: ${niche}
- Main campaign idea: ${contentIdea || 'General brand awareness'}
- Tone/Style: ${tone || 'Edukatif'}
- Target Audience: ${targetAudience || 'General audience'}
- Month/Period label: ${monthLabel || 'Use current relevant period'}

CRITICAL UNIQUENESS RULES:
- Every item MUST have a different angle/subtopic.
- DO NOT repeat same educational question with small wording changes.
- If one item is "Apa itu SHM", others must use different subtopic/intent (e.g. risiko, langkah, studi kasus, biaya, kesalahan umum).
- Avoid semantic duplicates across topic_seed, angle, and headline_seed.

Return ONLY valid JSON in this format:
{
  "ideas": [
    {
      "topic_seed": "string",
      "angle": "string",
      "headline_seed": "string",
      "format_hint": "Single Post | Carousel | Reels",
      "hook_seed": "string"
    }
  ]
}

Rules:
- Output MUST contain exactly ${totalItems} items in "ideas".
- Use Bahasa Indonesia.
- "format_hint" must be one of: Single Post, Carousel, Reels.
- Do not include markdown or explanations.`;

export const regenerateUniqueIdeaPrompt = (
  platform: string,
  niche: string,
  contentIdea: string | undefined,
  tone: string | undefined,
  targetAudience: string | undefined,
  forbiddenFingerprints: string[],
  index: number
) => `You are an expert Content Strategist.
Generate ONE content idea seed that is strictly different from all forbidden themes below.

Context:
- Platform: ${platform}
- Niche: ${niche}
- Main campaign idea: ${contentIdea || 'General brand awareness'}
- Tone/Style: ${tone || 'Edukatif'}
- Target Audience: ${targetAudience || 'General audience'}
- Item index: ${index}

FORBIDDEN themes/fingerprints (MUST NOT be repeated in any close wording):
${forbiddenFingerprints.map((item, i) => `${i + 1}. ${item}`).join('\n') || '- none'}

Return ONLY valid JSON object:
{
  "topic_seed": "string",
  "angle": "string",
  "headline_seed": "string",
  "format_hint": "Single Post | Carousel | Reels",
  "hook_seed": "string"
}

Rules:
- Use Bahasa Indonesia.
- Must be semantically distinct from forbidden list.
- "format_hint" must be one of: Single Post, Carousel, Reels.
- No markdown, no explanation.`;

export const generateScheduleDetailPrompt = (
  platform: string,
  niche: string,
  tone: string | undefined,
  targetAudience: string | undefined,
  contentIdea: string | undefined,
  idea: {
    topic_seed: string;
    angle: string;
    headline_seed: string;
    format_hint: string;
    hook_seed: string;
  },
  weekNumber: number,
  positionInWeek: number,
  forbiddenFingerprints: string[]
) => `You are an expert Social Media Content Writer.
Expand ONE idea into practical content details.

Context:
- Platform: ${platform}
- Niche: ${niche}
- Campaign: ${contentIdea || 'General brand awareness'}
- Tone: ${tone || 'Edukatif'}
- Target Audience: ${targetAudience || 'General audience'}
- Week number: ${weekNumber}
- Slot in week: ${positionInWeek}

Idea seed:
- topic_seed: ${idea.topic_seed}
- angle: ${idea.angle}
- headline_seed: ${idea.headline_seed}
- format_hint: ${idea.format_hint}
- hook_seed: ${idea.hook_seed}

Avoid producing content semantically similar to:
${forbiddenFingerprints.map((item, i) => `${i + 1}. ${item}`).join('\n') || '- none'}

Return ONLY valid JSON object:
{
  "topic": "string",
  "format": "Single Post | Carousel | Reels",
  "headline": "string",
  "visual_description": "string",
  "content_body": "string",
  "hook_caption": "string"
}

Rules:
- Use Bahasa Indonesia.
- Keep it specific and directly usable.
- Ensure this item stays unique compared with forbidden list.
- No markdown, no explanation.`;

export const recommendCampaignPrompt = (
  brandName: string,
  industry: string,
  niche: string,
  targetAudience: string,
  brandVoice: string,
  postingGoal: string,
  currentDate: string
) => `You are an expert Content Strategist. Based on the business context below, recommend the optimal content campaign for right now.

Business Context:
- Brand: ${brandName || '(not set)'}
- Industry: ${industry || '(not set)'}
- Niche: ${niche}
- Target Audience: ${targetAudience || 'General audience'}
- Brand Voice: ${brandVoice}
- Main Posting Goal: ${postingGoal}
- Current date: ${currentDate}

Choose the most suitable campaign type and provide specific configuration.

Return ONLY valid JSON:
{
  "preset": "awareness" | "engagement" | "launch",
  "campaign_idea": "specific campaign angle and content direction, 2-3 sentences, in Bahasa Indonesia",
  "tone": "Edukatif" | "Promosi" | "Entertaining" | "Inspiratif" | "Story Telling",
  "content_per_week": number between 2 and 7,
  "duration_weeks": number between 2 and 6,
  "reasoning": "1-2 sentences in Bahasa Indonesia explaining why this campaign fits the business context and current timing"
}`;

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
