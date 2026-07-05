# Plan 4 — UI/UX Overhaul Brief (handoff document)

**Date:** 2026-07-06
**Status:** Approved direction, ready for planning + execution by an implementing agent
**Supersedes/expands:** section 4 of `docs/superpowers/specs/2026-07-03-life-mentor-design.md`

---

## Mission

Take ThriveAI — a working AI life-mentor app — from "functional but visually static" to a
**production-grade, market-level product**: one coherent design theme, a deliberate motion
system, polished onboarding, and zero visual bugs. The bar is the feel of modern
best-in-class SaaS products (Linear, Notion, Vercel dashboard; mobile-first apps of that
caliber) — achieved through **consistency and restraint**, not effect-stacking.

This is the last of four planned phases. Plans 1–3 (the Life Model "brain", daily
surfaces, onboarding interview) are fully built, tested, and verified. Plan 4 touches
**presentation only** — no backend, no data model, no AI-pipeline changes.

## Product context (what you're styling)

ThriveAI is a personal AI life mentor. It holds a structured, persistent model of the
user's life across five areas (career, health, mental, financial, social), updated by an
extraction pipeline after every conversation. The product's emotional promise:
**a calm, trustworthy companion that knows you and holds you accountable** — warm and
human, not clinical, not corporate, not gamified-to-death.

Surfaces (all exist and work):

| Route | Purpose |
|---|---|
| `/` | Marketing landing (hero, features) |
| `/onboarding` | Guided interview that seeds the Life Model; first-run experience after sign-up |
| `/today` | Daily check-in ritual — adaptive prompts, streak, mentor reaction. The habit loop. |
| `/coach` | Streaming mentor chat (SSE-style text streaming, tool-call confirmation chips) |
| `/brain` | Renders the Life Model — profile + 5 area cards with inline editing, events timeline. The trust centerpiece. |
| `/dashboard`, `/progress`, `/profile`, `/settings` | Supporting app pages (shared `AppNav` in route group `app/(app)/`) |
| `/auth/*` | Sign in / sign up / forgot password |
| `/fitness/*`, `/mental/*` | Optional deep-dive assessments reachable from the Brain page |

## Design direction (the important nuance)

The current design system is a **warm, calm palette**: oat/cream backgrounds, coffee-brown
primary, terracotta accent, charcoal ink text, IBM Plex Sans + Source Serif 4, no pure
white/black. Defined as CSS-variable tokens in `app/globals.css` with semantic shadcn
aliases mapped in `tailwind.config.js`.

**The owner's direction, verbatim in spirit:**

- The **feel** of the current design is right and must be kept: warm, calm, human.
- The **execution** must be elevated significantly — right now it reads flat and static.
- The specific **palette values are negotiable**. If a evolved or partially different
  palette serves the "personal AI mentor" identity better, change it — as long as it
  stays in the same emotional family (warm, grounded, trustworthy). Do **not** swap to a
  generic cold SaaS blue/purple/dark-gradient look.
- The final theme must feel **chosen and specific to this product**, not template-default.

Concretely, "elevated" means: a confident type hierarchy (the serif display face is
underused — it's a differentiator, use it deliberately), real depth (considered shadows/
surface layering instead of flat same-value cards), intentional white space, refined
component states (hover/focus/active/disabled all designed, not browser-default), and a
motion language (below). The token *architecture* (semantic aliases over raw scales) is
good — keep it; change the values and the application, not the system.

If a `frontend-design` skill is available in your environment, invoke it before starting
visual work.

## Hard constraints

1. **Stack:** Tailwind + shadcn/Radix components (vendored in `components/ui/`) as the
   only component system. **Framer Motion as the only animation runtime.** Scroll effects
   via Framer Motion's `useScroll`/`useInView` — do not add scroll libraries.
   - Single allowed exception class: a tiny single-purpose one-off (e.g.
     `canvas-confetti` ~2KB for streak celebrations) added knowingly and documented.
     Anything larger needs the owner's sign-off first.
2. **Dependency purge is in scope and required.** `package.json` carries ~30 unused
   packages (entire three.js stack, entire MUI stack, GSAP, react-spring, lottie,
   locomotive-scroll, smooth-scrollbar, chart.js, heroicons, @huggingface/inference,
   node-fetch, polyfills, `@shadcn/ui` placeholder, more). None are imported in source
   (verified by grep). Remove them, clean the related cruft in `next.config.js`
   (three.js alias, MUI optimizePackageImports, polyfill fallbacks, manual splitChunks)
   and delete `types/maath.d.ts` + `types/three-elements.d.ts`. First-load JS is
   currently 518KB — record before/after.
3. **Mobile-first.** The owner's acceptance test is literally opening it on their phone.
   Design at 375px first, then scale up. Test at mobile/tablet/desktop widths.
4. **Accessibility:** every animation respects `prefers-reduced-motion`; interactive
   elements keep visible focus states; touch targets ≥44px on mobile.
