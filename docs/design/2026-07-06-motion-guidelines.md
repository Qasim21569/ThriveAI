# Motion & Interaction Guidelines — ThriveAI (Plan 4, Workstream 0)

**Status:** Decided. Framer Motion is the only animation runtime. All durations/easings
reference tokens (`--duration-fast` 150ms, `--duration-base` 180ms, `--duration-slow`
280ms, `--ease-standard` cubic-bezier(0.4, 0, 0.2, 1)).

Patterns surveyed: Linear (state-change-only motion, instant nav), Notion (content
crossfades, zero decoration motion), Vercel dashboard (skeleton → content swaps, subtle
list stagger), and mobile-first consumer habit apps (single celebration moment, one
entrance per screen). The common law: **in-app motion communicates state change;
marketing motion sets tone. Never mix the two registers.**

## Global rules

1. Only `opacity` and `transform` animate. Never layout properties, never color
   transitions longer than 180ms.
2. `MotionConfig reducedMotion="user"` wraps the app — every animation collapses to an
   instant or simple fade under `prefers-reduced-motion`. Confetti renders nothing.
3. One entrance per screen. Elements inside it stagger; nothing animates twice.
4. Motion never blocks input: no pointer-events gating, no waiting for entrances.
5. Shared primitives only (`components/motion/`): `FadeIn` (fade + 6px rise, 280ms),
   `Stagger`/`StaggerItem` (40ms interval), `PageTransition` (fade + 4px rise, 180ms,
   in `(app)/layout.tsx`). Ad-hoc `motion.div`s in pages are a code smell — pages
   compose primitives.

## What animates (in-app register)

| Moment | Treatment |
|---|---|
| Page enter (app routes) | PageTransition: fade + 4px rise, 180ms. No exit animations (SSR/back-nav honesty). |
| Lists (check-ins, events, area cards) | Stagger 40ms, FadeIn per item, only on first mount |
| Card hover (interactive only) | shadow-sm → shadow-md + translateY(−1px), 150ms |
| Button press | scale 0.98, 150ms (tactile controls only — not links) |
| Skeleton → content | crossfade 200ms, no movement |
| Dialog/sheet | fade + scale 0.98→1, 180ms; overlay fade 150ms |
| Toast | slide 8px + fade, 180ms |
| Chat: streaming text | **never animated** — raw streaming is the effect; only the message container FadeIns once |
| Chat: tool-call confirmation chip | FadeIn + one 300ms gold background pulse |
| Streak increment (`/today`) | number ticks up with 200ms y-flip; flame does one 1.06 scale pulse |
| Empty states | single FadeIn, no looping/idle animation ever |

## What never animates

Text color/weight on hover (instant), focus rings (instant), form validation errors
(appear instantly — errors are information), nav active state, anything during
streaming, scroll position (no smooth-scroll hijacking), width/height of anything.

## Celebration register (used exactly twice)

1. **Streak milestones** (3, 7, 14, 30, then every 30): one confetti burst
   (`canvas-confetti`, ~2KB, the brief's sanctioned exception), warm palette particles
   (gold/sienna/moss), 800ms, fires once per milestone per day (localStorage guard).
2. **Onboarding completion** (playback screen reveal): Stagger of the area cards +
   single confetti burst. Same guard.

Under reduced motion both become a static gold highlight on the streak chip / heading.

## Marketing register (landing page only)

Hero: one orchestrated entrance — eyebrow → headline lines (60ms stagger) → sub → CTA →
hero visual, 280ms each. Sections: `useInView` reveal once (fade + 12px rise, 280ms),
`viewport={{ once: true }}` always. Stats may count up once when revealed (600ms). No
parallax, no scroll-linked pinning, no horizontal scroll sections.

## Performance gates

Entrances must not shift layout (transform-only), no animation on `> 20` items at once
(cap stagger lists), landing must not animate images before they load (animate wrappers).
