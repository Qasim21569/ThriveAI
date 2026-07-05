# Life Mentor Plan 2: Daily Surfaces — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the daily check-in ritual (Today page with adaptive prompts, streak, mentor reaction) and the Brain page (view + edit the Life Model), wired into the dashboard and nav.

**Architecture:** All new UI runs on the Plan 1 brain: `buildMentorContext` loads the model, `runExtraction` updates it after a check-in, `saveLifeModel` persists Brain-page edits. Adaptive prompts and streaks are pure, template-based functions (no extra LLM calls — deterministic and unit-testable). The mentor's post-check-in reaction is a new one-shot Groq route (`/api/coach/react`, no tools) so it can't double-log check-ins.

**Tech Stack:** Next.js 14, Firebase client SDK, Groq, zod, vitest (all existing — no new dependencies).

**Spec:** `docs/superpowers/specs/2026-07-03-life-mentor-design.md` (section 3 surfaces 2 & 4; build-order phases 3-4)

## Global Constraints

- No new dependencies (runtime or dev).
- All Firestore writes client-side with the client SDK; API routes never touch Firestore.
- API routes auth-gated via `getAuthedUid(request)`, bodies validated with zod schemas in `lib/validation/api.ts`.
- Groq calls: `https://api.groq.com/openai/v1/chat/completions`, model `process.env.GROQ_MODEL` defaulting to `llama-3.3-70b-versatile`, key `GROQ_API_KEY`.
- Life areas fixed: `career`, `health`, `mental`, `financial`, `social`.
- Graceful degradation: extraction or reaction failure never loses the raw check-in or blocks the UI.
- Mobile-first: every new screen designed for phone width first (single column, thumb-reach buttons, no hover-only affordances).
- UI follows existing patterns: Card/Button/Badge/Skeleton from `components/ui`, auth via `auth.onAuthStateChanged` + `AuthModal`, page shell provided by `app/(app)/layout.tsx`.
- Windows dev machine: `npx vitest run`, `npx tsx`, quote paths containing `(app)`.

---

### Task 1: Deferred-minors cleanup from Plan 1's final review

**Files:**
- Modify: `app/api/coach/extract/service.ts` (export + extend `stripEmptyOptionals`)
- Modify: `lib/coach/context.ts` (stale comment; seeding log message)
- Modify: `app/(app)/coach/page.tsx` (fresh idToken inside extraction chain)
- Modify: `evals/extraction-evals.ts` (scenario name)
- Test: `tests/lifemodel/sanitize.test.ts` (new)

**Interfaces:**
- Consumes: existing `stripEmptyOptionals` (currently module-private in the extract service)
- Produces: `stripEmptyOptionals` exported from `app/api/coach/extract/service.ts`; no signature changes elsewhere.

- [ ] **Step 1: Write failing tests for array-element sanitization**

Create `tests/lifemodel/sanitize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { stripEmptyOptionals } from '@/app/api/coach/extract/service';

describe('stripEmptyOptionals', () => {
  it('drops empty-string status/summary on areas', () => {
    const out = stripEmptyOptionals({
      areas: [{ area: 'career', status: '', summary: '  ' }],
    }) as { areas: Record<string, unknown>[] };
    expect(out.areas[0]).not.toHaveProperty('status');
    expect(out.areas[0]).not.toHaveProperty('summary');
  });

  it('filters empty strings out of addThreads and empty-text goals out of addGoals', () => {
    const out = stripEmptyOptionals({
      areas: [
        {
          area: 'career',
          addThreads: ['real thread', '', '  '],
          addGoals: [{ text: 'real goal', targetDate: null }, { text: '', targetDate: null }],
        },
      ],
    }) as { areas: { addThreads: string[]; addGoals: { text: string }[] }[] };
    expect(out.areas[0].addThreads).toEqual(['real thread']);
    expect(out.areas[0].addGoals).toEqual([{ text: 'real goal', targetDate: null }]);
  });

  it('filters events with empty content and drops an all-empty profile', () => {
    const out = stripEmptyOptionals({
      events: [{ area: 'career', type: 'fact', content: '' }],
      profile: { identity: '', personality: ' ' },
    }) as Record<string, unknown>;
    expect(out.events).toEqual([]);
    expect(out).not.toHaveProperty('profile');
  });

  it('passes through non-object input unchanged', () => {
    expect(stripEmptyOptionals(null)).toBe(null);
    expect(stripEmptyOptionals('x')).toBe('x');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lifemodel/sanitize.test.ts`
