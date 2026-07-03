# Life Mentor Plan 1: The Brain — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fitness-only memory (plan summary + check-in rolling summary) with a structured Life Model — profile, 5 life areas, event timeline — written by an extraction pipeline and read by a rewritten context pipeline, so the mentor chat knows the user's whole life.

**Architecture:** The Life Model lives in Firestore as human-readable docs (`users/{uid}/lifeModel/{profile|career|health|mental|financial|social}` plus `users/{uid}/events`). A dedicated Groq extraction call turns conversation text into a validated structured diff; a pure `applyDiff` function applies it; the client orchestrates all Firestore writes (no Admin SDK — consistent with the existing app). Context assembly is a pure function over the model + recent events, wrapped by an IO loader that lazily seeds the model from existing check-ins/plans on first use.

**Tech Stack:** Next.js 14 (existing), Firebase client SDK (existing), Groq chat completions with `response_format: json_object` (existing pattern), zod (existing), vitest (new, dev-only).

**Spec:** `docs/superpowers/specs/2026-07-03-life-mentor-design.md` (sections 1, 2, 6, 7; phases 1-2 of the build order)

## Global Constraints

- No new runtime dependencies. Vitest is the only new devDependency.
- No LangChain, no vector DB, no RAG, no fine-tuning (spec non-goals).
- All Firestore writes happen client-side with the client SDK (existing architecture — API routes never touch Firestore).
- API routes are auth-gated via `getAuthedUid(request)` and validate request bodies with zod schemas in `lib/validation/api.ts` (existing pattern).
- Groq calls: `https://api.groq.com/openai/v1/chat/completions`, model from `process.env.GROQ_MODEL` defaulting to `llama-3.3-70b-versatile`, key from `process.env.GROQ_API_KEY` (existing pattern).
- Life areas are exactly: `career`, `health`, `mental`, `financial`, `social` (spec: fixed, no custom areas).
- Graceful degradation everywhere: extraction failure must never lose data or block chat (spec section 6).
- Windows dev machine: use `npx vitest run` / `npx tsx`, not bash-isms.

---

### Task 1: Life Model types + vitest harness

**Files:**
- Create: `lib/lifemodel/types.ts`
- Create: `vitest.config.ts`
- Create: `tests/lifemodel/types.test.ts`
- Modify: `package.json` (add vitest devDependency + test script)

**Interfaces:**
- Consumes: nothing (foundation task)
- Produces: `LIFE_AREAS: readonly ['career','health','mental','financial','social']`, `LifeAreaId`, `EventType`, `Goal`, `Thread`, `AreaState`, `Profile`, `LifeEvent`, `LifeModel`, `emptyLifeModel(): LifeModel` — every later task imports from `@/lib/lifemodel/types`.

- [ ] **Step 1: Install vitest and add the test script**

```bash
npm install -D vitest
```

Then in `package.json` add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Create vitest config with the `@/` path alias**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Write the failing test**

Create `tests/lifemodel/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LIFE_AREAS, emptyLifeModel } from '@/lib/lifemodel/types';

describe('emptyLifeModel', () => {
  it('has an empty profile and all five areas', () => {
    const model = emptyLifeModel();
    expect(model.profile).toEqual({ identity: '', personality: '', coachingStyle: '' });
    expect(Object.keys(model.areas).sort()).toEqual([...LIFE_AREAS].sort());
    for (const area of LIFE_AREAS) {
      expect(model.areas[area]).toEqual({ status: '', summary: '', goals: [], threads: [] });
    }
  });

  it('returns independent copies (no shared references)', () => {
    const a = emptyLifeModel();
    const b = emptyLifeModel();
    a.areas.career.goals.push({ id: 'x', text: 'test', targetDate: null, status: 'active' });
    expect(b.areas.career.goals).toEqual([]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/lifemodel/types.test.ts`
Expected: FAIL — cannot resolve `@/lib/lifemodel/types`

- [ ] **Step 5: Write the types module**

Create `lib/lifemodel/types.ts`:

```ts
export const LIFE_AREAS = ['career', 'health', 'mental', 'financial', 'social'] as const;
export type LifeAreaId = (typeof LIFE_AREAS)[number];

export const EVENT_TYPES = ['milestone', 'setback', 'activity', 'decision', 'feeling', 'fact'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface Goal {
  id: string;
  text: string;
  targetDate: string | null; // ISO date or null
  status: 'active' | 'done' | 'dropped';
}

export interface Thread {
  id: string;
  text: string; // open loop, e.g. "interviewing at TCS"
  status: 'open' | 'closed';
}

export interface AreaState {
  status: string; // 2-3 sentence current situation
  summary: string; // rolling narrative of this area's history
  goals: Goal[];
  threads: Thread[];
}

export interface Profile {
  identity: string; // who the user is
  personality: string;
  coachingStyle: string; // how this user likes to be coached
}

export interface LifeEvent {
  id: string;
  date: string; // ISO timestamp
  area: LifeAreaId;
  type: EventType;
  content: string;
}

export interface LifeModel {
  profile: Profile;
  areas: Record<LifeAreaId, AreaState>;
}

export function emptyLifeModel(): LifeModel {
  const areas = {} as Record<LifeAreaId, AreaState>;
  for (const area of LIFE_AREAS) {
    areas[area] = { status: '', summary: '', goals: [], threads: [] };
  }
  return {
    profile: { identity: '', personality: '', coachingStyle: '' },
    areas,
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/lifemodel/types.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add lib/lifemodel/types.ts vitest.config.ts tests/lifemodel/types.test.ts package.json package-lock.json
git commit -m "feat: Life Model types + vitest harness"
```

---

### Task 2: Extraction diff schema

**Files:**
- Create: `lib/lifemodel/extraction.ts`
- Test: `tests/lifemodel/extraction.test.ts`

