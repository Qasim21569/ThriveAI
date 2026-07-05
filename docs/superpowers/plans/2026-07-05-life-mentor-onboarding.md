# Life Mentor Plan 3: Onboarding + Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the onboarding interview that seeds the Life Model on first sign-up, collapse the app to its mentor-centric shape (nav, landing, entry routes), and distill fitness/mental assessment outputs into the brain.

**Architecture:** The interview is a scripted conversational stepper — five static area questions, each with one adaptive follow-up from a new one-shot route (`/api/coach/followup`) — ending in a single seeding extraction through the existing `runExtraction`, then a playback screen rendered from the returned model. No new state systems: the brain remains the single source of truth. Landing/nav cleanup deletes the four-domain entry points; assessments hook into the extraction pipeline at their existing `savePlan` call sites.

**Tech Stack:** Next.js 14, Firebase client SDK, Groq, zod, vitest (all existing — no new dependencies).

**Spec:** `docs/superpowers/specs/2026-07-03-life-mentor-design.md` (section 3 surface 1, section 5; build-order phases 5-6)

## Global Constraints

- No new dependencies.
- All Firestore writes client-side; API routes auth-gated via `getAuthedUid` with zod-validated bodies in `lib/validation/api.ts`.
- Groq: standard URL/model/key pattern (see existing services).
- Life areas fixed: `career`, `health`, `mental`, `financial`, `social`.
- Graceful degradation: a failed follow-up call just skips the follow-up; a failed seeding extraction still lets the user proceed (mentor learns as they go). Onboarding is always skippable.
- Mobile-first for the new screen.
- Nav collapses to **Today · Coach · Brain** (spec's "Chat" = the existing `/coach`); Dashboard/Progress move into the avatar + mobile menus so no page is orphaned. Sign-in lands on `/today`; sign-up lands on `/onboarding`.
- Windows dev machine: `npx vitest run`, `npx tsx`, quote `(app)` paths in git commands.

---

### Task 1: Follow-up question route

**Files:**
- Create: `app/api/coach/followup/service.ts`
- Create: `app/api/coach/followup/route.ts`
- Modify: `lib/validation/api.ts` (add `followupRequestSchema`)

**Interfaces:**
- Consumes: `getAuthedUid`, validation patterns, `LIFE_AREAS` from `@/lib/lifemodel/types`
- Produces: `POST /api/coach/followup` — body `{ area: LifeAreaId, question: string, answer: string }`, response `{ followup: string | null }` (null = the answer is sufficient, move on). 401/400/500 per pattern. Service export `getFollowupQuestion(area, question, answer): Promise<string | null>`.

- [ ] **Step 1: Add the request schema**

In `lib/validation/api.ts`, add the import `import { LIFE_AREAS } from '@/lib/lifemodel/types';` at the top, then append:

```ts
// Sent by the onboarding interview to /api/coach/followup
export const followupRequestSchema = z
  .object({
    area: z.enum(LIFE_AREAS),
    question: nonEmpty.max(500),
    answer: nonEmpty.max(4000),
  })
  .passthrough();

export type FollowupRequest = z.infer<typeof followupRequestSchema>;
```

- [ ] **Step 2: Write the service**

Create `app/api/coach/followup/service.ts`:

```ts
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * One-shot follow-up generator for the onboarding interview. Returns a
 * single short question when the answer leaves an obvious gap, or null
 * when the answer already covers the essentials — the caller then moves
 * to the next life area. Kept tool-free and tiny: one question maximum
 * per area keeps the interview under ~5 minutes.
 */
export async function getFollowupQuestion(
  area: string,
  question: string,
  answer: string,
): Promise<string | null> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const system =
    'You are a life mentor conducting a brief onboarding interview, currently on the ' +
    `"${area}" area of the user's life. You asked a question and got an answer. If the ` +
    'answer already covers the essentials (their current situation plus at least one goal ' +
    'or concern), reply with exactly the single word DONE. Otherwise reply with exactly ' +
    'one short, warm follow-up question (one sentence, no preamble) that fills the ' +
    'biggest gap. Never ask more than one question. Never comment on the answer.';

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Question asked: ${question}\n\nUser's answer: ${answer}` },
      ],
      temperature: 0.4,
      max_tokens: 80,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Groq followup error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text: string | undefined = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq returned an empty follow-up');

  return text.toUpperCase() === 'DONE' || text.toUpperCase().startsWith('DONE') ? null : text;
}
```

- [ ] **Step 3: Write the route**

Create `app/api/coach/followup/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { followupRequestSchema } from '@/lib/validation/api';
import { getFollowupQuestion } from './service';

