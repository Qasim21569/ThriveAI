# Progress + Profile Redo — Mini Plan

> Owner request: Progress must become a motivating, in-depth analysis page; Profile must become actionable (currently read-only). Two parallel tasks, disjoint files. Standard constraints: semantic tokens both themes, motion register (one entrance/screen, Stagger sections), no em dashes in any copy, no new dependencies, tsc/vitest/build green, logic-safe.

### Task P1: Progress page redesign

**Files:** new `lib/progress/insights.ts`, new `tests/progress/insights.test.ts`, rewrite `app/(app)/progress/page.tsx`

Pure helpers (TDD):
- `buildHeatmap(checkinDates: string[], today: string, weeks?: number)` → `{ weeks: { date: string; count: number }[][] }` last 12 weeks, weeks as columns Mon-Sun, counts per day (UTC days, consistent with computeStreak).
- `weeklyInsight(checkinDates: string[], today: string)` → `{ thisWeek: number; lastWeek: number; text: string }` — text is a motivating plain sentence (no em dashes): rising ("5 check-ins this week, up from 2. The habit is taking."), flat, falling ("2 this week after 5 last week. One check-in today restarts the rhythm."), empty-start variants.
- `goalStats(model: LifeModel | null)` → per area `{ area, done, total, active: string[] }`, omitting areas with zero goals.
- `bestStreak(checkinDates: string[])` → longest historical run (reuses UTC-day logic).

Page layout (top→bottom, one Stagger): PageHeader("Progress", "The story so far") · 4 stat cards (current streak gold/Flame via computeStreak, best streak, total check-ins, active goals) · heatmap card (CSS grid, cells `bg-gold-500` opacity-stepped by count, empty `bg-surface-sunken`; weekday letters; accessible title per cell) · insight line rendered in MentorVoice · goals-per-area card (done/total bar: track `bg-surface-sunken`, fill `bg-success`; active goal texts listed) · milestones card (events where type is milestone or setback, grouped by month, milestone=gold dot, setback=muted dot, from getRecentEvents(uid, 100)) · existing check-in feed retained at bottom (cap 20). Data: getRecentCheckins(uid, 365), getLifeModel, getRecentEvents(uid, 100). Empty states per writing rules (invitations, e.g. no goals → link /coach "tell your mentor a goal").

Commit: `feat(ui): progress page redesign with streak analytics, goals, milestones`

### Task P2: Profile page redo

**Files:** rewrite `app/(app)/profile/page.tsx`, add `resetLifeModel(uid)` to `lib/firebase/lifeModel.ts` (deletes the 6 lifeModel docs and all events docs; check-ins/messages/plans untouched)

Sections (one Stagger): PageHeader("Profile", "Your account and data") ·
1. **Identity card:** avatar preview + editable display name (Input) + photo URL (Input); Save → `updateProfile(auth.currentUser, ...)`, sonner toast on success/failure.
2. **Security card:** show provider ("Signed in with Google/email") from `user.providerData[0].providerId`; for `password` provider only: current password + new password (min 6) inputs → `reauthenticateWithCredential(EmailAuthProvider.credential(email, current))` then `updatePassword`; clear inputs + toast; map Firebase error codes to plain messages.
3. **Data card:** counts (check-ins via getRecentCheckins(uid, 365).length shown as "365+" when at cap, plans via getUserPlans length, events via getRecentEvents(uid,100) length "100+" at cap) + "Reset Life Model" destructive button → floating modal (existing modal pattern with motion fades) requiring typed "reset"; calls resetLifeModel; toast; note that check-ins are kept and the brain re-learns from them.
4. **Plans card:** existing plan list + delete flow retained, restyled to Card/Badge patterns.

Commit: `feat(ui): profile redo with identity editing, security, data controls`