**Interfaces:**
- Consumes: `LIFE_AREAS`, `EVENT_TYPES` from `@/lib/lifemodel/types`
- Produces: `extractionDiffSchema` (zod) and `ExtractionDiff` type. Shape:
  ```ts
  {
    events: { area: LifeAreaId; type: EventType; content: string }[];
    areas: {
      area: LifeAreaId;
      status?: string;
      summary?: string;
      addGoals?: { text: string; targetDate: string | null }[];
      closeGoalIds?: string[];
      addThreads?: string[];
      closeThreadIds?: string[];
    }[];
    profile?: { identity?: string; personality?: string; coachingStyle?: string };
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/lifemodel/extraction.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { extractionDiffSchema } from '@/lib/lifemodel/extraction';

describe('extractionDiffSchema', () => {
  it('parses a full valid diff', () => {
    const result = extractionDiffSchema.safeParse({
      events: [{ area: 'career', type: 'milestone', content: 'Got an interview at TCS' }],
      areas: [
        {
          area: 'career',
          status: 'Actively job hunting, one interview scheduled.',
          addThreads: ['interviewing at TCS'],
          addGoals: [{ text: 'Land a frontend job', targetDate: '2026-09-01' }],
        },
      ],
      profile: { coachingStyle: 'Prefers direct, no-fluff feedback' },
    });
    expect(result.success).toBe(true);
  });

  it('defaults events and areas to empty arrays when the model returns {}', () => {
    const result = extractionDiffSchema.parse({});
    expect(result.events).toEqual([]);
    expect(result.areas).toEqual([]);
  });

  it('rejects unknown area names', () => {
    const result = extractionDiffSchema.safeParse({
      events: [{ area: 'hobbies', type: 'fact', content: 'x' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects event content over 300 chars', () => {
    const result = extractionDiffSchema.safeParse({
      events: [{ area: 'career', type: 'fact', content: 'x'.repeat(301) }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts goals with null targetDate', () => {
    const result = extractionDiffSchema.safeParse({
      areas: [{ area: 'financial', addGoals: [{ text: 'Save 50k', targetDate: null }] }],
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lifemodel/extraction.test.ts`
Expected: FAIL — cannot resolve `@/lib/lifemodel/extraction`

- [ ] **Step 3: Write the schema module**

Create `lib/lifemodel/extraction.ts`:

```ts
import { z } from 'zod';
import { LIFE_AREAS, EVENT_TYPES } from './types';

const areaEnum = z.enum(LIFE_AREAS);
const shortText = z.string().trim().min(1);

/**
 * The structured diff the extraction model returns. Every field is
 * bounded (array caps, char caps) because this is the boundary where
 * untrusted model output enters our system — same philosophy as
 * logCheckinArgsSchema in lib/coach/tools.ts.
 */
export const extractionDiffSchema = z.object({
  events: z
    .array(
      z.object({
        area: areaEnum,
        type: z.enum(EVENT_TYPES),
        content: shortText.max(300),
      }),
    )
    .max(10)
    .default([]),
  areas: z
    .array(
      z.object({
        area: areaEnum,
        status: shortText.max(400).optional(),
        summary: shortText.max(600).optional(),
        addGoals: z
          .array(z.object({ text: shortText.max(200), targetDate: z.string().nullable() }))
          .max(5)
          .optional(),
        closeGoalIds: z.array(z.string()).max(10).optional(),
        addThreads: z.array(shortText.max(200)).max(5).optional(),
        closeThreadIds: z.array(z.string()).max(10).optional(),
      }),
    )
    .max(5)
    .default([]),
  profile: z
    .object({
      identity: shortText.max(600).optional(),
      personality: shortText.max(400).optional(),
      coachingStyle: shortText.max(400).optional(),
    })
    .optional(),
});

export type ExtractionDiff = z.infer<typeof extractionDiffSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lifemodel/extraction.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/lifemodel/extraction.ts tests/lifemodel/extraction.test.ts
git commit -m "feat: extraction diff schema with bounded fields"
```

---

### Task 3: applyDiff — pure diff application

**Files:**
- Create: `lib/lifemodel/apply.ts`
- Test: `tests/lifemodel/apply.test.ts`

**Interfaces:**
- Consumes: `LifeModel`, `LifeEvent`, `emptyLifeModel` from `@/lib/lifemodel/types`; `ExtractionDiff` from `@/lib/lifemodel/extraction`
- Produces: `applyDiff(model: LifeModel, diff: ExtractionDiff, now: string, makeId?: () => string): ApplyResult` where `ApplyResult = { model: LifeModel; newEvents: LifeEvent[] }`. Pure — never mutates its input. `makeId` defaults to `crypto.randomUUID` and is injectable for deterministic tests.

- [ ] **Step 1: Write the failing tests**