5. **Motion principles:** fast (150–300ms), purposeful (communicates state change),
   consistent easing (`cubic-bezier(0.4, 0, 0.2, 1)` token already exists). In-app
   surfaces get restrained motion; the marketing landing page may go bigger
   (scroll-triggered reveals, hero entrance).
6. **Nothing functional breaks.** `npx tsc --noEmit`, `npx vitest run` (38 tests), and
   `npm run build` must stay green after every task. Do not modify: `lib/lifemodel/*`,
   `lib/coach/context.ts` logic, `app/api/*` service logic, Firestore access, evals.
   Presentation-layer edits to page/component files are the scope.
7. TypeScript strict; no `any` leakage; follow existing file/naming conventions.

## Workstreams (suggested build order)

Write a task-by-task implementation plan first (the repo's convention:
`docs/superpowers/plans/`, follow the structure of the three existing plan docs —
small tasks, verification step + commit per task).

**0. Research + design foundation (do first, everything follows it).**
Survey current-generation SaaS interaction patterns (Linear, Notion, Vercel, and one or
two excellent mobile-first consumer apps). Produce two short deliverables committed to
`docs/`:
   - a **theme decision**: the evolved palette/typography/depth system, expressed as
     concrete edits to `app/globals.css` tokens + `tailwind.config.js`, with a one-page
     rationale tying it to the mentor identity;
   - a **motion & interaction guideline**: durations, easings, what animates (page
     transitions, list stagger, card reveals, button presses, streaming text, skeleton →
     content swaps, empty states, celebration moments) and what never animates.

**1. Token + primitive rollout.** Apply the new theme tokens; audit every component in
`components/ui/` (button, card, input, textarea, tabs, dialog/modal patterns, skeleton,
sonner toasts) against the theme — states, radii, shadows, spacing. Fix centrally here so
page work inherits it.

**2. Motion system install.** Add Framer Motion; build small shared primitives (e.g.
`FadeIn`, `Stagger`, page-transition wrapper in the `(app)` layout) rather than ad-hoc
motion props scattered per page.

**3. Surface-by-surface elevation pass** (each its own task with before/after
screenshots): landing → auth → onboarding → today → coach → brain → dashboard/progress →
profile/settings. Landing gets the marketing treatment (scroll-linked hero/sections);
in-app surfaces get the restrained treatment. Include loading skeletons, empty states,
and error states for every surface — they are part of the design, not leftovers.

**4. First-run walkthrough.** Spotlight-style guided tour on first visit to `/today` and
`/brain` (Onborda preferred — built for Next.js + Tailwind + Framer Motion; evaluate
before adopting, driver.js is the fallback). Dismissible, remembers completion
(localStorage is fine), never shown again after completion.

**5. Celebration moments.** Streak milestones on `/today`, onboarding completion. Small,
tasteful, reduced-motion-aware.

**6. Visual QA gate (required, last).** A written checklist executed against the
production build (`next start`), not dev mode:
   - every surface at 375px / 768px / 1280px;
   - every surface's loading, empty, error, and long-content/overflow states;
   - keyboard focus order and visible focus rings on interactive flows;
   - `prefers-reduced-motion` pass;
   - no layout shift on font load, no scrollbar jank, no FOUC;
   - screenshots captured as proof for each surface at each width.
   Fix everything found; re-run until clean. "No visual bugs" is a gate, not a hope.

## Verification expectations

- After every task: typecheck + tests + build green, commit with a clear message.
- Surface tasks: verify live in a browser (dev server via `.claude/launch.json` configs;
  a prod config on port 3100 exists), screenshot before/after.
- Final: full production build + the visual QA gate above + a bundle-size comparison
  (518KB first-load baseline).

## Out of scope

- Any backend/AI/data change (extraction, context assembly, Firestore schema, evals).
- Dark mode — decide in workstream 0 whether the theme *reserves space* for it
  (token architecture already supports it), but building it is optional and last.
- Native app / push notifications / PWA manifest work.
- New product features. If a design need exposes a missing feature, note it, don't build it.

## Practical setup

- Repo: `C:\Qasim\ThriveAI\ThriveAI` (nested — the outer folder is a workspace).
  Work on a new branch off `feature/life-mentor-onboarding` (e.g. `feature/ui-overhaul`).
- Commands: `npm run dev` / `npm run build && npm start` / `npx vitest run` /
  `npx tsc --noEmit`. Windows machine — no bash-isms in npm scripts.
- Test account: `phase2test@thriveai.dev` / `TestPass123!` — has a real Life Model,
  plans, and check-in history. Reuse it; do not create new accounts.
- A dev-only "🧪 Fill sample data" button exists on the fitness form for fast testing.
- Key design files: `app/globals.css` (all tokens), `tailwind.config.js` (semantic
  mapping, radii, shadows, motion tokens), `components/ui/*` (primitives),
  `components/app/app-nav.tsx` (shared nav), `app/(app)/layout.tsx` (app shell).