Expected: FAIL — `stripEmptyOptionals` is not exported

- [ ] **Step 3: Export and extend `stripEmptyOptionals`**

In `app/api/coach/extract/service.ts`, change `function stripEmptyOptionals` to `export function stripEmptyOptionals`, and inside the `if (Array.isArray(diff.areas))` loop add array cleaning after the existing status/summary handling:

```ts
      if (Array.isArray(area.addThreads)) {
        area.addThreads = (area.addThreads as unknown[]).filter(
          (t) => typeof t === 'string' && t.trim() !== '',
        );
      }
      if (Array.isArray(area.addGoals)) {
        area.addGoals = (area.addGoals as Record<string, unknown>[]).filter(
          (g) => typeof g?.text === 'string' && (g.text as string).trim() !== '',
        );
      }
```

- [ ] **Step 4: Apply the three small fixes**

1. `lib/coach/context.ts` — in the `MENTOR_BUDGET` comment, change `same approximation as BUDGET above` to `~4 chars/token approximation`.
2. `lib/coach/context.ts` — in `buildMentorContext`'s catch around model load/seed, change the log message to distinguish phases: wrap the seed call in its own try/catch that logs `'Failed to seed Life Model from history:'` (still falling through to the null-model path).
3. `app/(app)/coach/page.tsx` — inside the extraction chain closure, fetch a fresh token instead of reusing the turn-start one: replace `runExtraction(user.uid, idToken, ...)` with:

```ts
          const freshToken = await user.getIdToken();
          const outcome = await runExtraction(user.uid, freshToken, lifeModelRef.current, turnText);
```