Create `tests/lifemodel/apply.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { emptyLifeModel } from '@/lib/lifemodel/types';
import { applyDiff } from '@/lib/lifemodel/apply';
import type { ExtractionDiff } from '@/lib/lifemodel/extraction';

const NOW = '2026-07-03T12:00:00.000Z';
let counter = 0;
const makeId = () => `id-${++counter}`;

function diff(partial: Partial<ExtractionDiff>): ExtractionDiff {
  return { events: [], areas: [], ...partial };
}

describe('applyDiff', () => {
  it('does not mutate the input model', () => {
    const model = emptyLifeModel();
    applyDiff(model, diff({ areas: [{ area: 'career', status: 'Job hunting' }] }), NOW, makeId);
    expect(model.areas.career.status).toBe('');
  });

  it('updates area status and summary', () => {
    const { model } = applyDiff(
      emptyLifeModel(),
      diff({ areas: [{ area: 'career', status: 'Job hunting', summary: 'Started search in June' }] }),
      NOW,
      makeId,
    );
    expect(model.areas.career.status).toBe('Job hunting');
    expect(model.areas.career.summary).toBe('Started search in June');
    expect(model.areas.health.status).toBe(''); // untouched areas stay empty
  });

  it('adds goals as active with generated ids', () => {
    const { model } = applyDiff(
      emptyLifeModel(),
      diff({ areas: [{ area: 'financial', addGoals: [{ text: 'Save 50k', targetDate: null }] }] }),
      NOW,
      makeId,
    );
    const goal = model.areas.financial.goals[0];
    expect(goal.text).toBe('Save 50k');
    expect(goal.status).toBe('active');
    expect(goal.id).toMatch(/^id-/);
  });

  it('closes goals and threads by id, ignoring unknown ids', () => {
    const base = emptyLifeModel();
    base.areas.career.goals.push({ id: 'g1', text: 'Get job', targetDate: null, status: 'active' });
    base.areas.career.threads.push({ id: 't1', text: 'interviewing at TCS', status: 'open' });
    const { model } = applyDiff(
      base,
      diff({ areas: [{ area: 'career', closeGoalIds: ['g1', 'nope'], closeThreadIds: ['t1'] }] }),
      NOW,
      makeId,
    );
    expect(model.areas.career.goals[0].status).toBe('done');
    expect(model.areas.career.threads[0].status).toBe('closed');
  });

  it('adds threads as open', () => {
    const { model } = applyDiff(
      emptyLifeModel(),
      diff({ areas: [{ area: 'social', addThreads: ['reconnecting with college friends'] }] }),
      NOW,
      makeId,
    );
    expect(model.areas.social.threads[0]).toMatchObject({
      text: 'reconnecting with college friends',
      status: 'open',
    });
  });

  it('overwrites only the profile fields present in the diff', () => {
    const base = emptyLifeModel();
    base.profile.identity = 'CS student in Mumbai';
    const { model } = applyDiff(
      base,
      diff({ profile: { coachingStyle: 'Direct, no fluff' } }),
      NOW,
      makeId,
    );
    expect(model.profile.identity).toBe('CS student in Mumbai');
    expect(model.profile.coachingStyle).toBe('Direct, no fluff');
  });

  it('turns diff events into LifeEvents with id and date', () => {
    const { newEvents } = applyDiff(
      emptyLifeModel(),
      diff({ events: [{ area: 'career', type: 'milestone', content: 'Interview at TCS' }] }),
      NOW,
      makeId,
    );
    expect(newEvents).toHaveLength(1);
    expect(newEvents[0]).toMatchObject({ area: 'career', type: 'milestone', content: 'Interview at TCS', date: NOW });
    expect(newEvents[0].id).toMatch(/^id-/);
  });

  it('empty diff is a no-op', () => {
    const base = emptyLifeModel();
    const { model, newEvents } = applyDiff(base, diff({}), NOW, makeId);
    expect(model).toEqual(base);
    expect(newEvents).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lifemodel/apply.test.ts`
Expected: FAIL — cannot resolve `@/lib/lifemodel/apply`

- [ ] **Step 3: Write the implementation**

Create `lib/lifemodel/apply.ts`:

```ts
import type { LifeModel, LifeEvent } from './types';
import type { ExtractionDiff } from './extraction';

export interface ApplyResult {
  model: LifeModel;
  newEvents: LifeEvent[];
}

/**
 * Apply an extraction diff to a Life Model. Pure: returns a new model,
 * never mutates the input. Firestore persistence is the caller's job —
 * keeping this pure is what makes the extraction pipeline unit-testable
 * without any Firebase or network dependency.
 */
export function applyDiff(
  model: LifeModel,
  diff: ExtractionDiff,
  now: string,
  makeId: () => string = () => crypto.randomUUID(),
): ApplyResult {
  const next: LifeModel = structuredClone(model);

  if (diff.profile) {
    if (diff.profile.identity) next.profile.identity = diff.profile.identity;
    if (diff.profile.personality) next.profile.personality = diff.profile.personality;
    if (diff.profile.coachingStyle) next.profile.coachingStyle = diff.profile.coachingStyle;
  }

  for (const update of diff.areas) {
    const area = next.areas[update.area];
    if (update.status) area.status = update.status;
    if (update.summary) area.summary = update.summary;
    for (const g of update.addGoals ?? []) {
      area.goals.push({ id: makeId(), text: g.text, targetDate: g.targetDate, status: 'active' });
    }
    if (update.closeGoalIds?.length) {
      for (const goal of area.goals) {
        if (update.closeGoalIds.includes(goal.id)) goal.status = 'done';
      }
    }
    for (const t of update.addThreads ?? []) {
      area.threads.push({ id: makeId(), text: t, status: 'open' });
    }
    if (update.closeThreadIds?.length) {
      for (const thread of area.threads) {
        if (update.closeThreadIds.includes(thread.id)) thread.status = 'closed';
      }
    }
  }

  const newEvents: LifeEvent[] = diff.events.map((e) => ({
    id: makeId(),
    date: now,
    area: e.area,
    type: e.type,
    content: e.content,
  }));

  return { model: next, newEvents };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lifemodel/apply.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/lifemodel/apply.ts tests/lifemodel/apply.test.ts
git commit -m "feat: pure applyDiff for Life Model updates"
```

---

### Task 4: Firestore accessors for the Life Model

**Files:**
- Create: `lib/firebase/lifeModel.ts`

**Interfaces:**
- Consumes: `db` from `./firebaseConfig`; types from `@/lib/lifemodel/types`
- Produces:
  - `getLifeModel(uid: string): Promise<LifeModel | null>` — null when no profile doc exists (model never seeded)
  - `saveLifeModel(uid: string, model: LifeModel): Promise<void>`
  - `addEvents(uid: string, events: LifeEvent[]): Promise<void>`
  - `getRecentEvents(uid: string, take?: number): Promise<LifeEvent[]>` — newest first, default 30

No unit tests: this module is thin Firestore I/O, and the codebase pattern (checkins.ts, plans.ts, memory.ts) is to keep such modules untested and verified via typecheck + live use. Path note: the spec sketches `lifeModel/areas/{areaId}`, but Firestore alternates collection/document, so we flatten to `users/{uid}/lifeModel/{profile|career|health|mental|financial|social}` — same data, valid paths.

- [ ] **Step 1: Write the module**

Create `lib/firebase/lifeModel.ts`:

