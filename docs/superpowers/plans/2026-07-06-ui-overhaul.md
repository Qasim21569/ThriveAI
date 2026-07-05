# Life Mentor Plan 4: UI Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take ThriveAI from functional-but-flat to production-grade: purged dependencies, evolved theme tokens, a shared motion system, an elevation pass over every surface, a first-run walkthrough, celebration moments, and a visual QA gate.

**Architecture:** Presentation layer only. Two committed design documents are BINDING for every task: `docs/design/2026-07-06-theme-decision.md` (tokens, elevation ladder, type scale, mentor's-voice signature) and `docs/design/2026-07-06-motion-guidelines.md` (registers, primitives, what animates/never animates). Implementers read both before touching anything. Shared primitives centralize the system (`components/ui/*`, `components/motion/*`); surface tasks compose them.

**Tech Stack:** Tailwind + shadcn/Radix (existing), Framer Motion (already a dependency — the ONLY animation runtime), canvas-confetti (sanctioned ~2KB exception), Onborda or driver.js for the walkthrough (Task 11 evaluates).

**Brief:** `docs/superpowers/specs/2026-07-06-plan4-ui-overhaul-brief.md`

## Global Constraints

- Read BOTH design docs before implementing any task; their values are law.
- Presentation only. NEVER modify: `lib/lifemodel/*`, `lib/coach/context.ts` logic, `lib/coach/extraction-client.ts`, `app/api/*` service logic, Firestore modules, `evals/*`, form submission logic. Page/component markup, classNames, and layout are the scope.
- After every task: `npx tsc --noEmit`, `npx vitest run` (38 tests), `npm run build` all green before commit.
- Semantic tokens only in components — never raw scale values (`oat-*`, `coffee-*`) in new/edited code except in `globals.css`/`tailwind.config.js` themselves.
- Only `opacity`/`transform` animate; everything respects `prefers-reduced-motion` via the global `MotionConfig` (Task 3) — no per-component media queries needed, but no animation may bypass Framer Motion except CSS transitions ≤180ms on shadow/color.
- Mobile-first: build/check at 375px before widening. Touch targets ≥44px. Visible focus states everywhere.
- Surface tasks verify in a live browser and capture before/after screenshots to `docs/design/screenshots/<task>/` (dev server ok for surface tasks; final QA uses prod build).
- Test account: `phase2test@thriveai.dev` / `TestPass123!`. Do not create accounts.
- Windows: quote `(app)` paths in git commands; no bash-isms in npm scripts.

---

### Task 1: Dependency purge + bundle baseline

**Files:** `package.json`, `next.config.js`, delete `types/maath.d.ts` + `types/three-elements.d.ts`

- [ ] Record baseline: `npm run build` and save the route table + first-load JS numbers to `docs/design/bundle-baseline.md` (brief says ~518KB).
- [ ] Verify non-use before each removal: for every candidate, `grep -rn "<pkg>" app components lib --include="*.ts*"` must be empty. Candidates: `three`, `@react-three/*` (3), `three-mesh-bvh`, `maath`, `@splinetool/runtime` (devDep), `@mui/*` (4), `@emotion/*` (2), `gsap`, `@react-spring/web`, `lottie-react`, `locomotive-scroll`, `smooth-scrollbar`, `chart.js`, `react-chartjs-2`, `@heroicons/react`, `@huggingface/inference`, `node-fetch`, `buffer`, `stream-browserify`, `util`, `encoding`, `@shadcn/ui`, `smoothscroll-polyfill` if present, `tunnel-rat` if present. Any package with a real import stays — list it in the commit message.
- [ ] `npm uninstall` the verified-unused set. KEEP: `framer-motion` (upgrade: `npm install framer-motion@latest`).
- [ ] Clean `next.config.js`: remove three.js aliases, MUI `optimizePackageImports`, node polyfill fallbacks, manual `splitChunks` — anything referencing removed packages. Read the whole file first; keep unrelated config.
- [ ] Verify: tsc + vitest + build green. Append post-purge numbers to `docs/design/bundle-baseline.md`.
- [ ] Commit: `chore: purge unused dependencies, clean next.config, record bundle baseline`

### Task 2: Theme tokens + primitive audit

**Files:** `app/globals.css`, `tailwind.config.js`, every file in `components/ui/`, new `components/ui/page-header.tsx`, new `components/ui/mentor-voice.tsx`

- [ ] Apply the theme-decision token table verbatim to `globals.css`: terracotta 500/600 new values, add `--gold-500`/`--gold-50`, `--shadow-xl`, `--duration-slow`. Add the `.mentor-voice` utility (serif italic, `text-body` ink, 2px accent left rule variant + underline variant per the doc).
- [ ] Map new tokens in `tailwind.config.js` (gold, shadow-xl, duration-slow) following the existing alias pattern.
- [ ] Audit each `components/ui/*` primitive against the theme doc's states section: button (hover/focus-visible ring/active scale via CSS/disabled), card (elevation ladder: default `shadow-sm`; export an `interactive` variant with hover `shadow-md` + `-translate-y-px` transition), input/textarea (focus ring, placeholder token), tabs, skeleton (shimmer stays subtle), badge (add `gold` tone), avatar, sonner/toast styling. Fix centrally; do not touch pages yet.
- [ ] Create `PageHeader` (`eyebrow?`, `title`, `sub?`, `children?` for right-aligned actions — serif title 30px/36px per type scale) and `MentorVoice` (span with `.mentor-voice`).
- [ ] Verify: tsc/vitest/build green; dev-server spot-check `/dashboard` and `/brain` — cards show depth, nothing broken. Screenshot before/after of `/dashboard` to `docs/design/screenshots/task2/`.
- [ ] Commit: `feat(ui): evolved theme tokens, elevation ladder, primitive states, PageHeader + MentorVoice`

### Task 3: Motion primitives + app shell wiring

**Files:** new `components/motion/fade-in.tsx`, `components/motion/stagger.tsx`, `components/motion/page-transition.tsx`, modify `app/providers.tsx` (MotionConfig), `app/(app)/layout.tsx` (PageTransition)

- [ ] Implement exactly the motion-guideline primitives: `FadeIn` (opacity 0→1 + y 6→0, `--duration-slow`, standard ease, `viewport once` optional prop), `Stagger`/`StaggerItem` (40ms interval), `PageTransition` (opacity + y 4px, 180ms, keyed on pathname via `usePathname`, no exit animations).
- [ ] Wrap the app in `<MotionConfig reducedMotion="user">` in `app/providers.tsx`.
- [ ] Mount `PageTransition` inside `app/(app)/layout.tsx` around `{children}`.
- [ ] Verify: tsc/vitest/build; navigate between app pages in the browser — one clean 180ms entrance per navigation, none on in-page state changes; toggle OS reduced-motion (or DevTools emulation) and confirm entrances collapse.
- [ ] Commit: `feat(ui): motion primitives and app-shell page transitions`

### Tasks 4–10: Surface elevation passes

One task per surface, same contract each: read both design docs + the current page files; apply the theme (PageHeader on every app page, elevation ladder, mentor's-voice where specified, designed empty/loading/error states) and the correct motion register; verify at 375/768/1280 in the browser; screenshot before/after to `docs/design/screenshots/task<N>/`; tsc/vitest/build green; one commit per task.

- [ ] **Task 4 — Landing (`app/page.tsx`, `components/landing/*`).** Marketing register: orchestrated hero entrance (eyebrow → headline stagger → sub → CTA → visual), `useInView once` section reveals, stat count-up once. Type: hero to display scale (clamp 40–64px serif). This is the only surface allowed the bigger register. Commit: `feat(ui): landing elevation — orchestrated hero and section reveals`
- [ ] **Task 5 — Auth (`app/auth/*`).** Single centered card at floating elevation, one FadeIn, designed input focus states inherited from Task 2, error states instant per guidelines. Commit: `feat(ui): auth surface elevation`
- [ ] **Task 6 — Onboarding (`app/onboarding/page.tsx`).** Chat bubbles get FadeIn per message; playback screen = Stagger of area cards with statuses in `MentorVoice`; ALSO fix the two deferred minors here: progress counter `Math.min(questionIndex + 1, 5)` and type the followup fetch response `as { followup: string | null }`. Seeding phase gets a calm indeterminate treatment (pulsing Sparkles is fine, transform/opacity only). Commit: `feat(ui): onboarding elevation, playback mentor-voice, counter + typing fixes`
- [ ] **Task 7 — Today (`app/(app)/today/page.tsx`).** PageHeader; prompt chips at sunken level; streak chip migrates to `gold` tokens; streak increment tick + flame pulse per guidelines; mentor reaction rendered in `MentorVoice`; logged-state card FadeIn. Commit: `feat(ui): today surface elevation — gold streak, mentor-voice reaction`
- [ ] **Task 8 — Coach (`app/(app)/coach/page.tsx`).** Message container FadeIn once (streaming text itself NEVER animated); tool-call confirmation chip gold pulse; input well sunken; header strapline in `MentorVoice`; suggested-prompt chips get designed hover/focus. Commit: `feat(ui): coach chat elevation — tool chip pulse, mentor-voice strapline`
- [ ] **Task 9 — Brain (`app/(app)/brain/page.tsx`, `components/brain/*`).** PageHeader; area cards Stagger on load; statuses + summaries in `MentorVoice`; interactive Card variant on area cards; edit-mode transitions instant (state change, not entrance); timeline rows FadeIn-stagger capped at 20; empty state per guidelines. Also swap the raw `<input>`s in area-card for the `Input` primitive (deferred P2 minor). Commit: `feat(ui): brain surface elevation — mentor-voice model, staggered areas`
- [ ] **Task 10 — Dashboard, Progress, Profile, Settings (`app/(app)/dashboard|progress|profile|settings/page.tsx`).** PageHeader everywhere; card grid stagger on dashboard; streak card uses gold; skeleton→content crossfades; empty states designed. Commit: `feat(ui): supporting surfaces elevation`

### Task 11: First-run walkthrough

**Files:** evaluate then implement; likely new `components/walkthrough/*`, edits to `(app)/layout.tsx` or the two target pages

- [ ] Evaluate Onborda (Next.js + Tailwind + Framer Motion native). Acceptance: <30KB added, works with App Router, styleable to theme tokens. If it fails, fall back to `driver.js`. Record the decision + size in the commit message. (Both are within the brief's sanctioned scope; anything else needs owner sign-off.)
- [ ] Two tours: `/today` (3 steps: prompts → entry → streak) and `/brain` (3 steps: profile → area card editing → timeline). Copy in the mentor's register — plain, warm, no exclamation marks.
- [ ] First visit only: `localStorage` keys `walkthrough.today.done` / `walkthrough.brain.done`; dismiss = done; never reshown. Reduced-motion: tours appear without transitions.
- [ ] Verify in browser both tours + persistence + mobile layout; tsc/vitest/build. Commit: `feat(ui): first-run walkthroughs for today and brain`

### Task 12: Celebration moments

**Files:** new `lib/celebrate.ts` (confetti wrapper honoring reduced motion + milestone guard), edits to `app/(app)/today/page.tsx`, `app/onboarding/page.tsx`

- [ ] `npm install canvas-confetti` + `@types/canvas-confetti` (the sanctioned exception; note size in commit).
- [ ] `celebrate(kind: 'streak' | 'onboarding')`: warm palette particles (gold/sienna/moss from tokens), 800ms, no-op under reduced motion (check `matchMedia`), localStorage guard `celebrate.<kind>.<date|milestone>` per the guidelines.
- [ ] Fire on streak milestones (3, 7, 14, 30, then every 30) after check-in submit; on onboarding playback reveal. Reduced-motion fallback: static gold highlight (guidelines).
- [ ] Verify in browser (temporarily lower the milestone threshold locally to test, then restore); tsc/vitest/build. Commit: `feat(ui): celebration moments for streak milestones and onboarding`

### Task 13: Visual QA gate (final, required)

- [ ] Build + run production: `npm run build && npm start` (port 3100 config exists).
- [ ] Execute the checklist from the brief against prod: every surface at 375/768/1280; loading/empty/error/overflow states; keyboard focus order + visible rings on the main flows (auth → onboarding → today → coach → brain); reduced-motion pass; no font-load layout shift, no scrollbar jank, no FOUC. Screenshot every surface at every width to `docs/design/screenshots/qa/`.
- [ ] Log every defect found in `docs/design/qa-findings.md`, fix all of them, re-run the checklist until a clean pass. Record final bundle numbers next to the Task 1 baseline.
- [ ] Commit: `chore: visual QA gate — findings fixed, screenshots, final bundle comparison`

## Out of scope

Dark mode build-out, PWA/notifications, new features, any backend/AI change.