export async function POST(request: NextRequest) {
  const uid = await getAuthedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = followupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const followup = await getFollowupQuestion(
      parsed.data.area,
      parsed.data.question,
      parsed.data.answer,
    );
    return NextResponse.json({ followup });
  } catch (error) {
    console.error('Followup error:', error);
    return NextResponse.json({ error: 'Failed to generate follow-up' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; 35 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/coach/followup lib/validation/api.ts
git commit -m "feat: onboarding follow-up question route"
```

---

### Task 2: Interview script + transcript helper

**Files:**
- Create: `lib/onboarding/interview.ts`
- Test: `tests/onboarding/interview.test.ts`

**Interfaces:**
- Consumes: `LifeAreaId`, `LIFE_AREAS` from `@/lib/lifemodel/types`
- Produces:
  - `INTERVIEW_QUESTIONS: { area: LifeAreaId; question: string }[]` — the five scripted openers, in LIFE_AREAS order
  - `InterviewEntry = { area: LifeAreaId; question: string; answer: string }`
  - `buildInterviewTranscript(entries: InterviewEntry[]): string` — pure; formats the interview for the seeding extraction, prefixed so the extractor knows this is a self-description, filtering out empty answers.

- [ ] **Step 1: Write failing tests**

Create `tests/onboarding/interview.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LIFE_AREAS } from '@/lib/lifemodel/types';
import { INTERVIEW_QUESTIONS, buildInterviewTranscript } from '@/lib/onboarding/interview';

describe('INTERVIEW_QUESTIONS', () => {
  it('covers all five areas in LIFE_AREAS order', () => {
    expect(INTERVIEW_QUESTIONS.map((q) => q.area)).toEqual([...LIFE_AREAS]);
    for (const q of INTERVIEW_QUESTIONS) expect(q.question.length).toBeGreaterThan(10);
  });
});

describe('buildInterviewTranscript', () => {
  it('formats entries with area labels and skips empty answers', () => {
    const t = buildInterviewTranscript([
      { area: 'career', question: 'Work?', answer: 'Final-year CS student, job hunting.' },
      { area: 'health', question: 'Health?', answer: '   ' },
    ]);
    expect(t).toContain('onboarding interview');
    expect(t).toContain('[career] Q: Work?');
    expect(t).toContain('A: Final-year CS student, job hunting.');
    expect(t).not.toContain('[health]');
  });

  it('returns empty string when no non-empty answers exist', () => {
    expect(buildInterviewTranscript([{ area: 'career', question: 'Q', answer: '' }])).toBe('');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/onboarding/interview.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `lib/onboarding/interview.ts`:

```ts
import type { LifeAreaId } from '@/lib/lifemodel/types';

export interface InterviewEntry {
  area: LifeAreaId;
  question: string;
  answer: string;
}

export const INTERVIEW_QUESTIONS: { area: LifeAreaId; question: string }[] = [
  {
    area: 'career',
    question:
      "Let's start with work. What's your current situation — job, studies — and what are you aiming for right now?",
  },
  {
    area: 'health',
    question:
      "How's your physical health — energy, exercise, sleep? Anything you're actively working on?",
  },
  {
    area: 'mental',
    question:
      'How have you been doing mentally lately? Stress, mood, anything weighing on you?',
  },
  {
    area: 'financial',
    question:
      "What's your money situation like, and what would you want it to look like?",
  },
  {
    area: 'social',
    question:
      'And your social life — relationships, friends, family. What matters most there right now?',
  },
];

/**
 * Format the interview for the seeding extraction. The preamble tells the
 * extractor this is a first-person self-description, so it should populate
 * profile identity and area statuses/goals rather than treating it as a
 * day's events.
 */
export function buildInterviewTranscript(entries: InterviewEntry[]): string {
  const answered = entries.filter((e) => e.answer.trim() !== '');
  if (answered.length === 0) return '';
  const lines = answered.map((e) => `[${e.area}] Q: ${e.question}\nA: ${e.answer.trim()}`);
  return (
    'This is the user\'s onboarding interview — a first-person description of their life. ' +
    'Build their profile (identity, personality) and per-area statuses, goals, and open ' +
    'threads from it.\n\n' +
    lines.join('\n\n')
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/onboarding/interview.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/interview.ts tests/onboarding/interview.test.ts
git commit -m "feat: onboarding interview script and transcript builder"
```

---

### Task 3: Onboarding page

**Files:**
- Create: `app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `INTERVIEW_QUESTIONS`, `buildInterviewTranscript`, `InterviewEntry` from `@/lib/onboarding/interview`; `POST /api/coach/followup`; `runExtraction` from `@/lib/coach/extraction-client`; `getLifeModel` from `@/lib/firebase/lifeModel`; `emptyLifeModel`, `LIFE_AREAS` from `@/lib/lifemodel/types`; `AuthModal`, UI primitives.
- Produces: the `/onboarding` route (outside the `(app)` group — no app nav; it's a focused full-screen flow). Chat-style stepper: mentor bubble asks the area question → user answers in a textarea → one follow-up round via the route (failure = skip follow-up) → next area. After the fifth area: seeding phase (`runExtraction` over the transcript against the user's existing model or `emptyLifeModel()`), then playback (per-area status lines + identity from the returned model) with "Looks right — let's go" → `/today` and "Fix something" → `/brain`. "Skip for now" (top-right, always visible) → `/today`. Extraction failure shows a friendly fallback and still routes to `/today`.

- [ ] **Step 1: Implement the page**

Create `app/onboarding/page.tsx`:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, ArrowRight, Pencil } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import type { User } from 'firebase/auth';
import { INTERVIEW_QUESTIONS, buildInterviewTranscript, type InterviewEntry } from '@/lib/onboarding/interview';
import { runExtraction } from '@/lib/coach/extraction-client';
import { getLifeModel } from '@/lib/firebase/lifeModel';
import { emptyLifeModel, LIFE_AREAS, type LifeModel } from '@/lib/lifemodel/types';
import AuthModal from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Bubble {
  id: string;
  role: 'mentor' | 'user';
  text: string;
}

type Phase = 'interview' | 'seeding' | 'playback' | 'fallback';

const AREA_LABEL: Record<string, string> = {
  career: 'Career',
  health: 'Health',
  mental: 'Mental',
  financial: 'Financial',
  social: 'Social',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [phase, setPhase] = useState<Phase>('interview');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [entries, setEntries] = useState<InterviewEntry[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [pendingFollowup, setPendingFollowup] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [seededModel, setSeededModel] = useState<LifeModel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        setShowAuthModal(true);
        return;
      }
      setUser(u);
      setBubbles([
        { id: 'intro', role: 'mentor', text: "Hi — I'm your mentor. Five quick questions so I actually know you, then we're done. Nothing is shared; you can correct anything later." },
        { id: 'q0', role: 'mentor', text: INTERVIEW_QUESTIONS[0].question },
      ]);
    });
    return unsub;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles, phase]);

  const askNext = (nextIndex: number) => {
    if (nextIndex < INTERVIEW_QUESTIONS.length) {
      setQuestionIndex(nextIndex);
      setBubbles((prev) => [
        ...prev,
        { id: `q${nextIndex}`, role: 'mentor', text: INTERVIEW_QUESTIONS[nextIndex].question },
      ]);
    } else {
      void finishInterview();
    }
  };

  const finishInterview = async () => {
    setPhase('seeding');
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      // setEntries updates may not have flushed — read from a ref-free source:
      // finishInterview is only called from handleAnswer AFTER entries state
      // is updated via the updater form, so read latest via setEntries hack.
      let latest: InterviewEntry[] = [];
      setEntries((prev) => { latest = prev; return prev; });
      const transcript = buildInterviewTranscript(latest);
      if (!transcript) {
        setPhase('fallback');
        return;
      }
      const base = (await getLifeModel(user.uid).catch(() => null)) ?? emptyLifeModel();
      const outcome = await runExtraction(user.uid, idToken, base, transcript);
      if (outcome) {
        setSeededModel(outcome.model);
        setPhase('playback');
      } else {
        setPhase('fallback');
      }
    } catch (error) {
      console.error('Onboarding seeding failed:', error);
      setPhase('fallback');
    }
  };

  const handleAnswer = async () => {
    const text = input.trim();
    if (!text || busy || !user) return;
    setBusy(true);
    setInput('');
    const current = INTERVIEW_QUESTIONS[questionIndex];
    const questionText = pendingFollowup ?? current.question;
    setBubbles((prev) => [...prev, { id: `a-${Date.now()}`, role: 'user', text }]);
    setEntries((prev) => [...prev, { area: current.area, question: questionText, answer: text }]);

    try {
      if (pendingFollowup) {
        // Follow-up answered — move on unconditionally (max one follow-up per area).
        setPendingFollowup(null);
        askNext(questionIndex + 1);
      } else {
        let followup: string | null = null;
        try {
          const idToken = await user.getIdToken();
          const res = await fetch('/api/coach/followup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ area: current.area, question: current.question, answer: text }),
          });
          if (res.ok) followup = (await res.json()).followup;
        } catch (error) {
          console.error('Follow-up fetch failed (skipping):', error);
        }
        if (followup) {
          setPendingFollowup(followup);
          setBubbles((prev) => [...prev, { id: `f-${Date.now()}`, role: 'mentor', text: followup as string }]);
        } else {
          askNext(questionIndex + 1);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnswer();
    }
  };

  const progress = Math.min(questionIndex, INTERVIEW_QUESTIONS.length);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthModal open={showAuthModal} onClose={() => router.push('/')} onSuccess={() => setShowAuthModal(false)} />

      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-serif text-base font-semibold text-foreground">Meet your mentor</p>
          {phase === 'interview' && (
            <p className="text-xs text-text-muted">{progress} of {INTERVIEW_QUESTIONS.length} areas</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/today')}>
          Skip for now
        </Button>
      </header>

      {phase === 'interview' && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-xl flex-col gap-3">
              {bubbles.map((b) => (
                <div key={b.id} className={`flex ${b.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={[
                      'max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed',
                      b.role === 'user'
                        ? 'rounded-br-xs bg-primary text-primary-foreground'
                        : 'rounded-bl-xs border border-border bg-surface-sunken text-text-body',
                    ].join(' ')}
                  >
                    {b.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border px-4 py-3.5">
            <div className="mx-auto flex max-w-xl items-end gap-2.5">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Answer in your own words…"
                className="min-h-[44px] resize-none"
                rows={1}
                disabled={busy || !user}
              />
              <Button onClick={handleAnswer} variant="primary" size="icon" disabled={busy || !input.trim()} aria-label="Send answer">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {phase === 'seeding' && (
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <Sparkles className="mx-auto mb-4 size-8 animate-pulse text-accent" />
            <p className="font-serif text-lg font-semibold text-foreground">Building your picture…</p>
            <p className="mt-1 text-sm text-text-muted">Turning what you shared into your mentor&apos;s memory.</p>
          </div>
        </div>
      )}

      {phase === 'playback' && seededModel && (
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-1 font-serif text-2xl font-semibold text-foreground">Here&apos;s my picture of you</h2>
            <p className="mb-6 text-sm text-text-muted">Correct anything — your edits always win.</p>
            {seededModel.profile.identity && (
              <p className="mb-5 rounded-lg border border-border bg-surface-sunken px-4 py-3 text-sm text-text-body">
                {seededModel.profile.identity}
              </p>
            )}
            <div className="mb-8 space-y-3">
              {LIFE_AREAS.filter((a) => seededModel.areas[a].status).map((a) => (
                <div key={a} className="rounded-lg border border-border bg-surface px-4 py-3">
                  <p className="mb-0.5 font-mono text-xs uppercase tracking-[0.08em] text-accent">{AREA_LABEL[a]}</p>
                  <p className="text-sm text-text-body">{seededModel.areas[a].status}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" className="flex-1" onClick={() => router.push('/today')}>
                Looks right — let&apos;s go <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push('/brain')}>
                <Pencil className="size-4" /> Fix something
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === 'fallback' && (
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="mb-2 font-serif text-lg font-semibold text-foreground">I&apos;ll learn as we go</p>
            <p className="mb-6 text-sm text-text-muted">
              I couldn&apos;t finish building your picture just now, but everything you shared is safe —
              I&apos;ll pick it up from our conversations.
            </p>
            <Button variant="primary" onClick={() => router.push('/today')}>
              Start your first check-in <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Note on the `setEntries((prev) => { latest = prev; return prev; })` read: `finishInterview` may run in the same tick as the final `setEntries`. If the implementer prefers, an equivalent and cleaner structure is to thread the final entries array through `askNext`/`finishInterview` as a parameter — either is acceptable; do not read the stale `entries` variable directly.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; 38 tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "feat: onboarding interview seeding the Life Model with playback"
```

---

### Task 4: Entry routing — sign-up to onboarding, sign-in to Today, dashboard CTA

**Files:**
- Modify: `app/auth/sign-up/page.tsx` (both `router.push('/dashboard')` → `/onboarding`)
- Modify: `app/auth/sign-in/page.tsx` (both `router.push('/dashboard')` → `/today`)
- Modify: `app/(app)/dashboard/page.tsx` (add "Meet your mentor" CTA when no Life Model)

**Interfaces:**
- Consumes: `getLifeModel` from `@/lib/firebase/lifeModel`
- Produces: new users land in the interview; returning users land on Today; the dashboard nudges anyone without a brain toward `/onboarding`.

- [ ] **Step 1: Update auth redirects**

In `app/auth/sign-up/page.tsx`, replace both `router.push('/dashboard')` occurrences (lines ~31, ~81) with `router.push('/onboarding')`.
In `app/auth/sign-in/page.tsx`, replace both `router.push('/dashboard')` occurrences (lines ~26, ~40) with `router.push('/today')`.

- [ ] **Step 2: Dashboard CTA**

In `app/(app)/dashboard/page.tsx`:
1. Add import: `import { getLifeModel } from '@/lib/firebase/lifeModel';` and add `Sparkles` to the lucide-react imports.
2. Add state: `const [hasBrain, setHasBrain] = useState(true);` (default true — never flash the CTA for users who have one).
3. In the load effect's `Promise.all`, add a third element `getLifeModel(user.uid)` and set `setHasBrain(model !== null)` from its result (name the destructured variable `model`).
4. Directly under the `<h1>Welcome back…</h1>` block's closing `</div>`, insert:

```tsx
        {!hasBrain && (
          <Card className="mb-6 border-accent/40 bg-primary-soft/40">
            <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 flex-shrink-0 text-accent" />
                <p className="text-sm text-text-body">
                  Your mentor doesn&apos;t know you yet — a five-minute intro changes everything.
                </p>
              </div>
              <Button asChild variant="primary">
                <Link href="/onboarding">Meet your mentor</Link>
              </Button>
            </CardContent>
          </Card>
        )}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean; 38 tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/auth/sign-up/page.tsx app/auth/sign-in/page.tsx "app/(app)/dashboard/page.tsx"
git commit -m "feat: route sign-up to onboarding, sign-in to Today, dashboard brain CTA"
```

---

### Task 5: Nav collapse + landing cleanup

**Files:**
- Modify: `components/app/app-nav.tsx` (NAV_LINKS → Today · Coach · Brain; Dashboard + Progress into avatar dropdown and mobile menu)
- Modify: `app/page.tsx` (drop ModeCards)
- Delete: `components/landing/mode-cards.tsx`, `app/career/page.tsx`, `app/finance/page.tsx`, `app/goals/page.tsx`
- Modify: `components/landing/hero-section.tsx` (signed-in CTA → `/today`)
- Modify: `app/fitness/page.tsx`, `app/mental/page.tsx` (placeholder → redirect to their forms)

**Interfaces:**
- Consumes: existing nav/menu structures
- Produces: the app's final Plan-3 shape. `/career`, `/finance`, `/goals` are gone; `/fitness` and `/mental` redirect to `/fitness/form` and `/mental/form`.

- [ ] **Step 1: Collapse the nav**

In `components/app/app-nav.tsx`:

```ts
const NAV_LINKS = [
  { label: 'Today', href: '/today' },
  { label: 'Coach', href: '/coach' },
  { label: 'Brain', href: '/brain' },
];
```

In the avatar dropdown (desktop), above the existing Profile link, add two entries following the exact same Link pattern: `Dashboard` → `/dashboard` (icon `LayoutDashboard`) and `Progress` → `/progress` (icon `TrendingUp`); add both icons to the lucide-react import. In the mobile menu's bottom section, add the same two links above Profile (no icons there, matching the existing plain style). Update the logo link href from `/dashboard` to `/today`.

- [ ] **Step 2: Landing cleanup**

1. `app/page.tsx`: remove the `ModeCards` import and `<ModeCards />` usage.
2. Delete files: `git rm components/landing/mode-cards.tsx app/career/page.tsx app/finance/page.tsx app/goals/page.tsx`
3. `components/landing/hero-section.tsx`: change the signed-in CTA `href="/dashboard"` to `href="/today"`. If the hero links `/#modes` anywhere, change to `/#features`.
4. Grep for orphans: `grep -rn "mode-cards\|/#modes\|href=\"/career\"\|href=\"/finance\"\|href=\"/goals\"" app components --include="*.tsx"` — fix every hit (features/cta/footer sections may reference them; retarget domain-specific copy links to `/#features` or remove the link).

- [ ] **Step 3: Assessment stubs become redirects**

Replace the full contents of `app/fitness/page.tsx` with:

```tsx
import { redirect } from 'next/navigation';

export default function FitnessPage() {
  redirect('/fitness/form');
}
```

And `app/mental/page.tsx` with the same pattern redirecting to `/mental/form`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: all clean — the build catches any orphaned import of the deleted files.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: collapse nav to mentor shape, remove four-domain landing and stub pages"
```

---

### Task 6: Assessment distillation into the brain

**Files:**
- Modify: `components/modes/fitness/form/FitnessForm.tsx` (post-`savePlan` extraction)
- Modify: `components/modes/mental/form/MentalWellbeingForm.tsx` (post-`savePlan` extraction)
- Modify: `components/brain/area-card.tsx` (optional `action` prop)
- Modify: `app/(app)/brain/page.tsx` (deep-dive links on health/mental cards)

**Interfaces:**
- Consumes: `runExtraction`, `getLifeModel`, `emptyLifeModel`, `summarizePlanForPrompt` from `@/lib/coach/context`
- Produces: completing an assessment updates the relevant brain area (fire-and-forget); `AreaCard` accepts `action?: { label: string; href: string }` rendered as a small link in the card header; Brain page passes `action` for health (`/fitness/form`, "Fitness assessment →") and mental (`/mental/form`, "Wellbeing check →").

- [ ] **Step 1: Distill the fitness plan**

In `components/modes/fitness/form/FitnessForm.tsx`, add imports:

```ts
import { runExtraction } from '@/lib/coach/extraction-client';
import { getLifeModel } from '@/lib/firebase/lifeModel';
import { emptyLifeModel } from '@/lib/lifemodel/types';
import { summarizePlanForPrompt } from '@/lib/coach/context';
```

Immediately after `const planId = await savePlan(user.uid, 'fitness', 'Fitness Plan', planData.plan);` add:

```ts
        // Distill the new plan into the brain's health area (fire-and-forget —
        // plan save already succeeded; a failed distillation self-heals on the
        // next extraction).
        void (async () => {
          try {
            const idToken = await user.getIdToken();
            const model = (await getLifeModel(user.uid)) ?? emptyLifeModel();
            const text =
              'The user just completed a fitness assessment and generated a new fitness plan. ' +
              `Plan summary: ${summarizePlanForPrompt('fitness', planData.plan)}`;
            await runExtraction(user.uid, idToken, model, text);
          } catch (error) {
            console.error('Fitness plan distillation failed:', error);
          }
        })();
```

- [ ] **Step 2: Distill the mental assessment**

In `components/modes/mental/form/MentalWellbeingForm.tsx`, add the same four imports, and immediately after `const planId = await savePlan(user.uid, 'mental', 'Mental Wellbeing Assessment', data.assessment);` add:

```ts
        // Distill the assessment into the brain's mental area (fire-and-forget).
        void (async () => {
          try {
            const idToken = await user.getIdToken();
            const model = (await getLifeModel(user.uid)) ?? emptyLifeModel();
            const text =
              'The user just completed a mental wellbeing assessment. Key findings (JSON): ' +
              JSON.stringify(data.assessment).slice(0, 3000);
            await runExtraction(user.uid, idToken, model, text);
          } catch (error) {
            console.error('Mental assessment distillation failed:', error);
          }
        })();
```

- [ ] **Step 3: AreaCard `action` prop**

In `components/brain/area-card.tsx`:
1. Add `import Link from 'next/link';`
2. Extend the props: `action?: { label: string; href: string };` (add to the destructured signature).
3. In the CardHeader, inside the left-hand `div` that holds the title and badge, append after the Badge:

```tsx
            {action && (
              <Link href={action.href} className="text-xs text-accent hover:underline">
                {action.label}
              </Link>
            )}
```

- [ ] **Step 4: Brain page passes actions**

In `app/(app)/brain/page.tsx`, replace the AreaCard mapping with:

```tsx
              {LIFE_AREAS.map((areaId) => (
                <AreaCard
                  key={areaId}
                  areaId={areaId}
                  area={model.areas[areaId]}
                  onSave={saveArea(areaId)}
                  action={
                    areaId === 'health'
                      ? { label: 'Fitness assessment →', href: '/fitness/form' }
                      : areaId === 'mental'
                        ? { label: 'Wellbeing check →', href: '/mental/form' }
                        : undefined
                  }
                />
              ))}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add components/modes/fitness/form/FitnessForm.tsx components/modes/mental/form/MentalWellbeingForm.tsx components/brain/area-card.tsx "app/(app)/brain/page.tsx"
git commit -m "feat: distill assessments into the brain, deep-dive links on area cards"
```

---

## Manual verification pass (after all tasks)

Dev server, mobile viewport:
1. Fresh account → sign-up lands on `/onboarding`; answer the five areas (one follow-up each max); playback shows your statuses; "Fix something" opens `/brain` with the seeded model.
2. "Skip for now" works at every stage.
3. Sign-in (existing account) lands on `/today`; nav shows only Today · Coach · Brain; Dashboard/Progress reachable from the avatar menu.
4. `/career`, `/finance`, `/goals` → 404; `/fitness` → form; landing has no four-domain cards.
5. Complete a fitness assessment → within seconds the health area status/threads update on `/brain`.

## Out of scope (Plan 4)

- Motion system, walkthrough, library consolidation (MUI/GSAP removal), celebration animations.