```ts
import { db } from './firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  LIFE_AREAS,
  emptyLifeModel,
  type LifeModel,
  type LifeAreaId,
  type AreaState,
  type LifeEvent,
  type EventType,
} from '@/lib/lifemodel/types';

/**
 * The brain's storage. Docs live at users/{uid}/lifeModel/{docId} where
 * docId is 'profile' or one of the five area ids. Events are an append-only
 * timeline at users/{uid}/events. All reads/writes use the client SDK,
 * consistent with the app's no-Admin-SDK architecture.
 */

export async function getLifeModel(uid: string): Promise<LifeModel | null> {
  const profileSnap = await getDoc(doc(db, 'users', uid, 'lifeModel', 'profile'));
  if (!profileSnap.exists()) return null;

  const model = emptyLifeModel();
  const p = profileSnap.data();
  model.profile = {
    identity: (p.identity as string) ?? '',
    personality: (p.personality as string) ?? '',
    coachingStyle: (p.coachingStyle as string) ?? '',
  };

  const areaSnaps = await Promise.all(
    LIFE_AREAS.map((a) => getDoc(doc(db, 'users', uid, 'lifeModel', a))),
  );
  areaSnaps.forEach((snap, i) => {
    if (!snap.exists()) return;
    const d = snap.data();
    model.areas[LIFE_AREAS[i]] = {
      status: (d.status as string) ?? '',
      summary: (d.summary as string) ?? '',
      goals: (d.goals as AreaState['goals']) ?? [],
      threads: (d.threads as AreaState['threads']) ?? [],
    };
  });

  return model;
}

export async function saveLifeModel(uid: string, model: LifeModel): Promise<void> {
  await Promise.all([
    setDoc(doc(db, 'users', uid, 'lifeModel', 'profile'), {
      ...model.profile,
      updatedAt: serverTimestamp(),
    }),
    ...LIFE_AREAS.map((a) =>
      setDoc(doc(db, 'users', uid, 'lifeModel', a), {
        ...model.areas[a],
        updatedAt: serverTimestamp(),
      }),
    ),
  ]);
}

export async function addEvents(uid: string, events: LifeEvent[]): Promise<void> {
  await Promise.all(
    events.map((e) =>
      addDoc(collection(db, 'users', uid, 'events'), {
        date: e.date,
        area: e.area,
        type: e.type,
        content: e.content,
        createdAt: serverTimestamp(),
      }),
    ),
  );
}

export async function getRecentEvents(uid: string, take = 30): Promise<LifeEvent[]> {
  const q = query(
    collection(db, 'users', uid, 'events'),
    orderBy('date', 'desc'),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    date: d.data().date as string,
    area: d.data().area as LifeAreaId,
    type: d.data().type as EventType,
    content: d.data().content as string,
  }));
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors in `lib/firebase/lifeModel.ts` (pre-existing errors elsewhere, if any, are out of scope — note them but don't fix)

- [ ] **Step 3: Commit**

```bash
git add lib/firebase/lifeModel.ts
git commit -m "feat: Firestore accessors for Life Model and events"
```

---

### Task 5: Extraction API route + service

**Files:**
- Create: `app/api/coach/extract/service.ts`
- Create: `app/api/coach/extract/route.ts`
- Modify: `lib/validation/api.ts` (add `extractRequestSchema`)

**Interfaces:**
- Consumes: `extractionDiffSchema`, `ExtractionDiff` from `@/lib/lifemodel/extraction`; `getAuthedUid` from `@/lib/auth/verifyAuth`
- Produces:
  - `POST /api/coach/extract` — body `{ conversationText: string, lifeModel: unknown }`, response `{ diff: ExtractionDiff }` (200), 401 unauthorized, 400 invalid body, 500 on Groq/validation failure
  - `extractLifeModelDiff(conversationText: string, lifeModelJson: string): Promise<ExtractionDiff>` (used directly by the eval harness in Task 9)

- [ ] **Step 1: Add the request schema**

In `lib/validation/api.ts`, append after `summarizeRequestSchema` (keeping the existing `nonEmpty` helper):

```ts
// Sent by the client to /api/coach/extract to update the Life Model
export const extractRequestSchema = z
  .object({
    conversationText: nonEmpty,
    // The client's own current Life Model, passed through to the extraction
    // prompt so the model can reference existing goal/thread ids. Shape is
    // not validated here — it is client-owned data that only flows back
    // into the prompt, never into Firestore from this route.
    lifeModel: z.unknown(),
  })
  .passthrough();

export type ExtractRequest = z.infer<typeof extractRequestSchema>;
```

- [ ] **Step 2: Write the extraction service**

Create `app/api/coach/extract/service.ts`:

```ts
import { extractionDiffSchema, type ExtractionDiff } from '@/lib/lifemodel/extraction';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const EXTRACTOR_SYSTEM_PROMPT = `You are the memory extractor for a life-mentor app. You read a conversation (or check-in) and the user's current Life Model, then return a JSON diff of what changed. You never chat — you only output JSON.

The Life Model has five areas: career, health, mental, financial, social.

Return a JSON object with this exact shape (all top-level keys required, use empty arrays when nothing applies):
{
  "events": [{ "area": "...", "type": "milestone|setback|activity|decision|feeling|fact", "content": "short dated-fact, max 300 chars" }],
  "areas": [{
    "area": "...",
    "status": "optional: refreshed 2-3 sentence current situation for this area",
    "summary": "optional: refreshed short narrative of this area's history",
    "addGoals": [{ "text": "...", "targetDate": "YYYY-MM-DD or null" }],
    "closeGoalIds": ["existing goal id"],
    "addThreads": ["new open loop, e.g. 'interviewing at TCS'"],
    "closeThreadIds": ["existing thread id"]
  }],
  "profile": { "identity": "optional", "personality": "optional", "coachingStyle": "optional" }
}

Rules:
- Extract only what the text actually says. Never invent facts.
- Record concrete happenings as events. Skip small talk entirely — an empty diff is a valid, common answer.
- Update an area's status only when the new information genuinely changes the picture.
- Close a thread/goal ONLY by an id that exists in the provided Life Model.
- Set profile.coachingStyle only on clear signals about how the user wants to be coached (e.g. "stop sugarcoating").
- Do not restate things already present in the Life Model.`;

/**
 * One-shot, non-streamed Groq call that turns conversation text into a
 * validated ExtractionDiff. Separate from the chat call by design (spec
 * section 2): logging accuracy never competes with conversational quality.
 */
export async function extractLifeModelDiff(
  conversationText: string,
  lifeModelJson: string,
): Promise<ExtractionDiff> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current Life Model:\n${lifeModelJson}\n\nNew conversation:\n${conversationText}\n\nReturn the JSON diff.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Groq extract error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Groq returned an empty extraction');

  const parsed = extractionDiffSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error('Extraction failed schema validation:', parsed.error.flatten());
    throw new Error('Extraction output did not match schema');
  }
  return parsed.data;
}
```

- [ ] **Step 3: Write the route**

Create `app/api/coach/extract/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUid } from '@/lib/auth/verifyAuth';
import { extractRequestSchema } from '@/lib/validation/api';
import { extractLifeModelDiff } from './service';

