# Plan 4b: UI Overhaul v2 — Owner Revision Round

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Owner rejected v1's restraint after visual review: theme shift too subtle, fonts unchanged, landing fails to explain the product, no pre-interview orientation. This plan supersedes the v1 theme decision's palette/type sections; elevation ladder, motion system, mentor-voice device, and all v1 structural work REMAIN.

**Direction (owner-decided):** SaaS-neutral light + dark mode (class strategy); Inter UI/body + Instrument Serif display & mentor-voice; explain-the-product landing; 3-screen welcome flow before the interview.

## Global Constraints

Same as Plan 4 (presentation-only, semantic tokens only, tsc/vitest/build green per task, motion rules unchanged) PLUS: every surface must work in BOTH themes — no light-only hardcodes; dark values live under `.dark` in globals.css only.

---

### Task V1: Theme v2 tokens + fonts + dark mode foundation

**Files:** `app/globals.css`, `tailwind.config.js` (`darkMode: 'class'`), `app/layout.tsx` (font links + no-FOUC theme script), new `components/ui/theme-toggle.tsx`, `components/app/app-nav.tsx` + `components/landing/navbar.tsx` (mount toggle)

Light scale (stone-family, warm-tinted neutral; RGB triples, same var names remapped):
- `--background` 250 250 249 · `--surface`/`--card` 255 255 255 · `--surface-sunken` 245 245 244 · `--surface-raised` 255 255 255
- `--border` 231 229 228 · `--border-strong` 214 211 209 · `--input` 214 211 209
- `--foreground` 28 25 23 · `--text-body` 68 64 60 · `--text-muted` 120 113 108 · `--text-placeholder` 168 162 158
- `--primary` 28 25 23 (ink-primary buttons — the modern SaaS move) · hover 41 37 36 · `--primary-foreground` 250 250 249 · `--primary-soft` 245 245 244
- `--accent` (ember) 194 87 27 · hover 166 70 20 · `--accent-soft` 251 240 233 · `--ring` = accent
- `--gold-500` 178 128 26 (keep, streaks) · success/warning/destructive keep current hues (they already read neutral-compatible)

Dark overrides (`.dark { … }`): bg 19 17 16 · surface/card 28 25 23 · sunken 15 14 13 · raised 35 31 30 · border 46 42 40 · strong 64 58 55 · foreground 245 245 244 · body 214 211 209 · muted 168 162 158 · placeholder 120 113 108 · primary 245 245 244 / fg 19 17 16 · accent 232 130 58 · accent-soft 51 32 20 · gold-50 dark 45 36 16 · shadows: raise opacity ~1.5× (shadows barely read on dark — verify visually).

Fonts: `--font-sans` → Inter; `--font-serif` → "Instrument Serif" (display + italic; it is 400-only — headings drop `font-weight: 600`, size/tracking carry hierarchy; audit `.ds-display`, h1-h3 base rule, PageHeader, mentor-voice). Google Fonts link replaces Plex/Source Serif line (keep Plex Mono for eyebrows — it still fits).

Theme boot: inline `<script>` in layout `<head>` reading `localStorage.theme` ?? `prefers-color-scheme`, setting `document.documentElement.classList` BEFORE paint (no-FOUC). `ThemeToggle` (sun/moon lucide, 44px target, aria-label) writes localStorage + toggles class; mounted in app-nav (desktop right of nav links + mobile menu) and landing navbar.

Verify: build green; BOTH themes render on /dashboard (screenshot each).

### Task V2: Dark-mode hardcode sweep

**Files:** any component/page with light-only values
Grep for: `bg-white`, `text-white`, raw scale classes (`coffee-`, `oat-`, `ink-900/40` scrim in profile modal → introduce `--scrim` token 0 0 0 light / 0 0 0 dark with alpha), landing CTA `bg-coffee-700` panel → token-based inverted panel that works both themes (`bg-foreground text-background` is the clean SaaS pattern). Fix every hit to semantic tokens. Verify each app surface in dark via browser.

### Task V3: Landing rework — explain the product

**Files:** `components/landing/*`, `app/page.tsx`
Narrative structure (mobile-first): (1) Hero — one-line what-it-is: "Your AI mentor. It remembers everything you tell it." + one-line how + single CTA; keep the orchestrated entrance. (2) NEW "How it works" — 3 numbered steps (real sequence, numbering earns its place): 5-minute interview → 2-minute daily check-ins → a mentor whose advice compounds because it remembers. (3) Product mock section — stylized Brain-page card + chat exchange demonstrating recall (build as HTML/CSS mock with real components, not screenshots). (4) Features trimmed to 3 (memory, whole-life view, accountability). (5) CTA. Delete/merge anything not serving the 30-second-stranger test.

### Task V4: Welcome flow before the interview

**Files:** `app/onboarding/page.tsx` (new pre-interview phase), no new routes
New phase `'welcome'` before `'interview'`: 3 swipeable/steppable cards — (1) what ThriveAI is (mentor + memory), (2) how the brain works (you talk, it remembers, you can inspect/correct everything on the Brain page — trust message), (3) what happens next (5 questions, ~5 minutes, skippable). "Let's go" → interview; "Skip everything" → /today. Stagger entrance, Instrument Serif headings, progress dots. Interview logic untouched.

### Task V5: QA gate v2

Re-run the Task 13 automated pass in BOTH themes + owner visual pass + final bundle numbers + update docs/design/2026-07-06-theme-decision.md with a "v2 (shipped)" section superseding the palette/type tables.
