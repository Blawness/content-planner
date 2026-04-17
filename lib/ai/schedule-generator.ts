import { addDays, format, parse, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import type { ContentPlanRow } from '../../types';
import {
  generateScheduleDetailPrompt,
  generateScheduleIdeasPrompt,
  regenerateUniqueIdeaPrompt,
} from '../prompts';

export type ScheduleGeneratorInput = {
  contentPerWeek: number;
  platform: string;
  niche: string;
  contentIdea?: string;
  monthLabel?: string;
  durationWeeks: number;
  startDate?: string;
  tone?: string;
  targetAudience?: string;
};

export type ScheduleGeneratorProgress = {
  phase: 'idea_generation' | 'detail_expansion';
  message: string;
  generated: number;
  total: number;
};

export type ScheduleGeneratorDeps = {
  callAi: (prompt: string) => Promise<string>;
  onProgress?: (event: ScheduleGeneratorProgress) => void;
  onItem?: (item: ContentPlanRow, count: number, total: number) => void;
  onAiCall?: (prompt: string, response: string) => Promise<void> | void;
  now?: Date;
};

type IdeaSeed = {
  topic_seed: string;
  angle: string;
  headline_seed: string;
  format_hint: string;
  hook_seed: string;
};

type DetailSeed = {
  topic: string;
  format: string;
  headline: string;
  visual_description: string;
  content_body: string;
  hook_caption: string;
};

const ALLOWED_FORMATS = ['Single Post', 'Carousel', 'Reels'] as const;
const MAX_REGEN_TRY = 3;

function toStringValue(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function normalizeWhitespace(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(value: string) {
  return new Set(normalizeWhitespace(value).split(' ').filter((token) => token.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function intersectionCount(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const item of a) {
    if (b.has(item)) count += 1;
  }
  return count;
}

export function isTooSimilarText(left: string, right: string) {
  const a = normalizeWhitespace(left);
  const b = normalizeWhitespace(right);

  if (!a || !b) return false;
  if (a === b) return true;

  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (shorter.length >= 10 && longer.includes(shorter)) {
    return true;
  }

  const tokenA = tokenize(a);
  const tokenB = tokenize(b);
  const overlap = intersectionCount(tokenA, tokenB);
  const minTokenSize = Math.min(tokenA.size, tokenB.size);

  if (minTokenSize > 0 && overlap >= Math.max(4, minTokenSize - 1)) {
    return true;
  }

  return jaccardSimilarity(tokenA, tokenB) >= 0.82;
}

function normalizeFormat(formatHint: string) {
  const candidate = toStringValue(formatHint, 'Single Post');
  const direct = ALLOWED_FORMATS.find((item) => item.toLowerCase() === candidate.toLowerCase());
  if (direct) return direct;
  if (candidate.toLowerCase().includes('car')) return 'Carousel';
  if (candidate.toLowerCase().includes('reel')) return 'Reels';
  return 'Single Post';
}

function getDayIndonesian(date: Date) {
  const label = format(date, 'EEEE', { locale: localeId });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function parseStartDate(startDate: string | undefined, now: Date) {
  if (startDate) {
    const parsed = parse(startDate, 'dd/MM/yyyy', now);
    if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
  }
  return startOfDay(now);
}

function createWeekLabel(weekNumber: number, weekStart: Date, weekEnd: Date, monthLabel?: string) {
  const range = `${format(weekStart, 'dd/MM/yyyy')} - ${format(weekEnd, 'dd/MM/yyyy')}`;
  const suffix = monthLabel?.trim() ? ` (${monthLabel.trim()})` : '';
  return `Minggu ${weekNumber} - ${range}${suffix}`;
}

export function rowFingerprint(row: Pick<ContentPlanRow, 'topic' | 'headline' | 'hook_caption'>) {
  return normalizeWhitespace(`${row.topic} ${row.headline} ${row.hook_caption}`);
}

function ideaFingerprint(idea: IdeaSeed) {
  return normalizeWhitespace(`${idea.topic_seed} ${idea.angle} ${idea.headline_seed} ${idea.hook_seed}`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return null;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function normalizeIdea(value: unknown): IdeaSeed {
  const record = asRecord(value) ?? {};
  return {
    topic_seed: toStringValue(record.topic_seed, '-'),
    angle: toStringValue(record.angle, '-'),
    headline_seed: toStringValue(record.headline_seed, '-'),
    format_hint: normalizeFormat(toStringValue(record.format_hint, 'Single Post')),
    hook_seed: toStringValue(record.hook_seed, '-'),
  };
}

function normalizeDetail(value: unknown, fallback: IdeaSeed): DetailSeed {
  const record = asRecord(value) ?? {};
  return {
    topic: toStringValue(record.topic, fallback.topic_seed),
    format: normalizeFormat(toStringValue(record.format, fallback.format_hint)),
    headline: toStringValue(record.headline, fallback.headline_seed),
    visual_description: toStringValue(record.visual_description, `Visual ${fallback.format_hint} untuk ${fallback.topic_seed}`),
    content_body: toStringValue(record.content_body, `Bahas ${fallback.angle} secara praktis untuk audiens.`),
    hook_caption: toStringValue(record.hook_caption, fallback.hook_seed),
  };
}

function extractIdeas(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.ideas)) return record.ideas;
  if (Array.isArray(record.rows)) return record.rows;
  if (Array.isArray(record.schedule)) return record.schedule;
  return [];
}

function extractDetail(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload[0] ?? {};
  const record = asRecord(payload);
  if (!record) return {};
  if (record.row && typeof record.row === 'object') return record.row;
  if (record.detail && typeof record.detail === 'object') return record.detail;
  return record;
}

function isDuplicateIdea(candidate: IdeaSeed, accepted: IdeaSeed[]) {
  const candidateFp = ideaFingerprint(candidate);
  return accepted.some((item) => {
    const targetFp = ideaFingerprint(item);
    return isTooSimilarText(candidateFp, targetFp);
  });
}

function isDuplicateRow(candidate: Pick<ContentPlanRow, 'topic' | 'headline' | 'hook_caption'>, accepted: ContentPlanRow[]) {
  const candidateFp = rowFingerprint(candidate);
  return accepted.some((row) => isTooSimilarText(candidateFp, rowFingerprint(row)));
}

function scheduledTimeForSlot(positionInWeek: number) {
  const slots = ['10:00 WIB', '13:00 WIB', '19:00 WIB', '09:00 WIB', '16:00 WIB', '20:00 WIB', '08:00 WIB'];
  return slots[(positionInWeek - 1) % slots.length] ?? '10:00 WIB';
}

function fallbackIdea(index: number): IdeaSeed {
  return {
    topic_seed: `Topik unik ${index + 1}`,
    angle: `Sudut pembahasan spesifik ${index + 1}`,
    headline_seed: `Insight praktis #${index + 1}`,
    format_hint: 'Single Post',
    hook_seed: `Ada hal penting yang sering terlewat pada poin #${index + 1}`,
  };
}

function fallbackDetail(idea: IdeaSeed, index: number): DetailSeed {
  return {
    topic: `${idea.topic_seed} #${index + 1}`,
    format: normalizeFormat(idea.format_hint),
    headline: `${idea.headline_seed} (${index + 1})`,
    visual_description: `Visual ${normalizeFormat(idea.format_hint)} yang menonjolkan poin ${idea.angle}`,
    content_body: `Uraikan ${idea.angle} dengan langkah konkret, kesalahan umum, dan tips implementasi yang langsung bisa dipraktikkan.`,
    hook_caption: `${idea.hook_seed} Simpan agar tidak lupa.`,
  };
}

async function callAiWithAudit(prompt: string, deps: ScheduleGeneratorDeps) {
  const response = await deps.callAi(prompt);
  await deps.onAiCall?.(prompt, response);
  return response;
}

export async function generateScheduleRows(input: ScheduleGeneratorInput, deps: ScheduleGeneratorDeps): Promise<ContentPlanRow[]> {
  const maxWeeks = Math.min(Math.max(input.durationWeeks, 1), 12);
  const maxPosts = Math.min(Math.max(input.contentPerWeek, 1), 14);
  const totalItems = maxWeeks * maxPosts;

  const now = deps.now ?? new Date();
  const baseDate = parseStartDate(input.startDate, now);

  deps.onProgress?.({
    phase: 'idea_generation',
    message: `Menyusun ${totalItems} ide unik...`,
    generated: 0,
    total: totalItems,
  });

  const ideasPrompt = generateScheduleIdeasPrompt(
    totalItems,
    input.platform,
    input.niche,
    input.contentIdea,
    maxWeeks,
    maxPosts,
    input.tone,
    input.targetAudience,
    input.monthLabel
  );

  const ideaRaw = await callAiWithAudit(ideasPrompt, deps);
  const parsedIdeas = extractIdeas(parseJson(ideaRaw)).map(normalizeIdea);

  const ideaSeeds: IdeaSeed[] = [];

  for (let index = 0; index < totalItems; index += 1) {
    const baseIdea = parsedIdeas[index] ?? fallbackIdea(index);
    let acceptedIdea = baseIdea;

    if (isDuplicateIdea(acceptedIdea, ideaSeeds)) {
      let replaced = false;
      for (let attempt = 0; attempt < MAX_REGEN_TRY; attempt += 1) {
        const retryPrompt = regenerateUniqueIdeaPrompt(
          input.platform,
          input.niche,
          input.contentIdea,
          input.tone,
          input.targetAudience,
          ideaSeeds.map(ideaFingerprint),
          index + 1
        );

        const retryRaw = await callAiWithAudit(retryPrompt, deps);
        const retryIdea = normalizeIdea(parseJson(retryRaw));
        if (!isDuplicateIdea(retryIdea, ideaSeeds)) {
          acceptedIdea = retryIdea;
          replaced = true;
          break;
        }
      }

      if (!replaced) {
        acceptedIdea = {
          ...acceptedIdea,
          topic_seed: `${acceptedIdea.topic_seed} - variasi ${index + 1}`,
          angle: `${acceptedIdea.angle} - sudut ${index + 1}`,
          headline_seed: `${acceptedIdea.headline_seed} #${index + 1}`,
          hook_seed: `${acceptedIdea.hook_seed} (${index + 1})`,
        };
      }
    }

    ideaSeeds.push(acceptedIdea);

    deps.onProgress?.({
      phase: 'idea_generation',
      message: `Ide unik ${ideaSeeds.length}/${totalItems} siap`,
      generated: ideaSeeds.length,
      total: totalItems,
    });
  }

  deps.onProgress?.({
    phase: 'detail_expansion',
    message: 'Mengembangkan ide menjadi konten detail...',
    generated: 0,
    total: totalItems,
  });

  const rows: ContentPlanRow[] = [];

  for (let index = 0; index < totalItems; index += 1) {
    const idea = ideaSeeds[index] ?? fallbackIdea(index);
    const weekNumber = Math.floor(index / maxPosts) + 1;
    const positionInWeek = (index % maxPosts) + 1;

    const weekStart = addDays(baseDate, (weekNumber - 1) * maxPosts);
    const weekEnd = addDays(weekStart, maxPosts - 1);
    const postDate = addDays(baseDate, index);

    let detail = fallbackDetail(idea, index);

    for (let attempt = 0; attempt < MAX_REGEN_TRY; attempt += 1) {
      try {
        const prompt = generateScheduleDetailPrompt(
          input.platform,
          input.niche,
          input.tone,
          input.targetAudience,
          input.contentIdea,
          idea,
          weekNumber,
          positionInWeek,
          rows.map(rowFingerprint)
        );

        const raw = await callAiWithAudit(prompt, deps);
        const parsedDetail = normalizeDetail(extractDetail(parseJson(raw)), idea);

        const duplicate = isDuplicateRow(
          {
            topic: parsedDetail.topic,
            headline: parsedDetail.headline,
            hook_caption: parsedDetail.hook_caption,
          },
          rows
        );

        if (!duplicate) {
          detail = parsedDetail;
          break;
        }
      } catch {
        // Keep retrying and eventually fallback.
      }
    }

    const row: ContentPlanRow = {
      week_label: createWeekLabel(weekNumber, weekStart, weekEnd, input.monthLabel),
      date: format(postDate, 'dd/MM/yyyy'),
      day: getDayIndonesian(postDate),
      topic: detail.topic,
      format: normalizeFormat(detail.format),
      headline: detail.headline,
      visual_description: detail.visual_description,
      content_body: detail.content_body,
      hook_caption: detail.hook_caption,
      scheduled_time: scheduledTimeForSlot(positionInWeek),
      status: 'To Do',
      notes: 'Baru',
    };

    if (isDuplicateRow(row, rows)) {
      const fallback = fallbackDetail(idea, index + 1000);
      row.topic = fallback.topic;
      row.headline = fallback.headline;
      row.hook_caption = fallback.hook_caption;
      row.visual_description = fallback.visual_description;
      row.content_body = fallback.content_body;
      row.format = normalizeFormat(fallback.format);
    }

    rows.push(row);
    deps.onItem?.(row, rows.length, totalItems);

    deps.onProgress?.({
      phase: 'detail_expansion',
      message: `Detail konten ${rows.length}/${totalItems} siap`,
      generated: rows.length,
      total: totalItems,
    });
  }

  return rows;
}