export async function POST(request: NextRequest) {
  const uid = await getAuthedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const diff = await extractLifeModelDiff(
      parsed.data.conversationText,
      JSON.stringify(parsed.data.lifeModel ?? {}),
    );
    return NextResponse.json({ diff });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ error: 'Failed to extract' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify typecheck + full test suite still green**

Run: `npx tsc --noEmit` then `npx vitest run`
Expected: no new type errors; all existing tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/coach/extract lib/validation/api.ts
git commit -m "feat: extraction API route turning conversations into Life Model diffs"
```

---

### Task 6: Pure context assembly

**Files:**
- Modify: `lib/coach/context.ts` (add new exports; do NOT delete old ones yet — removal happens in Task 8)
- Test: `tests/coach/context.test.ts`

**Interfaces:**
- Consumes: `LifeModel`, `LifeEvent`, `LIFE_AREAS` from `@/lib/lifemodel/types`
- Produces: `assembleMentorContext(model: LifeModel, recentEvents: LifeEvent[]): string` — pure, deterministic, independently budgeted sections in this order (spec layers 2-7; layer 1, persona, stays server-side): coaching style → profile → area statuses → goals+threads → recent events → area summaries. Empty layers are omitted; an entirely empty model returns `''`.

- [ ] **Step 1: Write the failing tests**

Create `tests/coach/context.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { emptyLifeModel, type LifeEvent } from '@/lib/lifemodel/types';
import { assembleMentorContext } from '@/lib/coach/context';

function populatedModel() {
  const model = emptyLifeModel();
  model.profile = {
    identity: 'Final-year CS student in Mumbai',
    personality: 'Ambitious, hard on himself',
    coachingStyle: 'Direct feedback, no sugarcoating',
  };
  model.areas.career.status = 'Job hunting, one interview scheduled at TCS.';
  model.areas.career.goals.push({ id: 'g1', text: 'Land a frontend job', targetDate: '2026-09-01', status: 'active' });
  model.areas.career.goals.push({ id: 'g2', text: 'Old goal', targetDate: null, status: 'done' });
  model.areas.career.threads.push({ id: 't1', text: 'interviewing at TCS', status: 'open' });
  model.areas.career.threads.push({ id: 't2', text: 'closed loop', status: 'closed' });
  model.areas.health.summary = 'Trained consistently through June.';
  return model;
}

const EVENTS: LifeEvent[] = [
  { id: 'e1', date: '2026-07-02T10:00:00.000Z', area: 'career', type: 'milestone', content: 'Interview scheduled at TCS' },
];

describe('assembleMentorContext', () => {
  it('returns empty string for an empty model with no events', () => {
    expect(assembleMentorContext(emptyLifeModel(), [])).toBe('');
  });

  it('renders sections in the spec order', () => {
    const block = assembleMentorContext(populatedModel(), EVENTS);
    const order = [
      block.indexOf('## How to coach this user'),
      block.indexOf('## Who they are'),
      block.indexOf('## Life areas right now'),
      block.indexOf('## Active goals and open threads'),
      block.indexOf('## Recent events'),
      block.indexOf('## Earlier history (summarized)'),
    ];
    for (const idx of order) expect(idx).toBeGreaterThanOrEqual(0);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('includes only active goals and open threads', () => {
    const block = assembleMentorContext(populatedModel(), []);
    expect(block).toContain('Land a frontend job');
    expect(block).not.toContain('Old goal');
    expect(block).toContain('interviewing at TCS');
    expect(block).not.toContain('closed loop');
  });

  it('formats events with date and area', () => {
    const block = assembleMentorContext(populatedModel(), EVENTS);
    expect(block).toContain('- 2026-07-02 [career] Interview scheduled at TCS');
  });

  it('omits sections with no content', () => {
    const model = emptyLifeModel();
    model.areas.career.status = 'Job hunting.';
    const block = assembleMentorContext(model, []);
    expect(block).toContain('## Life areas right now');
    expect(block).not.toContain('## How to coach this user');
    expect(block).not.toContain('## Recent events');
  });

  it('truncates oversized layers to their budget', () => {
    const model = emptyLifeModel();
    model.profile.coachingStyle = 'x'.repeat(2000);
    const block = assembleMentorContext(model, []);
    // coaching style budget is 300 chars + section header + ellipsis
    expect(block.length).toBeLessThan(400);
    expect(block).toContain('…');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/coach/context.test.ts`
Expected: FAIL — `assembleMentorContext` is not exported

- [ ] **Step 3: Add the pure assembler to `lib/coach/context.ts`**

Add these imports at the top of `lib/coach/context.ts` (keep all existing code untouched):

```ts
import { LIFE_AREAS, type LifeModel, type LifeEvent } from '@/lib/lifemodel/types';
```

Then append at the end of the file:

```ts
// ---------------------------------------------------------------------------
// Life Model context (Plan 1: The Brain). Replaces the plan/check-in pipeline
// above — old exports are removed once the chat page is rewired (Task 8).
// ---------------------------------------------------------------------------

// Per-layer character budgets (~4 chars/token, same approximation as BUDGET
// above). Total worst case ≈ 4,000 chars ≈ 1,000 tokens of user context.
const MENTOR_BUDGET = {
  coachingStyle: 300,
  profile: 500,
  areaStatuses: 800,
  goalsThreads: 700,
  recentEvents: 800,
  summaries: 900,
} as const;

/**
 * Assemble the mentor's user-context block from the Life Model + recent
 * events. Pure and deterministic — all Firestore reads happen in
 * buildMentorContext (Task 7). Layer order follows the spec: coaching
 * style, profile, area statuses, goals/threads, recent events, summaries.
 */
export function assembleMentorContext(model: LifeModel, recentEvents: LifeEvent[]): string {
  const sections: string[] = [];

  if (model.profile.coachingStyle) {
    sections.push(
      `## How to coach this user\n${truncateToBudget(model.profile.coachingStyle, MENTOR_BUDGET.coachingStyle)}`,
    );
  }

  const profileText = [model.profile.identity, model.profile.personality]
    .filter(Boolean)
    .join(' ');
  if (profileText) {
    sections.push(`## Who they are\n${truncateToBudget(profileText, MENTOR_BUDGET.profile)}`);
  }

  const statusLines = LIFE_AREAS.filter((a) => model.areas[a].status)
    .map((a) => `- ${a}: ${model.areas[a].status}`)
    .join('\n');
  if (statusLines) {
    sections.push(
      `## Life areas right now\n${truncateToBudget(statusLines, MENTOR_BUDGET.areaStatuses)}`,
    );
  }

  const goalThreadLines = LIFE_AREAS.flatMap((a) => [
    ...model.areas[a].goals
      .filter((g) => g.status === 'active')
      .map((g) => `- goal [${a}] ${g.text}${g.targetDate ? ` (by ${g.targetDate})` : ''}`),
    ...model.areas[a].threads
      .filter((t) => t.status === 'open')
      .map((t) => `- open [${a}] ${t.text}`),
  ]).join('\n');
  if (goalThreadLines) {
    sections.push(
      `## Active goals and open threads\n${truncateToBudget(goalThreadLines, MENTOR_BUDGET.goalsThreads)}`,
    );
  }

  const eventLines = recentEvents
    .map((e) => `- ${e.date.slice(0, 10)} [${e.area}] ${e.content}`)
    .join('\n');
  if (eventLines) {
    sections.push(`## Recent events\n${truncateToBudget(eventLines, MENTOR_BUDGET.recentEvents)}`);
  }

  const summaryLines = LIFE_AREAS.filter((a) => model.areas[a].summary)
    .map((a) => `- ${a}: ${model.areas[a].summary}`)
    .join('\n');
  if (summaryLines) {
    sections.push(
      `## Earlier history (summarized)\n${truncateToBudget(summaryLines, MENTOR_BUDGET.summaries)}`,
    );
  }

  return sections.join('\n\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/coach/context.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/coach/context.ts tests/coach/context.test.ts
git commit -m "feat: pure mentor context assembly over the Life Model"
```

---

### Task 7: Extraction runner + context loader with lazy seeding

**Files:**
- Create: `lib/coach/extraction-client.ts`
- Modify: `lib/coach/context.ts` (add `buildMentorContext`; old `buildCoachContext` still untouched)

**Interfaces:**
- Consumes: `getLifeModel`, `saveLifeModel`, `addEvents`, `getRecentEvents` from `@/lib/firebase/lifeModel`; `applyDiff` from `@/lib/lifemodel/apply`; `extractionDiffSchema` from `@/lib/lifemodel/extraction`; `getUserPlans`, `getPlan`, `pickActivePlan` from `@/lib/firebase/plans`; `getRecentCheckins` from `@/lib/firebase/checkins`; existing `summarizePlanForPrompt` (same file)
- Produces:
  - `runExtraction(uid: string, idToken: string, model: LifeModel, conversationText: string): Promise<{ model: LifeModel; newEvents: LifeEvent[] } | null>` — null on any failure (graceful degradation: raw data is already saved elsewhere, extraction retries on the next interaction)
  - `buildMentorContext(uid: string, idToken: string): Promise<MentorContext>` where `MentorContext = { contextBlock: string; hasModel: boolean; model: LifeModel | null }` — lazily seeds the model from existing check-ins + active plan on first use (this is the spec's backfill mechanism)

- [ ] **Step 1: Write the extraction runner**

Create `lib/coach/extraction-client.ts`:

```ts
import { extractionDiffSchema } from '@/lib/lifemodel/extraction';
import { applyDiff } from '@/lib/lifemodel/apply';
import { saveLifeModel, addEvents } from '@/lib/firebase/lifeModel';
import type { LifeModel, LifeEvent } from '@/lib/lifemodel/types';

export interface ExtractionOutcome {
  model: LifeModel;
  newEvents: LifeEvent[];
}

/**
 * Run one extraction round-trip: send conversation text + current model to
 * /api/coach/extract, validate the diff, apply it, persist model + events.
 * Returns null on ANY failure — never throws. The raw conversation is
 * already persisted by the caller (messages/check-ins), so a failed
 * extraction only means the brain is briefly stale, not that data is lost.
 */
export async function runExtraction(
  uid: string,
  idToken: string,
  model: LifeModel,
  conversationText: string,
): Promise<ExtractionOutcome | null> {
  try {
    const res = await fetch('/api/coach/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ conversationText, lifeModel: model }),
    });
    if (!res.ok) throw new Error(`Extract request failed: ${res.status}`);

    const { diff } = await res.json();
    const parsed = extractionDiffSchema.safeParse(diff);
    if (!parsed.success) throw new Error('Extract response failed validation');

    const { model: next, newEvents } = applyDiff(model, parsed.data, new Date().toISOString());
    await Promise.all([saveLifeModel(uid, next), addEvents(uid, newEvents)]);
    return { model: next, newEvents };
  } catch (error) {
    console.error('Extraction failed (brain will catch up on next interaction):', error);
    return null;
  }
}
```

- [ ] **Step 2: Add the context loader + seeding to `lib/coach/context.ts`**

Add imports at the top:

```ts
import { getLifeModel, getRecentEvents } from '@/lib/firebase/lifeModel';
import { emptyLifeModel } from '@/lib/lifemodel/types';
import { runExtraction } from './extraction-client';
```

(The file already imports from `@/lib/firebase/plans` and `@/lib/firebase/checkins`.)

Append at the end of the file:

```ts
export interface MentorContext {
  contextBlock: string;
  hasModel: boolean;
  model: LifeModel | null;
}

/**
 * One-time backfill (spec section 5): when no Life Model exists yet, feed
 * the user's existing check-ins and active plan through the extraction
 * pipeline to seed it. Returns null when there is nothing to seed from —
 * the mentor then starts cold and the model is created by the first
 * extraction after a real conversation.
 */
async function seedLifeModelFromHistory(uid: string, idToken: string): Promise<LifeModel | null> {
  const [plans, checkins] = await Promise.all([getUserPlans(uid), getRecentCheckins(uid, 20)]);

  const parts: string[] = [];
  const activePlan = pickActivePlan(plans);
  if (activePlan) {
    const fullPlan = await getPlan(uid, activePlan.id);
    if (fullPlan) {
      parts.push(
        `The user has an existing ${fullPlan.type} plan: ${summarizePlanForPrompt(fullPlan.type, fullPlan.data)}`,
      );
    }
  }
  if (checkins.length > 0) {
    const lines = checkins
      .map((c) => `- [${c.type}] (${c.createdAt.slice(0, 10)}) ${c.summary}`)
      .join('\n');
    parts.push(`The user's past check-ins, newest first:\n${lines}`);
  }
  if (parts.length === 0) return null;

  const outcome = await runExtraction(uid, idToken, emptyLifeModel(), parts.join('\n\n'));
  return outcome?.model ?? null;
}

/**
 * Load the brain for a chat session: fetch the Life Model (seeding it from
 * pre-Life-Model history on first use) plus recent events, and assemble
 * the context block. Client-side because it needs the Firestore client SDK
 * — same reasoning as buildCoachContext before it.
 */
export async function buildMentorContext(uid: string, idToken: string): Promise<MentorContext> {
  let model: LifeModel | null = null;
  try {
    model = await getLifeModel(uid);
    if (!model) model = await seedLifeModelFromHistory(uid, idToken);
  } catch (error) {
    console.error('Failed to load Life Model:', error);
  }
  if (!model) return { contextBlock: '', hasModel: false, model: null };

  let events: LifeEvent[] = [];
  try {
    events = await getRecentEvents(uid, 15);
  } catch (error) {
    // Degrade gracefully: chat proceeds on the model alone (spec section 6).
    console.error('Failed to load recent events:', error);
  }

  return {
    contextBlock: assembleMentorContext(model, events),
    hasModel: true,
    model,
  };
}
```

- [ ] **Step 3: Verify typecheck + tests**

Run: `npx tsc --noEmit` then `npx vitest run`
Expected: no new type errors; all tests PASS

- [ ] **Step 4: Commit**

```bash
git add lib/coach/extraction-client.ts lib/coach/context.ts
git commit -m "feat: extraction runner + mentor context loader with lazy seeding"
```

---

### Task 8: Rewire chat to the brain — persona, page, per-turn extraction

**Files:**
- Modify: `app/api/coach/chat/service.ts:20-34` (persona rewrite in `buildSystemPrompt`)
- Modify: `app/(app)/coach/page.tsx` (swap `buildCoachContext` → `buildMentorContext`, add per-turn extraction, update header copy)

**Interfaces:**
- Consumes: `buildMentorContext`, `assembleMentorContext`, `MentorContext` from `@/lib/coach/context`; `runExtraction` from `@/lib/coach/extraction-client`; `LifeModel`, `LifeEvent` from `@/lib/lifemodel/types`
- Produces: the user-facing behavior change — mentor persona, whole-life context, brain updated after every completed turn. Wire format and `/api/coach/chat` request shape are unchanged.

- [ ] **Step 1: Rewrite the persona in `buildSystemPrompt`**

In `app/api/coach/chat/service.ts`, replace the `identity` constant and the no-context fallback inside `buildSystemPrompt` (lines 21-31) with:

```ts
  const identity =
    'You are the ThriveAI mentor — a personal life mentor who knows this user deeply and ' +
    'guides them across their whole life: career, health, mental wellbeing, finances, and ' +
    'social life. You are warm but direct: reference their actual history, hold them ' +
    'accountable to their stated goals, and connect the dots between life areas (e.g. poor ' +
    'sleep before an interview week). Keep replies short (2-4 sentences) unless asked for ' +
    'detail. Never give medical or financial-professional diagnoses; suggest professional ' +
    'help for anything beyond general guidance. When the user reports something concrete — ' +
    'a workout, a mood, an event worth remembering — call the log_checkin tool rather than ' +
    'only acknowledging it in text.';

  if (!contextBlock) {
    return `${identity}\n\nYou are meeting this user for the first time and know nothing about them yet. Ask about their current situation to start building the picture.`;
  }
```

The final `return` statement keeps its shape but changes the trailing instruction to:

```ts
  return `${identity}\n\nContext about this user:\n\n${contextBlock}\n\nGround every reply in this context — reference their goals, open threads, and recent events where relevant, and never contradict it.`;
```

- [ ] **Step 2: Rewire `app/(app)/coach/page.tsx`**

Apply these changes:

1. Replace the import `import { buildCoachContext } from '@/lib/coach/context';` with:

```ts
import { buildMentorContext, assembleMentorContext } from '@/lib/coach/context';
import { runExtraction } from '@/lib/coach/extraction-client';
import type { LifeModel, LifeEvent } from '@/lib/lifemodel/types';
```

2. Replace the `hasPlan` state line with brain state:

```ts
  const [hasModel, setHasModel] = useState(false);
  const [lifeModel, setLifeModel] = useState<LifeModel | null>(null);
  const [recentEvents, setRecentEvents] = useState<LifeEvent[]>([]);
```

3. In the mount effect, replace the `buildCoachContext` call block:

```ts
        const [history, ctx] = await Promise.all([
          getRecentMessages(u.uid, 20),
          buildMentorContext(u.uid, idToken),
        ]);
        setMessages(history);
        setContextBlock(ctx.contextBlock || undefined);
        setHasModel(ctx.hasModel);
        setLifeModel(ctx.model);
```

4. In `streamAssistantReply`, after the final `setMessages` that writes `finalText` (currently line 154) and before the `saveMessage` call, add the per-turn extraction (fire-and-forget — it must never block or fail the chat):

```ts
      // Update the brain from this turn. Deliberately not awaited into the
      // UI path: extraction failure only means the brain is briefly stale.
      if (lifeModel && finalText) {
        const turnText = `User: ${userText}\nMentor: ${finalText}`;
        runExtraction(user.uid, idToken, lifeModel, turnText).then((outcome) => {
          if (!outcome) return;
          setLifeModel(outcome.model);
          setRecentEvents((prev) => {
            const merged = [...outcome.newEvents, ...prev].slice(0, 15);
            setContextBlock(assembleMentorContext(outcome.model, merged) || undefined);
            return merged;
          });
        });
      }
```

5. Update the header copy (currently references plans):

```tsx
        <h1 className="font-serif text-lg font-semibold text-foreground">Thrive Mentor</h1>
        <p className="text-xs text-text-muted">
          {hasModel ? 'Knows your goals, history, and whole picture' : 'Getting to know you — just start talking'}
        </p>
```

6. Update `SUGGESTED_PROMPTS` to mentor scope:

```ts
const SUGGESTED_PROMPTS = [
  'Here\'s how my day went…',
  'How have I been doing lately?',
  'What should I focus on this week?',
  'Help me think through a decision',
];
```

- [ ] **Step 3: Verify with typecheck, tests, and a live manual pass**

Run: `npx tsc --noEmit` then `npx vitest run` — expected: green.

Then `npm run dev` and in a browser (mobile viewport via devtools):
1. Sign in with the dev account, open `/coach`.
2. First load with existing check-ins: expect a Firestore `users/{uid}/lifeModel/profile` doc to appear (seeding ran) — check the Firebase console.
3. Send: "Had my interview at TCS today, went okay but I barely slept last night." Expect a normal mentor reply, and within a few seconds new docs in `users/{uid}/events` plus an updated career area doc.
4. Reload the page and ask: "What do you know about my job search?" Expect the reply to reference the TCS interview.

- [ ] **Step 4: Commit**

```bash
git add app/api/coach/chat/service.ts "app/(app)/coach/page.tsx"
git commit -m "feat: mentor persona + chat rewired to Life Model with per-turn extraction"
```

---

### Task 9: Retire the old memory pipeline

**Files:**
- Delete: `lib/firebase/memory.ts`
- Delete: `app/api/coach/summarize/route.ts`, `app/api/coach/summarize/service.ts`
- Modify: `lib/coach/context.ts` (remove `buildCoachContext`, `getOrBuildMemorySummary`, `formatCheckinsForPrompt`, `RECENT_CHECKIN_WINDOW`, the old `BUDGET` constant, and the now-unused `CoachContext` interface; KEEP `summarizePlanForPrompt` — the seeding path uses it — and `truncateToBudget`)
- Modify: `lib/validation/api.ts` (remove `summarizeRequestSchema` and `SummarizeRequest`)

**Interfaces:**
- Consumes: nothing new
- Produces: nothing new — pure removal. After this task, `lib/coach/context.ts` exports exactly: `summarizePlanForPrompt`, `assembleMentorContext`, `MentorContext`, `buildMentorContext`.

- [ ] **Step 1: Verify nothing else references the old pipeline**

Run: `npx tsc --noEmit` after making no changes yet, then grep:

```bash
grep -rn "buildCoachContext\|getMemory\|saveMemory\|summarizeCheckins\|summarizeRequestSchema" app lib components evals --include="*.ts" --include="*.tsx"
```

Expected remaining references: only the definitions themselves plus `lib/coach/context.ts` internals (Task 8 already removed the coach page usage). If anything else shows up, fix that caller first.

- [ ] **Step 2: Delete and prune**

```bash
git rm lib/firebase/memory.ts app/api/coach/summarize/route.ts app/api/coach/summarize/service.ts
```

Then in `lib/coach/context.ts` remove: the `getMemory`/`saveMemory` import, the `RECENT_CHECKIN_WINDOW` and old `BUDGET` constants, `formatCheckinsForPrompt`, `getOrBuildMemorySummary`, the `CoachContext` interface, and `buildCoachContext`. In `lib/validation/api.ts` remove `summarizeRequestSchema` and `SummarizeRequest`.

- [ ] **Step 3: Verify build + tests**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: all green — proves nothing referenced the removed code.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: retire plan-summary/rolling-memory pipeline in favor of the Life Model"
```

---

### Task 10: Extraction + persona evals

**Files:**
- Create: `evals/extraction-evals.ts`
- Modify: `evals/run-evals.ts` (persona scenarios: update fitness-coach-scoped expectations, add one cross-domain scenario)

**Interfaces:**
- Consumes: `extractLifeModelDiff` from `../app/api/coach/extract/service`; `emptyLifeModel` from `../lib/lifemodel/types`; existing eval harness patterns (env loading, scenario/assert shape from `evals/run-evals.ts`)
- Produces: `npx tsx evals/extraction-evals.ts` — scripted live-API scenarios asserting *properties* of extraction diffs (right area touched, goals created, no hallucinated activity), matching the existing eval philosophy.

- [ ] **Step 1: Write the extraction eval harness**

Create `evals/extraction-evals.ts`:

```ts
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
    name: 'cross-domain check-in touches both areas',
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
```

- [ ] **Step 2: Run the extraction evals**

Run: `npx tsx evals/extraction-evals.ts`
Expected: 6/6 PASS. If a scenario fails on model judgment (not a bug), tune the extractor system prompt in `app/api/coach/extract/service.ts` — not the assertion — unless the assertion is genuinely too strict (e.g. demanding an exact area when two are defensible; the scenarios above already allow defensible alternatives).

- [ ] **Step 3: Update the persona evals**

In `evals/run-evals.ts`:
1. Run `npx tsx evals/run-evals.ts` first. Scenarios that assert fitness-coach scope-refusal (e.g. refusing career questions, if present) will now fail — the mentor legitimately handles all five areas. Update those scenarios' assertions to expect engagement instead of refusal.
2. Add one cross-domain scenario to the `scenarios` array (using the file's existing `Scenario` shape and `expectTextContainsAny` helper):

```ts
  {
    name: 'mentor connects sleep to interview prep across areas',
    message: 'What should I focus on this week?',
    contextBlock: [
      '## Life areas right now',
      '- career: Final-round interview at TCS scheduled this Friday.',
      '- health: Sleep has collapsed to ~4 hours/night for the past week.',
    ].join('\n'),
    assert: (result) => expectTextContainsAny(result, ['sleep', 'rest', 'tired']),
  },
```

- [ ] **Step 4: Run the full eval suites**

Run: `npx tsx evals/run-evals.ts && npx tsx evals/extraction-evals.ts`
Expected: all scenarios PASS in both suites.

- [ ] **Step 5: Commit**

```bash
git add evals/extraction-evals.ts evals/run-evals.ts
git commit -m "test: extraction evals + cross-domain persona eval"
```

---

## Out of scope for this plan (later plans)

- Daily check-in flow + Brain page UI → Plan 2
- Onboarding interview, nav/landing cleanup, assessment distillation into areas → Plan 3
- Motion system, library consolidation, walkthrough → Plan 4
