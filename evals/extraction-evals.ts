/**
 * Extraction pipeline evals. Same philosophy as run-evals.ts: live Groq
 * calls, property assertions (which areas/fields the diff touches), never
 * exact-match on generated text.
 *
 * Run with: npx tsx evals/extraction-evals.ts
 */
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}

import { extractLifeModelDiff } from '../app/api/coach/extract/service';
import { emptyLifeModel } from '../lib/lifemodel/types';
import type { ExtractionDiff } from '../lib/lifemodel/extraction';

interface Scenario {
  name: string;
  conversationText: string;
  lifeModel?: unknown; // defaults to emptyLifeModel()
  assert: (diff: ExtractionDiff) => { pass: boolean; reason: string };
}

function touchesArea(diff: ExtractionDiff, area: string): boolean {
  return (
    diff.events.some((e) => e.area === area) ||
    diff.areas.some((a) => a.area === area)
  );
}

const modelWithTcsThread = (() => {
  const m = emptyLifeModel();
  m.areas.career.status = 'Job hunting.';
  m.areas.career.threads.push({ id: 'thread-tcs', text: 'interviewing at TCS', status: 'open' });
  return m;
})();

const scenarios: Scenario[] = [
  {
    name: 'career milestone creates a career event',
    conversationText: 'User: Had my interview at TCS today, I think it went really well!',
    assert: (diff) =>
      touchesArea(diff, 'career')
        ? { pass: true, reason: 'career area touched' }
        : { pass: false, reason: `career untouched: ${JSON.stringify(diff)}` },
  },
  {
    name: 'cross-domain check-in touches health or mental',
    conversationText:
      'User: Barely slept 3 hours last night worrying about the interview, and I skipped the gym again.',
    assert: (diff) => {
      const health = touchesArea(diff, 'health') || touchesArea(diff, 'mental');
      return health
        ? { pass: true, reason: 'health/mental touched' }
        : { pass: false, reason: `expected health or mental: ${JSON.stringify(diff)}` };
    },
  },
  {
    name: 'stated goal lands as a goal or event in financial',
    conversationText: 'User: I have decided I want to save 50,000 rupees by December for an emergency fund.',
    assert: (diff) => {
      const goal = diff.areas.some((a) => a.area === 'financial' && (a.addGoals?.length ?? 0) > 0);
      const evt = diff.events.some((e) => e.area === 'financial');
      return goal || evt
        ? { pass: true, reason: 'financial goal or event recorded' }
        : { pass: false, reason: `nothing in financial: ${JSON.stringify(diff)}` };
    },
  },
  {
    name: 'closing news references the existing thread id or records a career setback',
    conversationText: 'User: TCS sent the rejection email this morning. That door is closed.',
    lifeModel: modelWithTcsThread,
    assert: (diff) => {
      const closed = diff.areas.some((a) => a.closeThreadIds?.includes('thread-tcs'));
      const setback = diff.events.some((e) => e.area === 'career');
      return closed || setback
        ? { pass: true, reason: closed ? 'thread closed by id' : 'career setback recorded' }
        : { pass: false, reason: `no career update: ${JSON.stringify(diff)}` };
    },
  },
  {
    name: 'coaching style signal lands in profile',
    conversationText: 'User: Honestly, stop sugarcoating everything. Just give it to me straight from now on.',
    assert: (diff) =>
      diff.profile?.coachingStyle
        ? { pass: true, reason: 'coachingStyle set' }
        : { pass: false, reason: `no coachingStyle: ${JSON.stringify(diff)}` },
  },
  {
    name: 'small talk does not invent goals',
    conversationText: 'User: haha yeah fair enough. Anyway, nice weather today.',
    assert: (diff) => {
      const goals = diff.areas.flatMap((a) => a.addGoals ?? []);
      return goals.length === 0
        ? { pass: true, reason: 'no goals invented' }
        : { pass: false, reason: `invented goals: ${JSON.stringify(goals)}` };
    },
  },
];

async function main() {
  let passed = 0;
  for (const s of scenarios) {
    try {
      const diff = await extractLifeModelDiff(
        s.conversationText,
        JSON.stringify(s.lifeModel ?? emptyLifeModel()),
      );
      const result = s.assert(diff);
      console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${s.name} — ${result.reason}`);
      if (result.pass) passed++;
    } catch (error) {
      console.log(`FAIL  ${s.name} — threw: ${error}`);
    }
  }
  console.log(`\n${passed}/${scenarios.length} extraction evals passed`);
  process.exit(passed === scenarios.length ? 0 : 1);
}

main();
