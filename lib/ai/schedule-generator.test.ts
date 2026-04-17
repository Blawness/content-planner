import assert from 'node:assert/strict';
import test from 'node:test';

import { generateScheduleRows, isTooSimilarText, rowFingerprint } from './schedule-generator';

test('isTooSimilarText detects near-identical topic phrasing', () => {
  assert.equal(isTooSimilarText('Apa itu SHM dan kenapa penting', 'Apa itu SHM? Kenapa penting untuk pemilik tanah'), true);
  assert.equal(isTooSimilarText('Panduan balik nama SHM', 'Checklist pajak properti untuk pembeli pertama'), false);
});

test('generateScheduleRows groups by backend week slots and removes duplicates', async () => {
  let regenerateCounter = 0;
  let detailCounter = 0;

  const rows = await generateScheduleRows(
    {
      contentPerWeek: 3,
      platform: 'Instagram',
      niche: 'Properti',
      contentIdea: 'Edukasi SHM',
      monthLabel: 'April 2026',
      durationWeeks: 2,
      startDate: '17/04/2026',
      tone: 'Edukatif',
      targetAudience: 'Pembeli rumah pertama',
    },
    {
      callAi: async (prompt) => {
        if (prompt.includes('Create exactly 6 UNIQUE content idea seeds')) {
          return JSON.stringify({
            ideas: [
              {
                topic_seed: 'SHM',
                angle: 'Apa itu SHM',
                headline_seed: 'Apa itu SHM?',
                format_hint: 'Carousel',
                hook_seed: 'Pahami SHM sebelum membeli properti',
              },
              {
                topic_seed: 'SHM',
                angle: 'Apa itu SHM',
                headline_seed: 'Apa itu SHM?',
                format_hint: 'Carousel',
                hook_seed: 'Pahami SHM sebelum membeli properti',
              },
              {
                topic_seed: 'SHM',
                angle: 'Apa itu SHM',
                headline_seed: 'Apa itu SHM?',
                format_hint: 'Reels',
                hook_seed: 'Pahami SHM sebelum membeli properti',
              },
              {
                topic_seed: 'Balik Nama SHM',
                angle: 'Langkah balik nama',
                headline_seed: 'Cara balik nama SHM',
                format_hint: 'Carousel',
                hook_seed: 'Balik nama SHM bisa dilakukan tanpa panik',
              },
              {
                topic_seed: 'Biaya SHM',
                angle: 'Rincian biaya legal',
                headline_seed: 'Biaya urus SHM',
                format_hint: 'Single Post',
                hook_seed: 'Hitung biaya SHM dari awal agar aman',
              },
              {
                topic_seed: 'Risiko SHM',
                angle: 'Risiko data tidak update',
                headline_seed: 'Bahaya SHM tidak update',
                format_hint: 'Reels',
                hook_seed: 'Kesalahan SHM bisa berujung sengketa',
              },
            ],
          });
        }

        if (prompt.includes('Generate ONE content idea seed that is strictly different')) {
          regenerateCounter += 1;
          return JSON.stringify({
            topic_seed: `Topik Regenerasi ${regenerateCounter}`,
            angle: `Sudut unik ${regenerateCounter}`,
            headline_seed: `Headline unik ${regenerateCounter}`,
            format_hint: regenerateCounter % 2 === 0 ? 'Reels' : 'Carousel',
            hook_seed: `Hook unik ${regenerateCounter}`,
          });
        }

        if (prompt.includes('Expand ONE idea into practical content details')) {
          detailCounter += 1;
          return JSON.stringify({
            topic: `Topik Detail ${detailCounter}`,
            format: detailCounter % 2 === 0 ? 'Reels' : 'Carousel',
            headline: `Headline Detail ${detailCounter}`,
            visual_description: `Visual Detail ${detailCounter}`,
            content_body: `Body Detail ${detailCounter}`,
            hook_caption: `Hook Detail ${detailCounter}`,
          });
        }

        throw new Error(`Unexpected prompt: ${prompt.slice(0, 80)}`);
      },
      now: new Date('2026-04-10T00:00:00.000Z'),
    }
  );

  assert.equal(rows.length, 6);

  const week1 = rows.slice(0, 3);
  const week2 = rows.slice(3, 6);

  assert.ok(week1.every((row) => row.week_label === week1[0].week_label));
  assert.ok(week2.every((row) => row.week_label === week2[0].week_label));
  assert.notEqual(week1[0].week_label, week2[0].week_label);

  assert.equal(rows[0].date, '17/04/2026');
  assert.equal(rows[1].date, '18/04/2026');
  assert.equal(rows[2].date, '19/04/2026');
  assert.equal(rows[3].date, '20/04/2026');

  const fingerprints = rows.map((row) => rowFingerprint(row));
  const unique = new Set(fingerprints);
  assert.equal(unique.size, rows.length);

  assert.ok(regenerateCounter >= 1);
});


