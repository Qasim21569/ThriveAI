# ThriveAI Life Mentor — Design Spec

**Date:** 2026-07-03
**Status:** Approved by user (brainstorming session)

## Purpose

Pivot ThriveAI from four siloed coaching domains into a single AI life mentor
with a persistent, structured model of the user — their career, health, mental
state, finances, and social life. The mentor remembers daily check-ins,
connects insights across life areas, and adapts its coaching style to the user
over time.

**Audience:** portfolio/learning project first. Optimize for demonstrable AI
engineering (memory architecture, context management, extraction, evals) while
remaining genuinely usable as the author's daily-driver mentor.

**Explicit non-goals (evaluated and rejected):**

- **No vector DB / RAG.** One user's life data (~hundreds of short entries)
  compresses into structured summaries that always fit in context. Retrieval
  adds infrastructure and failure modes with no benefit at this scale. Revisit
  only if users later upload large document corpora (resumes, multi-year
  journals).
- **No LangChain or agent frameworks.** Prompt assembly, tool calling, and
  structured outputs stay as plain TypeScript + direct Groq calls.
- **No fine-tuning.** Persona and adaptation are achieved via system prompt +
  stored coaching-style preferences, not model weights.
- **No custom life areas.** The five areas are fixed for now.

## 1. The Life Model (data architecture)

The "brain" is a set of human-readable Firestore documents per user:

```
users/{uid}/
  lifeModel/
    profile          — identity, personality traits, coaching-style prefs
                       (tone, depth, tough-love vs gentle — learned over time)
    areas/{areaId}   — one doc per area: career, health, mental, financial,
                       social. Each holds:
                       • status: 2-3 sentence current situation
                       • goals: active goals with target dates
                       • threads: open loops ("interviewing at X", "gym 3x/wk")
                       • summary: rolling narrative of this area's history
  events/{eventId}   — dated, typed facts extracted from conversations:
                       {date, area, type, content}
  checkins/          — raw daily check-in log (already exists; remains the
                       source of truth)
  conversations/     — chat history (already exists)
```

**Key properties:**

- **Raw log is truth; the Life Model is a cache.** Extraction bugs never lose
  data — the model can be wiped and rebuilt from check-ins + chat history.
- **Every field is human-readable.** No embeddings, no opaque state. This
  enables the Brain page (render the docs = see what the AI knows).
- The existing `memory/summary` doc is superseded by per-area summaries.
  Fitness plans and mental reports are distilled into their area docs rather
  than injected as separate context sources.

## 2. The AI pipeline

Two flows, both plain Groq calls with structured outputs.

### Write path (extraction)

After each daily check-in and after chat sessions, a dedicated extraction call
receives the new conversation text plus the current Life Model and returns a
structured diff:

- new events
- updated area statuses
- new/updated/closed threads
- goal changes
- coaching-style signals ("user responded well to being pushed")

The app applies the diff to Firestore. Extraction is a separate model call
from the chat response, so conversational quality never competes with logging
accuracy.

### Read path (context assembly)

An evolution of `lib/coach/context.ts`, assembled per message, each layer
independently character-budgeted (as today):

```
1. Mentor persona          — static system prompt (the mentor character)
2. Coaching-style prefs    — from profile (HOW to talk to this user)
3. Profile snapshot        — who the user is
4. All 5 area statuses     — 2-3 sentences each (the cross-domain view)
5. Active goals + threads  — what's live right now
6. Recent events           — last ~14 days, verbatim
7. Older history           — per-area rolling summaries
```

Total context stays under ~2,500 tokens. Every message carries the full
cross-domain picture — this is what enables connections like "your sleep is
broken AND you have interviews this week."

### Persona + adaptation

- Persona: engineered system prompt. Mentor voice — direct, references the
  user's history, holds them accountable, connects life areas.
- Adaptation: coaching-style prefs stored in the profile, written by the
  extraction pass, injected as context layer 2. Behavior changes because
  instructions change, not weights.

## 3. Surfaces (mobile-first UX)

All surfaces designed for phone screens first; desktop second. Same Next.js
web app (installable home-screen PWA-style; no native app, no push
notifications in this phase).

