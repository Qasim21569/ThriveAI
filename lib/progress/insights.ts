/**
 * Pure helper functions for the Progress page.
 * All date comparisons use UTC calendar days for determinism,
 * consistent with computeStreak in lib/checkins/streak.ts.
 */

import type { LifeModel, LifeAreaId } from '@/lib/lifemodel/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface Heatmap {
  weeks: HeatmapDay[][];
}

export interface WeeklyInsight {
  thisWeek: number;
  lastWeek: number;
  text: string;
}

export interface GoalAreaStats {
  area: LifeAreaId;
  done: number;
  total: number;
  active: string[];
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/** Parse a date string (or ISO timestamp) to a UTC YYYY-MM-DD string. */
function toUTCDay(dateStr: string): string {
  return dateStr.slice(0, 10);
}

/** Return a new Date at the UTC start of the given YYYY-MM-DD string. */
function utcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** Add `n` UTC days to a Date and return YYYY-MM-DD. */
function addUTCDays(date: Date, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Return the YYYY-MM-DD of the most recent Monday on or before `day`. */
function startOfUTCWeek(day: string): string {
  const d = utcDate(day);
  // getUTCDay() → 0=Sun … 6=Sat; adjust so Mon=0
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// buildHeatmap
// ---------------------------------------------------------------------------

/**
 * Build a 12-week activity heatmap.
 *
 * @param checkinDates - Array of ISO date strings (or YYYY-MM-DD). May contain
 *   timestamps with times; only the UTC date portion is used.
 * @param today - YYYY-MM-DD representing "today" (UTC).
 * @param weeks - Number of weeks to include (default 12).
 * @returns An object with a `weeks` array. Each element is a 7-element array
 *   of `{ date, count }` objects representing Mon … Sun. Weeks are ordered
 *   oldest-first; the last week contains `today`.
 */
export function buildHeatmap(
  checkinDates: string[],
  today: string,
  weeks = 12,
): Heatmap {
  // Count occurrences per UTC day
  const countsByDay = new Map<string, number>();
  for (const d of checkinDates) {
    const key = toUTCDay(d);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  // The heatmap ends at the Sunday that contains `today` (or today itself if
  // it is Sunday). We include the partial current week.
  const todayDate = utcDate(today);
  const startOfThisWeek = startOfUTCWeek(today);
  const startOfThisWeekDate = utcDate(startOfThisWeek);

  // First day of the grid = `weeks - 1` complete weeks before this week
  const gridStart = new Date(startOfThisWeekDate);
  gridStart.setUTCDate(gridStart.getUTCDate() - (weeks - 1) * 7);
  const gridStartDay = gridStart.toISOString().slice(0, 10);

  const result: HeatmapDay[][] = [];

  for (let w = 0; w < weeks; w++) {
    const week: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + d;
      const dayStr = addUTCDays(utcDate(gridStartDay), dayOffset);
      // Don't include future days beyond today
      const isFuture = utcDate(dayStr) > todayDate;
      week.push({
        date: dayStr,
        count: isFuture ? 0 : (countsByDay.get(dayStr) ?? 0),
      });
    }
    result.push(week);
  }

  return { weeks: result };
}

// ---------------------------------------------------------------------------
// weeklyInsight
// ---------------------------------------------------------------------------

/**
 * Compute this-week and last-week check-in counts (Mon-start weeks, UTC),
 * and generate a motivating insight sentence.
 *
 * Rules:
 * - No em dashes anywhere in the output text.
 * - Rising (thisWeek > lastWeek and lastWeek > 0): positive reinforcement.
 * - Flat (thisWeek === lastWeek and both > 0): keep the rhythm message.
 * - Falling (thisWeek < lastWeek and thisWeek >= 0 and lastWeek > 0): gentle restart nudge.
 * - Empty start (lastWeek === 0, thisWeek === 0): first-week invitation.
 * - Only this week (lastWeek === 0, thisWeek > 0): celebrate the start.
 */
export function weeklyInsight(checkinDates: string[], today: string): WeeklyInsight {
  const thisWeekStart = startOfUTCWeek(today);
  const lastWeekStart = addUTCDays(utcDate(thisWeekStart), -7);
  const thisWeekStartDate = utcDate(thisWeekStart);
  const lastWeekStartDate = utcDate(lastWeekStart);
  const todayDate = utcDate(today);

  let thisWeek = 0;
  let lastWeek = 0;

  for (const d of checkinDates) {
    const day = utcDate(toUTCDay(d));
    if (day >= thisWeekStartDate && day <= todayDate) {
      thisWeek++;
    } else if (day >= lastWeekStartDate && day < thisWeekStartDate) {
      lastWeek++;
    }
  }

  // Deduplicate: count unique days (same as streak logic)
  const thisWeekDays = new Set<string>();
  const lastWeekDays = new Set<string>();
  for (const d of checkinDates) {
    const dayStr = toUTCDay(d);
    const day = utcDate(dayStr);
    if (day >= thisWeekStartDate && day <= todayDate) {
      thisWeekDays.add(dayStr);
    } else if (day >= lastWeekStartDate && day < thisWeekStartDate) {
      lastWeekDays.add(dayStr);
    }
  }
  thisWeek = thisWeekDays.size;
  lastWeek = lastWeekDays.size;

  let text: string;

  if (lastWeek === 0 && thisWeek === 0) {
    text = 'No check-ins yet this week. Today is a great day to start the habit.';
  } else if (lastWeek === 0 && thisWeek > 0) {
    text =
      thisWeek === 1
        ? 'First check-in of the week logged. The habit starts here.'
        : `${thisWeek} check-ins already this week. A strong start worth building on.`;
  } else if (thisWeek > lastWeek) {
    text = `${thisWeek} check-ins this week, up from ${lastWeek} last week. The habit is taking hold.`;
  } else if (thisWeek === lastWeek) {
    text = `${thisWeek} check-in${thisWeek === 1 ? '' : 's'} this week, matching last week. Steady consistency is the foundation.`;
  } else {
    // falling
    text = `${thisWeek} this week after ${lastWeek} last week. One check-in today restarts the rhythm.`;
  }

  return { thisWeek, lastWeek, text };
}

// ---------------------------------------------------------------------------
// goalStats
// ---------------------------------------------------------------------------

/**
 * Summarise goal completion per life area, excluding areas with zero goals
 * and goals with status 'dropped'.
 *
 * @param model - LifeModel or null (returns [] when null).
 * @returns Array of per-area stats, only for areas with at least one
 *   non-dropped goal.
 */
export function goalStats(model: LifeModel | null): GoalAreaStats[] {
  if (!model) return [];

  const results: GoalAreaStats[] = [];

  for (const [area, state] of Object.entries(model.areas) as [LifeAreaId, typeof model.areas[LifeAreaId]][]) {
    const nonDropped = state.goals.filter((g) => g.status !== 'dropped');
    if (nonDropped.length === 0) continue;

    const done = nonDropped.filter((g) => g.status === 'done').length;
    const active = nonDropped
      .filter((g) => g.status === 'active')
      .map((g) => g.text);

    results.push({
      area,
      done,
      total: nonDropped.length,
      active,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// bestStreak
// ---------------------------------------------------------------------------

/**
 * Compute the longest ever consecutive-day streak from an array of check-in
 * date strings, using UTC calendar days (consistent with computeStreak).
 *
 * @param checkinDates - Array of ISO date strings.
 * @returns Length of the longest run of consecutive UTC days.
 */
export function bestStreak(checkinDates: string[]): number {
  if (checkinDates.length === 0) return 0;

  // Collect unique UTC days and sort ascending
  const days = Array.from(new Set(checkinDates.map(toUTCDay))).sort();

  let best = 1;
  let current = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = utcDate(days[i - 1]);
    const curr = utcDate(days[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}