4. `evals/extraction-evals.ts` — rename scenario `'cross-domain check-in touches both areas'` to `'cross-domain check-in touches health or mental'`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; all tests (25+) pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/coach/extract/service.ts lib/coach/context.ts "app/(app)/coach/page.tsx" evals/extraction-evals.ts tests/lifemodel/sanitize.test.ts
git commit -m "fix: address deferred Plan 1 review minors (sanitizer arrays, fresh idToken, comments)"
```

---

### Task 2: Streak logic + 'daily' check-in type

**Files:**
- Create: `lib/checkins/streak.ts`
- Modify: `lib/firebase/checkins.ts` (extend `CheckinType` with `'daily'`)
- Modify: `app/(app)/dashboard/page.tsx` and `app/(app)/progress/page.tsx` (TYPE_ICON maps gain a `daily` entry — grep for `TYPE_ICON` / `Record<CheckinType` to find them)
- Test: `tests/checkins/streak.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `computeStreak(checkinDates: string[], today: string): number` — `checkinDates` are ISO timestamps (any time of day), `today` is a `YYYY-MM-DD` string. Counts consecutive calendar days with ≥1 check-in ending at `today`, with a grace rule: if `today` has no check-in yet, the streak counts back from yesterday (an unfinished day doesn't break the streak). `CheckinType` now includes `'daily'`.

- [ ] **Step 1: Write failing tests**

Create `tests/checkins/streak.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeStreak } from '@/lib/checkins/streak';

const T = '2026-07-05';

describe('computeStreak', () => {
  it('returns 0 with no check-ins', () => {
    expect(computeStreak([], T)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(
      computeStreak(
        ['2026-07-05T08:00:00Z', '2026-07-04T21:00:00Z', '2026-07-03T10:00:00Z'],
        T,
      ),
    ).toBe(3);
  });

  it('applies the grace rule when today has no check-in yet', () => {
    expect(computeStreak(['2026-07-04T21:00:00Z', '2026-07-03T10:00:00Z'], T)).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(computeStreak(['2026-07-05T08:00:00Z', '2026-07-03T10:00:00Z'], T)).toBe(1);
  });

  it('returns 0 when the last check-in was before yesterday', () => {
    expect(computeStreak(['2026-07-02T08:00:00Z'], T)).toBe(0);
  });

  it('counts a day once regardless of multiple check-ins', () => {
    expect(computeStreak(['2026-07-05T08:00:00Z', '2026-07-05T20:00:00Z'], T)).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/checkins/streak.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `lib/checkins/streak.ts`:

```ts
/**
 * Consecutive-day check-in streak. Grace rule: a day in progress (today,
 * no check-in yet) doesn't break the streak — it just doesn't count yet.
 * Dates are compared as UTC calendar days for determinism.
 */
export function computeStreak(checkinDates: string[], today: string): number {
  const days = new Set(checkinDates.map((d) => d.slice(0, 10)));
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
```

- [ ] **Step 4: Extend the check-in type**

In `lib/firebase/checkins.ts` change:

```ts
export type CheckinType = 'workout' | 'mood' | 'note' | 'daily';
```

Then run `npx tsc --noEmit` — every `Record<CheckinType, ...>` map now fails to compile; fix each (dashboard and progress pages) by adding a `daily` entry using the `CalendarCheck` icon from `lucide-react` (import it alongside the existing icon imports).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; streak tests 6/6, all others green.

- [ ] **Step 6: Commit**

```bash
git add lib/checkins/streak.ts lib/firebase/checkins.ts "app/(app)/dashboard/page.tsx" "app/(app)/progress/page.tsx" tests/checkins/streak.test.ts
git commit -m "feat: check-in streak logic and 'daily' check-in type"
```

---

### Task 3: Adaptive daily prompts

**Files:**
- Create: `lib/checkins/prompts.ts`
- Test: `tests/checkins/prompts.test.ts`

**Interfaces:**
- Consumes: `LifeModel`, `LIFE_AREAS` from `@/lib/lifemodel/types`
- Produces: `buildDailyPrompts(model: LifeModel | null): string[]` — pure, deterministic, 1-3 prompts: up to two generated from open threads (falling back to active goals), always ending with one generic prompt. No LLM call — templates over the Life Model are free, instant, and testable; revisit only if template prompts feel stale in practice.

- [ ] **Step 1: Write failing tests**

Create `tests/checkins/prompts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { emptyLifeModel } from '@/lib/lifemodel/types';
import { buildDailyPrompts } from '@/lib/checkins/prompts';

describe('buildDailyPrompts', () => {
  it('returns only the generic prompt for a null or empty model', () => {
    expect(buildDailyPrompts(null)).toEqual([
      'How was your day — energy, mood, anything notable?',
    ]);
    expect(buildDailyPrompts(emptyLifeModel())).toHaveLength(1);
  });

  it('generates prompts from open threads first', () => {
    const model = emptyLifeModel();
    model.areas.career.threads.push({ id: 't1', text: 'interviewing at TCS', status: 'open' });
    model.areas.health.threads.push({ id: 't2', text: 'fixing sleep schedule', status: 'closed' });
    const prompts = buildDailyPrompts(model);
    expect(prompts[0]).toContain('interviewing at TCS');
    expect(prompts.join(' ')).not.toContain('fixing sleep schedule'); // closed threads excluded
    expect(prompts[prompts.length - 1]).toContain('How was your day');
  });

  it('falls back to active goals when fewer than two open threads', () => {
    const model = emptyLifeModel();
    model.areas.financial.goals.push({ id: 'g1', text: 'Save 50k', targetDate: null, status: 'active' });
    const prompts = buildDailyPrompts(model);
    expect(prompts[0]).toContain('Save 50k');
  });

  it('caps at three prompts', () => {
    const model = emptyLifeModel();
    for (let i = 0; i < 5; i++) {
      model.areas.career.threads.push({ id: `t${i}`, text: `thread ${i}`, status: 'open' });
    }
    expect(buildDailyPrompts(model)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/checkins/prompts.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `lib/checkins/prompts.ts`:

```ts
import { LIFE_AREAS, type LifeModel } from '@/lib/lifemodel/types';

const GENERIC_PROMPT = 'How was your day — energy, mood, anything notable?';

/**
 * Template-based adaptive prompts from the Life Model's open loops.
 * Deterministic and free — no LLM call. Up to two specific prompts
 * (open threads first, then active goals), always ending generic.
 */
export function buildDailyPrompts(model: LifeModel | null): string[] {
  const specific: string[] = [];
  if (model) {
    const openThreads = LIFE_AREAS.flatMap((a) =>
      model.areas[a].threads.filter((t) => t.status === 'open'),
    );
    for (const t of openThreads.slice(0, 2)) {
      specific.push(`Any progress on “${t.text}”?`);
    }
    if (specific.length < 2) {
      const activeGoals = LIFE_AREAS.flatMap((a) =>
        model.areas[a].goals.filter((g) => g.status === 'active'),
      );
      for (const g of activeGoals.slice(0, 2 - specific.length)) {
        specific.push(`Did you move toward “${g.text}” today?`);
      }
    }
  }
  return [...specific, GENERIC_PROMPT].slice(0, 3);
}
```

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/checkins/prompts.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/checkins/prompts.ts tests/checkins/prompts.test.ts
git commit -m "feat: adaptive daily prompts from Life Model open loops"
```

---

### Task 4: Mentor reaction route

**Files:**
- Create: `app/api/coach/react/service.ts`
- Create: `app/api/coach/react/route.ts`
- Modify: `lib/validation/api.ts` (add `reactRequestSchema`)

**Interfaces:**
- Consumes: `getAuthedUid` from `@/lib/auth/verifyAuth`; validation pattern from `lib/validation/api.ts`
- Produces: `POST /api/coach/react` — body `{ checkinText: string, contextBlock?: string }`, response `{ reaction: string }` (200), 401/400/500 per the standard pattern. One-shot, non-streamed, NO tools — a short (2-3 sentence) mentor reaction to a daily check-in. Separate from `/api/coach/chat` so a reaction can never trigger `log_checkin` (the check-in is already saved by the page).

- [ ] **Step 1: Add the request schema**

In `lib/validation/api.ts`, append:

```ts
// Sent by the Today page to /api/coach/react after a daily check-in is saved
export const reactRequestSchema = z
  .object({
    checkinText: nonEmpty.max(4000),
    contextBlock: z.string().max(12_000).optional(),
  })
  .passthrough();

export type ReactRequest = z.infer<typeof reactRequestSchema>;
```

- [ ] **Step 2: Write the service**

Create `app/api/coach/react/service.ts`:

```ts
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * One-shot mentor reaction to a daily check-in. Deliberately tool-free and
 * short: the check-in is already persisted by the client, and the ritual's
 * promise is "under two minutes" — a reaction, not a conversation.
 */
export async function reactToCheckin(checkinText: string, contextBlock?: string): Promise<string> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const system =
    'You are the ThriveAI mentor reacting to the user\'s daily check-in. Reply in 2-3 ' +
    'sentences: acknowledge specifically what they shared, connect it to their goals or ' +
    'open threads when context is provided, and end with one encouraging or gently ' +
    'accountable note. No questions, no lists, no advice dumps.' +
    (contextBlock ? `\n\nContext about this user:\n\n${contextBlock}` : '');

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Today's check-in:\n${checkinText}` },
      ],
      temperature: 0.6,
      max_tokens: 160,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Groq react error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const reaction = data.choices?.[0]?.message?.content?.trim();
  if (!reaction) throw new Error('Groq returned an empty reaction');
  return reaction;
}
```

- [ ] **Step 3: Write the route**

Create `app/api/coach/react/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { reactRequestSchema } from '@/lib/validation/api';
import { reactToCheckin } from './service';

export async function POST(request: NextRequest) {
  const uid = await getAuthedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const reaction = await reactToCheckin(parsed.data.checkinText, parsed.data.contextBlock);
    return NextResponse.json({ reaction });
  } catch (error) {
    console.error('React error:', error);
    return NextResponse.json({ error: 'Failed to react' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/coach/react lib/validation/api.ts
git commit -m "feat: tool-free mentor reaction route for daily check-ins"
```

---

### Task 5: Today page (daily check-in flow)

**Files:**
- Create: `app/(app)/today/page.tsx`

**Interfaces:**
- Consumes: `buildMentorContext` from `@/lib/coach/context`; `runExtraction` from `@/lib/coach/extraction-client`; `buildDailyPrompts` from `@/lib/checkins/prompts`; `computeStreak` from `@/lib/checkins/streak`; `saveCheckin`, `getRecentCheckins` from `@/lib/firebase/checkins`; `POST /api/coach/react`; UI primitives + `AuthModal` per existing pages.
- Produces: the `/today` route. Flow: load context + last 60 check-ins → show streak + adaptive prompts + one textarea → submit saves check-in (type `'daily'`) FIRST, then fire extraction and reaction in parallel → show reaction (or a static fallback line if the reaction call fails) → "logged for today" state with links to Chat/Brain. Submit is disabled while saving; the save must succeed even if both AI calls fail.

- [ ] **Step 1: Implement the page**

Create `app/(app)/today/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Send, CheckCircle2, MessageCircle, Brain } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { saveCheckin, getRecentCheckins } from '@/lib/firebase/checkins';
import { buildMentorContext } from '@/lib/coach/context';
import { runExtraction } from '@/lib/coach/extraction-client';
import { buildDailyPrompts } from '@/lib/checkins/prompts';
import { computeStreak } from '@/lib/checkins/streak';
import type { LifeModel } from '@/lib/lifemodel/types';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const FALLBACK_REACTION = 'Logged. Showing up daily is the whole game — see you tomorrow.';

export default function TodayPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [model, setModel] = useState<LifeModel | null>(null);
  const [contextBlock, setContextBlock] = useState('');
  const [entry, setEntry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const idToken = await u.getIdToken();
        const [ctx, checkins] = await Promise.all([
          buildMentorContext(u.uid, idToken),
          getRecentCheckins(u.uid, 60),
        ]);
        setModel(ctx.model);
        setContextBlock(ctx.contextBlock);
        setPrompts(buildDailyPrompts(ctx.model));
        const today = new Date().toISOString().slice(0, 10);
        setStreak(computeStreak(checkins.map((c) => c.createdAt), today));
        setLoggedToday(checkins.some((c) => c.type === 'daily' && c.createdAt.slice(0, 10) === today));
      } catch (error) {
        console.error('Error loading today page:', error);
        setPrompts(buildDailyPrompts(null));
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const handleSubmit = async () => {
    const text = entry.trim();
    if (!text || submitting || !user) return;
    setSubmitting(true);
    try {
      // The raw log is truth: persist first, AI afterwards.
      await saveCheckin(user.uid, 'daily', text.slice(0, 1500));
      setLoggedToday(true);
      setStreak((s) => (s === 0 ? 1 : s + (loggedToday ? 0 : 1)));

      const idToken = await user.getIdToken();
      const checkinText = `Daily check-in.\nPrompts shown: ${prompts.join(' | ')}\nAnswer: ${text}`;
      const [reactionResult] = await Promise.allSettled([
        fetch('/api/coach/react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ checkinText: text, contextBlock: contextBlock || undefined }),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`React failed: ${res.status}`);
          return (await res.json()).reaction as string;
        }),
        model ? runExtraction(user.uid, idToken, model, checkinText) : Promise.resolve(null),
      ]);
      setReaction(reactionResult.status === 'fulfilled' ? reactionResult.value : FALLBACK_REACTION);
    } catch (error) {
      console.error('Check-in submit error:', error);
      setReaction(FALLBACK_REACTION);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-6 h-9 w-48" />
        <Skeleton className="mb-3 h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Today</span>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">Daily check-in</h1>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5"
            aria-label={`${streak} day streak`}
          >
            <Flame className="size-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">{streak}</span>
          </div>
        </div>

        {reaction ? (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2 text-success">
                <CheckCircle2 className="size-5" />
                <span className="text-sm font-medium">Logged for today</span>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-text-body">{reaction}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/coach"><MessageCircle className="size-4" /> Talk it through</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/brain"><Brain className="size-4" /> See your brain</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 space-y-2">
              {prompts.map((p) => (
                <p key={p} className="rounded-lg border border-border bg-surface-sunken px-4 py-2.5 text-sm text-text-body">
                  {p}
                </p>
              ))}
            </div>
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Write it however it comes out — a sentence is enough."
              className="min-h-[140px]"
              disabled={submitting}
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              variant="primary"
              className="mt-3 w-full"
              disabled={submitting || !entry.trim()}
            >
              {submitting ? 'Logging…' : (<><Send className="size-4" /> Log today</>)}
            </Button>
            {loggedToday && (
              <p className="mt-3 text-center text-xs text-text-muted">
                Already logged today — this adds to it.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; all tests pass.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/today/page.tsx"
git commit -m "feat: Today page — daily check-in with adaptive prompts, streak, mentor reaction"
```

---

### Task 6: Brain page components (profile + area cards)

**Files:**
- Create: `components/brain/profile-card.tsx`
- Create: `components/brain/area-card.tsx`

**Interfaces:**
- Consumes: `LifeModel`, `AreaState`, `LifeAreaId`, `Profile`, `Goal`, `Thread` from `@/lib/lifemodel/types`; UI primitives.
- Produces:
  - `ProfileCard({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => Promise<void> })`
  - `AreaCard({ areaId, area, onSave }: { areaId: LifeAreaId; area: AreaState; onSave: (a: AreaState) => Promise<void> })`
  Both are controlled-edit cards: view mode by default, Edit toggles editable fields, Save calls `onSave` (parent persists via `saveLifeModel`) and returns to view mode; goal/thread status toggles call `onSave` immediately. Ids for new goals/threads are generated with `crypto.randomUUID()`.

- [ ] **Step 1: Implement `ProfileCard`**

Create `components/brain/profile-card.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { Profile } from '@/lib/lifemodel/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const FIELDS: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: 'identity', label: 'Who you are', placeholder: 'Not captured yet — the mentor learns this as you talk.' },
  { key: 'personality', label: 'Personality', placeholder: 'Not captured yet.' },
  { key: 'coachingStyle', label: 'How you like to be coached', placeholder: 'Not captured yet — tell the mentor how to talk to you.' },
];

export function ProfileCard({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setDraft(profile); setEditing(true); };
  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
          {editing ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="primary" onClick={save} disabled={saving} aria-label="Save profile">
                <Check className="size-4" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit} aria-label="Edit profile">
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">{label}</p>
            {editing ? (
              <Textarea
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                rows={2}
                disabled={saving}
              />
            ) : (
              <p className="text-sm text-text-body">{profile[key] || <span className="text-text-muted">{placeholder}</span>}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Implement `AreaCard`**

Create `components/brain/area-card.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Pencil, Check, X, Plus, CircleCheck, CircleDot } from 'lucide-react';
import type { AreaState, LifeAreaId } from '@/lib/lifemodel/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const AREA_LABEL: Record<LifeAreaId, string> = {
  career: 'Career',
  health: 'Health',
  mental: 'Mental',
  financial: 'Financial',
  social: 'Social',
};

export function AreaCard({
  areaId,
  area,
  onSave,
}: {
  areaId: LifeAreaId;
  area: AreaState;
  onSave: (a: AreaState) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draftStatus, setDraftStatus] = useState(area.status);
  const [draftSummary, setDraftSummary] = useState(area.summary);
  const [newThread, setNewThread] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const persist = async (next: AreaState) => {
    setSaving(true);
    try {
      await onSave(next);
    } catch (error) {
      console.error(`Failed to save ${areaId} area:`, error);
    } finally {
      setSaving(false);
    }
  };

  const saveText = async () => {
    await persist({ ...area, status: draftStatus.trim(), summary: draftSummary.trim() });
    setEditing(false);
  };

  const toggleGoal = (id: string) =>
    persist({
      ...area,
      goals: area.goals.map((g) => (g.id === id ? { ...g, status: g.status === 'active' ? 'done' : 'active' } : g)),
    });

  const toggleThread = (id: string) =>
    persist({
      ...area,
      threads: area.threads.map((t) => (t.id === id ? { ...t, status: t.status === 'open' ? 'closed' : 'open' } : t)),
    });

  const addThread = () => {
    const text = newThread.trim();
    if (!text) return;
    setNewThread('');
    persist({ ...area, threads: [...area.threads, { id: crypto.randomUUID(), text, status: 'open' }] });
  };

  const addGoal = () => {
    const text = newGoal.trim();
    if (!text) return;
    setNewGoal('');
    persist({ ...area, goals: [...area.goals, { id: crypto.randomUUID(), text, targetDate: null, status: 'active' }] });
  };

  const activeGoals = area.goals.filter((g) => g.status !== 'dropped');
  const openThreads = area.threads.filter((t) => t.status === 'open');
  const isEmpty = !area.status && !area.summary && activeGoals.length === 0 && area.threads.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{AREA_LABEL[areaId]}</CardTitle>
            {openThreads.length > 0 && <Badge tone="primary">{openThreads.length} open</Badge>}
          </div>
          {editing ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="primary" onClick={saveText} disabled={saving} aria-label={`Save ${areaId}`}>
                <Check className="size-4" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setDraftStatus(area.status); setDraftSummary(area.summary); setEditing(true); }}
              aria-label={`Edit ${areaId}`}
            >
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmpty && !editing ? (
          <p className="text-sm text-text-muted">Nothing here yet — mention this part of your life to the mentor.</p>
        ) : (
          <>
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">Right now</p>
              {editing ? (
                <Textarea value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} rows={2} disabled={saving} />
              ) : (
                <p className="text-sm text-text-body">{area.status || <span className="text-text-muted">—</span>}</p>
              )}
            </div>

            {(editing || area.summary) && (
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">History</p>
                {editing ? (
                  <Textarea value={draftSummary} onChange={(e) => setDraftSummary(e.target.value)} rows={2} disabled={saving} />
                ) : (
                  <p className="text-sm text-text-body">{area.summary}</p>
                )}
              </div>
            )}

            {activeGoals.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">Goals</p>
                <div className="space-y-1.5">
                  {activeGoals.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      disabled={saving}
                      className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-left text-sm transition-colors hover:border-accent"
                      aria-label={`Toggle goal: ${g.text}`}
                    >
                      {g.status === 'done'
                        ? <CircleCheck className="size-4 flex-shrink-0 text-success" />
                        : <CircleDot className="size-4 flex-shrink-0 text-text-muted" />}
                      <span className={g.status === 'done' ? 'text-text-muted line-through' : 'text-text-body'}>
                        {g.text}{g.targetDate ? ` · by ${g.targetDate}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {area.threads.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">Open loops</p>
                <div className="space-y-1.5">
                  {area.threads.filter((t) => editing || t.status === 'open').map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleThread(t.id)}
                      disabled={saving}
                      className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-left text-sm transition-colors hover:border-accent"
                      aria-label={`Toggle thread: ${t.text}`}
                    >
                      {t.status === 'closed'
                        ? <CircleCheck className="size-4 flex-shrink-0 text-success" />
                        : <CircleDot className="size-4 flex-shrink-0 text-accent" />}
                      <span className={t.status === 'closed' ? 'text-text-muted line-through' : 'text-text-body'}>{t.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {editing && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex gap-2">
              <input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a goal…"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                disabled={saving}
              />
              <Button size="sm" variant="outline" onClick={addGoal} disabled={saving || !newGoal.trim()} aria-label="Add goal">
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                value={newThread}
                onChange={(e) => setNewThread(e.target.value)}
                placeholder="Add an open loop…"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                disabled={saving}
              />
              <Button size="sm" variant="outline" onClick={addThread} disabled={saving || !newThread.trim()} aria-label="Add thread">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: clean (components not yet mounted anywhere — that's Task 7).

- [ ] **Step 4: Commit**

```bash
git add components/brain
git commit -m "feat: Brain page profile and area cards with inline editing"
```

---

### Task 7: Brain page assembly + events timeline

**Files:**
- Create: `app/(app)/brain/page.tsx`

**Interfaces:**
- Consumes: `getLifeModel`, `saveLifeModel`, `getRecentEvents` from `@/lib/firebase/lifeModel`; `ProfileCard`, `AreaCard` from `@/components/brain/*`; `LIFE_AREAS`, types.
- Produces: the `/brain` route. Loads model + last 30 events; renders ProfileCard, five AreaCards, and a read-only events timeline grouped by date. Each card's `onSave` merges the edit into the in-memory model, persists the WHOLE model via `saveLifeModel`, and updates page state (optimistic-with-await: UI state updates after the await succeeds). Empty state when no model exists yet, pointing to `/today` and `/coach`.

- [ ] **Step 1: Implement the page**

Create `app/(app)/brain/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain as BrainIcon } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { getLifeModel, saveLifeModel, getRecentEvents } from '@/lib/firebase/lifeModel';
import { LIFE_AREAS, type LifeModel, type LifeEvent, type Profile, type AreaState, type LifeAreaId } from '@/lib/lifemodel/types';
import { ProfileCard } from '@/components/brain/profile-card';
import { AreaCard } from '@/components/brain/area-card';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function groupEventsByDate(events: LifeEvent[]): [string, LifeEvent[]][] {
  const groups = new Map<string, LifeEvent[]>();
  for (const e of events) {
    const day = e.date.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  }
  return [...groups.entries()];
}

export default function BrainPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<LifeModel | null>(null);
  const [events, setEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const [m, evts] = await Promise.all([getLifeModel(u.uid), getRecentEvents(u.uid, 30)]);
        setModel(m);
        setEvents(evts);
      } catch (error) {
        console.error('Error loading brain page:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const saveProfile = async (profile: Profile) => {
    if (!user || !model) return;
    const next = { ...model, profile };
    await saveLifeModel(user.uid, next);
    setModel(next);
  };

  const saveArea = (areaId: LifeAreaId) => async (area: AreaState) => {
    if (!user || !model) return;
    const next = { ...model, areas: { ...model.areas, [areaId]: area } };
    await saveLifeModel(user.uid, next);
    setModel(next);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-app px-4 py-10">
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="mb-8 h-9 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <div className="mx-auto max-w-app">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">Brain</span>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground md:text-4xl">
            What your mentor knows
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Everything here was learned from your conversations and check-ins. Correct anything — your edits win.
          </p>
        </div>

        {!model ? (
          <Card>
            <CardContent className="px-6 py-12 text-center">
              <BrainIcon className="mx-auto mb-4 size-10 text-text-muted" />
              <p className="mb-2 font-serif text-lg font-semibold text-foreground">Nothing learned yet</p>
              <p className="mb-6 text-sm text-text-muted">
                The brain builds itself from your daily check-ins and chats.
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild variant="primary"><Link href="/today">Do today&apos;s check-in</Link></Button>
                <Button asChild variant="outline"><Link href="/coach">Talk to your mentor</Link></Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <ProfileCard profile={model.profile} onSave={saveProfile} />

            <div className="grid gap-4 md:grid-cols-2">
              {LIFE_AREAS.map((areaId) => (
                <AreaCard key={areaId} areaId={areaId} area={model.areas[areaId]} onSave={saveArea(areaId)} />
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-text-muted">No events recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {groupEventsByDate(events).map(([day, dayEvents]) => (
                      <div key={day}>
                        <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
                          {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                        </p>
                        <div className="space-y-1.5">
                          {dayEvents.map((e) => (
                            <div key={e.id} className="flex items-start gap-2.5 rounded-md border border-border bg-surface-sunken px-3 py-2">
                              <span className="mt-0.5 rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] uppercase text-primary">
                                {e.area}
                              </span>
                              <p className="min-w-0 flex-1 text-sm text-text-body">{e.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; all tests pass.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/brain/page.tsx"
git commit -m "feat: Brain page — render and edit the Life Model with events timeline"
```

---

### Task 8: Nav + dashboard integration

**Files:**
- Modify: `components/app/app-nav.tsx` (NAV_LINKS)
- Modify: `app/(app)/dashboard/page.tsx` (check-in CTA card with streak)

**Interfaces:**
- Consumes: `computeStreak` from `@/lib/checkins/streak`; existing dashboard data loads.
- Produces: nav order becomes Dashboard · Today · Coach · Brain · Progress (full nav collapse to the spec's 4 items happens in Plan 3 alongside landing cleanup). Dashboard gains a "Today's check-in" card showing the streak and linking `/today`.

- [ ] **Step 1: Update NAV_LINKS**

In `components/app/app-nav.tsx`:

```ts
const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Today', href: '/today' },
  { label: 'Coach', href: '/coach' },
  { label: 'Brain', href: '/brain' },
  { label: 'Progress', href: '/progress' },
];
```

- [ ] **Step 2: Add the check-in card to the dashboard**

In `app/(app)/dashboard/page.tsx`:

1. Add imports: `import { computeStreak } from '@/lib/checkins/streak';` and add `Flame` to the lucide-react import list.
2. Bump the check-ins fetch from `getRecentCheckins(user.uid, 3)` to `getRecentCheckins(user.uid, 60)` and keep only the first 3 for the recent-activity list (`checkins.slice(0, 3)` where `recentCheckins` is set); add streak state:

```ts
  const [streak, setStreak] = useState(0);
```

and after the fetch:

```ts
        setRecentCheckins(checkins.slice(0, 3));
        setStreak(computeStreak(checkins.map((c) => c.createdAt), new Date().toISOString().slice(0, 10)));
```

3. Change the coach CTA card's grid cell into a stack of two cards — replace the entire `{/* Coach CTA card */}` `<Card>…</Card>` block with:

```tsx
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="size-5 text-accent" />
                    <CardTitle>Today&apos;s check-in</CardTitle>
                  </div>
                  <Badge tone="primary">{streak} day{streak === 1 ? '' : 's'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-text-body">
                  Two minutes. Your mentor remembers all of it.
                </p>
                <Button asChild variant="primary" className="w-full">
                  <Link href="/today">Check in</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-5 text-accent" />
                  <CardTitle>Ask your mentor</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-text-body">
                  Advice, decisions, or just a check-in — it knows your whole picture.
                </p>
                <Button asChild variant="accent" className="w-full">
                  <Link href="/coach">Open chat</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add components/app/app-nav.tsx "app/(app)/dashboard/page.tsx"
git commit -m "feat: Today and Brain in nav, check-in streak card on dashboard"
```

---

## Manual verification pass (after all tasks)

On the dev server, mobile viewport:
1. `/today` — prompts reference your open threads; submit a check-in; reaction appears; streak increments; Firestore shows a `daily` check-in + new events.
2. `/brain` — model renders; edit an area status; reload — the edit persisted; toggle a goal done; timeline shows dated events.
3. `/dashboard` — streak card correct; Today/Brain nav links work on mobile menu.
4. `/coach` — regression: chat still streams and updates the brain.

## Out of scope (later plans)

- Onboarding interview, nav collapse to 4 items, landing rework, assessment distillation → Plan 3
- Motion system, walkthrough, library consolidation → Plan 4