1. **Onboarding interview (once).** A guided conversation, not a form. The
   mentor walks through the 5 life areas one at a time with follow-ups, seeds
   the Life Model via extraction, and ends by playing back what it learned
   ("Here's my picture of you — correct anything").
2. **Daily check-in (the ritual).** Dedicated, fast, thumb-friendly flow.
   Opens with 2-3 adaptive prompts generated from live threads ("How did the
   interview go?"). Free text input (the phone keyboard's built-in dictation covers voice — no
   speech feature is built); one tap to submit;
   extraction runs; the mentor replies with a short reaction. Target: under 2
   minutes. Dashboard shows a streak.
3. **Mentor chat.** The existing streaming chat, re-grounded on the new
   context pipeline. The check-in is the ritual; chat is the relationship.
4. **The Brain page.** Renders the Life Model: profile, each area's
   status/goals/threads, recent events timeline. Everything editable — edits
   write back to Firestore. Trust feature, debug tool, and portfolio
   centerpiece in one.

**Navigation collapses to: Today (check-in) · Chat · Brain · Profile.**
The four-domain landing cards go away.

## 4. UI/UX modernization + interactive walkthrough

The app currently feels static — repeating sections, no motion language, and
an overgrown dependency set (framer-motion, GSAP, react-spring, Lottie,
three.js, locomotive-scroll, MUI, and Tailwind/shadcn all installed, used
inconsistently). The fix is consolidation plus a deliberate motion system, not
more libraries.

**Consolidated stack:**

- **Tailwind + shadcn/Radix** as the single component system. MUI is removed;
  its remaining usages are migrated.
- **Framer Motion** as the single animation system: page transitions, layout
  animations, micro-interactions (button presses, card reveals, streak
  celebrations), and staggered list entrances. GSAP, react-spring,
  locomotive-scroll, and smooth-scrollbar are removed unless a specific
  surviving surface depends on them.
- **Interactive product walkthrough** on first visit to each surface —
  spotlight-style guided tour (library chosen during planning: Onborda,
  driver.js, or react-joyride — Onborda preferred as it's built for
  Next.js + Tailwind + Framer Motion).
- **Motion principles:** fast (150-300ms), purposeful (motion communicates
  state change, not decoration), respects `prefers-reduced-motion`.

**Research task for the implementation plan:** survey current SaaS interaction
patterns (Linear, Notion, Vercel dashboards; mobile-first apps) and produce a
short motion/interaction guideline the UI phases follow — covering skeleton
loaders, optimistic UI, streaming-text treatment, empty states, and
celebration moments (streaks, onboarding completion).

## 5. Migration of existing features

- **Fitness & mental assessments stay** as optional deep-dives reachable from
  their areas on the Brain page. Outputs are distilled into area docs via the
  extraction path.
- **Career/finance stub pages and the goals page are removed** — replaced by
  the mentor + Brain page.
- `summarizePlanForPrompt` and the `memory/summary` doc retire once per-area
  summaries take over.
- Existing check-ins backfill into the events timeline.

## 6. Error handling

Graceful degradation throughout (matching existing code philosophy):

- **Extraction fails** → raw check-in/conversation already saved; extraction
  retries on the next interaction. Nothing lost; brain briefly stale.
- **Life Model read fails** → chat proceeds with whatever layers loaded rather
  than erroring.
- **Extraction writes something wrong** → user corrects it on the Brain page;
  the raw log is untouched.

## 7. Testing & evals

Extends the existing Phase 4/5 eval setup:

- **Unit tests** for context assembly: budgets, layer ordering, missing-data
  cases.
- **Extraction evals** (highest-risk component, most coverage): fixture
  conversations with expected diffs — e.g. "check-in mentions interview →
  career event created, thread updated."
- **Persona evals:** fixture contexts with assertions on response behavior
  (references history, respects coaching-style prefs, connects two areas).
- **Manual mobile pass** on a real phone for each surface.

## 8. Build order

Each phase leaves a working app:

1. Life Model schema + extraction pipeline
2. Context pipeline rewrite (read path)
3. Daily check-in flow
4. Brain page
5. Onboarding interview
6. Navigation/landing cleanup + assessment integration
7. UI/UX modernization pass + interactive walkthrough (motion research feeds
   this phase; foundational component consolidation may start earlier where it
   unblocks phases 3-5)
