# Visual QA Gate — Findings Log (Plan 4, Task 13)

Executed against the production build (`npx next start -p 3100`).

## Automated / code-level pass (controller)

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | All 12 key routes return 200 on prod build | — | ✅ pass |
| 2 | Fonts load with `display=swap` (no invisible-text FOUC) | — | ✅ pass |
| 3 | Reduced motion: global `MotionConfig reducedMotion="user"`, walkthrough card `duration: 0`, confetti double-guarded | — | ✅ pass |
| 4 | App-nav links (desktop + mobile) had no focus-visible rings | Important | ✅ fixed (this commit) |
| 5 | Profile modal scrim uses raw `bg-ink-900/40` (no semantic scrim token exists) | Minor | deferred — add `--scrim` token when dark mode lands |
| 6 | Landing CTA section uses raw `bg-coffee-700`/`text-coffee-100` (pre-existing, intentional dark panel) | Minor | deferred — acceptable as a deliberate inverted panel |
| 7 | Reduced-motion celebration fallback is a no-op, not the guidelines' static gold highlight (chip is already gold by default) | Minor | deferred |
| 8 | Bundle: 518 kB → 84.5 kB shared first-load; heaviest route /today 271 kB total | — | ✅ recorded |

## Human visual pass (owner)

Checklist executed by the owner on the prod server at http://localhost:3100 —
results to be appended below. Surfaces × widths (375 / 768 / 1280):
landing, auth ×3, onboarding (fresh account or cleared localStorage), today
(incl. walkthrough + a milestone celebration), coach (streaming + tool chip),
brain (walkthrough, edit round-trip), dashboard, progress, profile (delete
modal), settings. States: loading, empty, error, long-content overflow.
Keyboard-only pass on auth → today → brain. OS reduced-motion pass.

### Owner findings

- (append here)
