# Theme Decision — ThriveAI UI Overhaul (Plan 4, Workstream 0)

**Status:** Decided. All Plan 4 visual work derives from this document.

## The identity in one line

A well-kept field journal with a mentor's handwriting in it: warm paper, confident
serif, real depth — and everything the mentor knows about you written in its own
recognizable voice.

## What we keep, verbatim

The token *architecture* (raw scales → semantic aliases), the warm family (oat paper,
coffee primary, espresso ink), IBM Plex Sans body + Source Serif 4 display + IBM Plex
Mono eyebrows, warm-tinted shadows, the no-pure-white/black rule. The brief mandates the
emotional family; the existing system is well-built. We change values surgically and
change *application* aggressively.

## Self-critique (why this isn't the AI-default cream template)

Cream + serif + terracotta is today's most common AI-generated look. The brief pins the
family, so differentiation cannot come from abandoning warmth. It comes from four things
the template never has:

1. **The mentor's voice** — a signature typographic device (below) that encodes the
   product's core promise (it knows you) into the type system itself.
2. **Disciplined depth** — a strict 4-level elevation ladder actually applied, replacing
   flat same-value cards.
3. **Type confidence** — the serif used large and deliberate at every page head, not
   timidly at 24px.
4. **Motion character** — one consistent, restrained language (see motion guidelines)
   instead of the template's scattered hover effects.

## Surgical token changes (`app/globals.css`)

| Token | From | To | Why |
|---|---|---|---|
| `--terracotta-500` | `192 105 63` | `176 88 48` | Deeper sienna — less pastel, more grounded; survives 4.5:1 contrast on oat as text at 18px+ |
| `--terracotta-600` | `169 84 46` | `150 70 38` | Hover step follows |
| `--gold-500` (new) | — | `178 128 26` | Streaks + celebration hue, distinct from `--warning` (status) and `--accent` (interaction) |
| `--gold-50` (new) | — | `246 237 214` | Soft fill for streak chips |
| `--shadow-xl` (new) | — | `0 20px 48px rgba(58,42,26,0.12), 0 4px 12px rgba(58,42,26,0.06)` | Dialogs/floating layers — the ladder needs a top rung |
| `--duration-slow` (new) | — | `280ms` | Entrances/reveals (base 180ms is for state changes) |

Everything else keeps its current value. Streak UI migrates from `accent` to `gold`.

## The elevation ladder (application rule, enforced in primitives)

| Level | Surface | Shadow | Used for |
|---|---|---|---|
| −1 sunken | `surface-sunken` | none | wells, chat input area, prompt chips |
| 0 base | `background` | none | page canvas |
| 1 raised | `card`/`surface` | `shadow-sm`, hover `shadow-md` + 1px translate-up on interactive cards | all cards |
| 2 floating | `popover` | `shadow-xl` | dialogs, dropdowns, toasts |

Rule: borders define shape, shadows define height. A surface never gets a stronger
border to fake elevation.

## Type scale (applied, not just available)

- **Display (landing hero):** serif 600, clamp(40px, 7vw, 64px), −0.02em
- **Page title (every app page):** serif 600, 30px mobile / 36px desktop, −0.015em —
  standardized via a shared `PageHeader` pattern (eyebrow + title + optional sub)
- **Card title:** sans 600 15px; **Body:** sans 400 14–15px/1.6; **Eyebrow:** existing
  `.ds-label` mono treatment (kept — it is already distinctive)

## Signature device: the mentor's voice

Everything the AI *knows or says about the user* is set in one recognizable style —
serif, italic, ink-700, with a 2px `accent`-tinted left rule or underline depending on
context. Applied to: area statuses on `/brain`, onboarding playback lines, the mentor
reaction on `/today`, and the "knows your goals…" strapline in chat. Implemented once as
a `.mentor-voice` utility class in `globals.css` + a `<MentorVoice>` span component.
This is the one element a user should remember: *when it's about you, it's in the
mentor's hand.*

## Focus & states (primitives pass)

Every interactive primitive gets designed hover / focus-visible (2px `ring` offset ring)
/ active (scale 0.98 where tactile) / disabled (50% + no shadow) states. Touch targets
≥44px on mobile. No browser-default focus outlines anywhere.

## Dark mode

Deferred (brief: optional). The alias architecture reserves space — no light-only
hardcodes may be introduced (use semantic tokens only, never raw oat values in
components).

---

## v2 (shipped 2026-07-06) — supersedes the palette/type tables above

Owner rejected v1's restraint after visual review. Shipped direction:
- **Palette:** SaaS-neutral stone family — near-white warm-gray light theme + full dark mode (class strategy, no-FOUC boot script, toggle in both navbars). Ink-primary buttons; single ember accent (194 87 27); gold retained for streaks; new --scrim token.
- **Type:** Inter (UI/body) + Instrument Serif 400-only (display + mentor-voice italic; size/tracking carry hierarchy, never weight). Plex Mono eyebrows retained.
- **Landing:** explain-the-product narrative (hero one-liner, 3-step how-it-works, HTML product mock, 3 features, inverted CTA panel).
- **Onboarding:** 3-screen welcome flow precedes the interview.
- Elevation ladder, motion system, and the mentor's-voice signature device carry over from v1 unchanged.
