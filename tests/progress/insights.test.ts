import { describe, it, expect } from 'vitest';
import {
  buildHeatmap,
  weeklyInsight,
  goalStats,
  bestStreak,
} from '@/lib/progress/insights';
import { emptyLifeModel } from '@/lib/lifemodel/types';
import type { LifeModel } from '@/lib/lifemodel/types';

// ─────────────────────────────────────────────────────────────────────────────
// buildHeatmap
// ─────────────────────────────────────────────────────────────────────────────

describe('buildHeatmap', () => {
  const TODAY = '2026-07-06'; // Monday

  it('returns exactly `weeks` weeks', () => {
    const { weeks } = buildHeatmap([], TODAY);
    expect(weeks).toHaveLength(12);
  });

  it('each week has exactly 7 days', () => {
    const { weeks } = buildHeatmap([], TODAY);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('last week ends on or after today (today is Monday = first day of last week)', () => {
    const { weeks } = buildHeatmap([], TODAY);
    const lastWeek = weeks[weeks.length - 1];
    // Today (2026-07-06) is Monday, so it's the first day of the last week column
    expect(lastWeek[0].date).toBe(TODAY);
  });

  it('first day of grid is 11 complete weeks before the Monday that contains today', () => {
    const { weeks } = buildHeatmap([], TODAY);
    // Today is 2026-07-06 (Mon). Grid = 12 weeks total, so starts 11 weeks back.
    // 2026-07-06 - 77 days = 2026-04-20 (Mon).
    expect(weeks[0][0].date).toBe('2026-04-20');
  });

  it('counts check-ins per UTC day correctly', () => {
    const dates = [
      '2026-07-06T08:00:00Z',
      '2026-07-06T20:00:00Z', // same day, count = 2
      '2026-07-05T12:00:00Z', // yesterday, count = 1
    ];
    const { weeks } = buildHeatmap(dates, TODAY);
    const lastWeek = weeks[weeks.length - 1];
    // Mon = index 0 → 2026-07-06
    expect(lastWeek[0].date).toBe('2026-07-06');
    expect(lastWeek[0].count).toBe(2);
    // The previous week (index 11 - 1 = 10) should have Sunday (index 6) = 2026-07-05
    const secondLastWeek = weeks[weeks.length - 2];
    expect(secondLastWeek[6].date).toBe('2026-07-05');
    expect(secondLastWeek[6].count).toBe(1);
  });

  it('future days in the last week have count 0 (today is Monday, Tue-Sun are future)', () => {
    const { weeks } = buildHeatmap([], TODAY);
    const lastWeek = weeks[weeks.length - 1];
    // Tue through Sun are future from today (Mon)
    for (let i = 1; i < 7; i++) {
      expect(lastWeek[i].count).toBe(0);
    }
  });

  it('returns all zeros for empty input', () => {
    const { weeks } = buildHeatmap([], TODAY);
    for (const week of weeks) {
      for (const day of week) {
        expect(day.count).toBe(0);
      }
    }
  });

  it('handles non-Monday today: grid aligns to Mon-start', () => {
    const wednesday = '2026-07-08'; // Wednesday
    const { weeks } = buildHeatmap([], wednesday);
    const lastWeek = weeks[weeks.length - 1];
    // Last week starts on the Monday 2026-07-06
    expect(lastWeek[0].date).toBe('2026-07-06');
    // Wednesday is at index 2
    expect(lastWeek[2].date).toBe('2026-07-08');
    // Thursday through Sunday are future, count 0
    for (let i = 3; i < 7; i++) {
      expect(lastWeek[i].count).toBe(0);
    }
  });

  it('respects custom weeks parameter', () => {
    const { weeks } = buildHeatmap([], TODAY, 4);
    expect(weeks).toHaveLength(4);
  });

  it('check-in before grid window is not counted', () => {
    // Before 2026-04-20 (grid start) - outside 12-week window
    const oldDate = '2026-04-19T10:00:00Z'; // one day before grid start
    const { weeks } = buildHeatmap([oldDate], TODAY);
    const total = weeks.flat().reduce((s, d) => s + d.count, 0);
    expect(total).toBe(0);
  });

  it('check-in exactly on grid start date is counted', () => {
    // Grid starts 2026-04-20 (11 weeks back from Mon 2026-07-06)
    const gridStart = '2026-04-20T10:00:00Z';
    const { weeks } = buildHeatmap([gridStart], TODAY);
    expect(weeks[0][0].date).toBe('2026-04-20');
    expect(weeks[0][0].count).toBe(1);
  });

  it('week boundary: week columns are Mon-Sun order', () => {
    // 2026-07-06 is Monday. Previous week Mon=2026-06-29 … Sun=2026-07-05
    const { weeks } = buildHeatmap([], TODAY);
    const secondLastWeek = weeks[weeks.length - 2];
    expect(secondLastWeek[0].date).toBe('2026-06-29'); // Mon
    expect(secondLastWeek[6].date).toBe('2026-07-05'); // Sun
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// weeklyInsight
// ─────────────────────────────────────────────────────────────────────────────

describe('weeklyInsight', () => {
  // 2026-07-06 is a Monday (start of week)
  const TODAY = '2026-07-06';

  it('returns zero counts and empty-start text when no check-ins', () => {
    const result = weeklyInsight([], TODAY);
    expect(result.thisWeek).toBe(0);
    expect(result.lastWeek).toBe(0);
    expect(result.text).not.toContain('—');
    expect(result.text.toLowerCase()).toMatch(/check-in|start|habit/);
  });

  it('counts only check-ins in the current week', () => {
    const dates = ['2026-07-06T08:00:00Z', '2026-07-07T10:00:00Z'];
    const result = weeklyInsight(dates, '2026-07-07'); // Tuesday
    expect(result.thisWeek).toBe(2);
    expect(result.lastWeek).toBe(0);
  });

  it('counts only check-ins in last week', () => {
    const dates = ['2026-06-29T08:00:00Z', '2026-06-30T09:00:00Z'];
    const result = weeklyInsight(dates, TODAY);
    expect(result.thisWeek).toBe(0);
    expect(result.lastWeek).toBe(2);
  });

  it('deduplicates multiple check-ins on the same day', () => {
    const dates = [
      '2026-07-06T08:00:00Z',
      '2026-07-06T20:00:00Z', // same day as above
    ];
    const result = weeklyInsight(dates, TODAY);
    expect(result.thisWeek).toBe(1); // deduplicated
  });

  it('rising insight: thisWeek > lastWeek', () => {
    const dates = [
      '2026-06-29T10:00:00Z', // last week: 1 day
      '2026-07-06T10:00:00Z',
      '2026-07-07T10:00:00Z',
      '2026-07-08T10:00:00Z', // this week: 3 days
    ];
    const result = weeklyInsight(dates, '2026-07-08'); // Wednesday
    expect(result.thisWeek).toBe(3);
    expect(result.lastWeek).toBe(1);
    expect(result.text).toMatch(/up from/i);
    expect(result.text).not.toContain('—');
  });

  it('flat insight: thisWeek === lastWeek (both > 0)', () => {
    const dates = [
      '2026-06-29T10:00:00Z',
      '2026-06-30T10:00:00Z', // last week: 2
      '2026-07-06T10:00:00Z',
      '2026-07-07T10:00:00Z', // this week: 2
    ];
    const result = weeklyInsight(dates, '2026-07-07'); // Tuesday
    expect(result.thisWeek).toBe(2);
    expect(result.lastWeek).toBe(2);
    expect(result.text).toMatch(/match|steady|consistent/i);
    expect(result.text).not.toContain('—');
  });

  it('falling insight: thisWeek < lastWeek', () => {
    const dates = [
      '2026-06-29T10:00:00Z',
      '2026-06-30T10:00:00Z',
      '2026-07-01T10:00:00Z',
      '2026-07-02T10:00:00Z',
      '2026-07-03T10:00:00Z', // last week: 5
      '2026-07-06T10:00:00Z', // this week: 1
    ];
    const result = weeklyInsight(dates, TODAY);
    expect(result.lastWeek).toBe(5);
    expect(result.thisWeek).toBe(1);
    expect(result.text).toMatch(/after|restart|rhythm/i);
    expect(result.text).not.toContain('—');
  });

  it('only this week (lastWeek === 0, thisWeek > 0): celebrate start', () => {
    const dates = ['2026-07-06T10:00:00Z'];
    const result = weeklyInsight(dates, TODAY);
    expect(result.thisWeek).toBe(1);
    expect(result.lastWeek).toBe(0);
    expect(result.text).toMatch(/start|first|habit/i);
    expect(result.text).not.toContain('—');
  });

  it('no em dashes in any variant', () => {
    const scenarios = [
      [],
      ['2026-07-06T10:00:00Z'],
      ['2026-06-29T10:00:00Z', '2026-07-06T10:00:00Z'],
      ['2026-06-29T10:00:00Z', '2026-06-30T10:00:00Z', '2026-07-06T10:00:00Z'],
      [
        '2026-06-29T10:00:00Z',
        '2026-06-30T10:00:00Z',
        '2026-07-01T10:00:00Z',
        '2026-07-02T10:00:00Z',
        '2026-07-06T10:00:00Z',
        '2026-07-07T10:00:00Z',
      ],
    ];
    for (const dates of scenarios) {
      const result = weeklyInsight(dates, TODAY);
      expect(result.text).not.toContain('—'); // em dash U+2014
      expect(result.text).not.toContain('–'); // en dash U+2013
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// goalStats
// ─────────────────────────────────────────────────────────────────────────────

describe('goalStats', () => {
  it('returns [] for null model', () => {
    expect(goalStats(null)).toEqual([]);
  });

  it('returns [] for a model with no goals in any area', () => {
    expect(goalStats(emptyLifeModel())).toEqual([]);
  });

  it('excludes areas where all goals are dropped', () => {
    const model = emptyLifeModel();
    model.areas.career.goals = [
      { id: '1', text: 'dropped goal', targetDate: null, status: 'dropped' },
    ];
    const result = goalStats(model);
    expect(result.find((r) => r.area === 'career')).toBeUndefined();
  });

  it('counts done and active goals, excludes dropped from totals', () => {
    const model = emptyLifeModel();
    model.areas.health.goals = [
      { id: '1', text: 'Run 5k', targetDate: null, status: 'active' },
      { id: '2', text: 'Lose 5kg', targetDate: null, status: 'done' },
      { id: '3', text: 'Old goal', targetDate: null, status: 'dropped' },
    ];
    const result = goalStats(model);
    expect(result).toHaveLength(1);
    const health = result[0];
    expect(health.area).toBe('health');
    expect(health.done).toBe(1);
    expect(health.total).toBe(2); // dropped excluded
    expect(health.active).toEqual(['Run 5k']);
  });

  it('includes only areas with at least one non-dropped goal', () => {
    const model = emptyLifeModel();
    model.areas.career.goals = [
      { id: '1', text: 'Get promoted', targetDate: null, status: 'active' },
    ];
    model.areas.mental.goals = [
      { id: '2', text: 'Meditate daily', targetDate: null, status: 'done' },
    ];
    // health, financial, social: no goals → excluded
    const result = goalStats(model);
    const areas = result.map((r) => r.area);
    expect(areas).toContain('career');
    expect(areas).toContain('mental');
    expect(areas).not.toContain('health');
    expect(areas).not.toContain('financial');
    expect(areas).not.toContain('social');
  });

  it('active list contains only active goal texts', () => {
    const model = emptyLifeModel();
    model.areas.financial.goals = [
      { id: '1', text: 'Save 10k', targetDate: null, status: 'active' },
      { id: '2', text: 'Pay off debt', targetDate: null, status: 'active' },
      { id: '3', text: 'Budget review', targetDate: null, status: 'done' },
    ];
    const result = goalStats(model);
    const fin = result.find((r) => r.area === 'financial')!;
    expect(fin.active).toEqual(['Save 10k', 'Pay off debt']);
    expect(fin.done).toBe(1);
    expect(fin.total).toBe(3);
  });

  it('all done goals: active list is empty', () => {
    const model = emptyLifeModel();
    model.areas.social.goals = [
      { id: '1', text: 'Make a friend', targetDate: null, status: 'done' },
    ];
    const result = goalStats(model);
    const soc = result.find((r) => r.area === 'social')!;
    expect(soc.active).toEqual([]);
    expect(soc.done).toBe(1);
    expect(soc.total).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// bestStreak
// ─────────────────────────────────────────────────────────────────────────────

describe('bestStreak', () => {
  it('returns 0 for empty input', () => {
    expect(bestStreak([])).toBe(0);
  });

  it('returns 1 for a single check-in', () => {
    expect(bestStreak(['2026-07-06T10:00:00Z'])).toBe(1);
  });

  it('counts consecutive days', () => {
    const dates = [
      '2026-07-01T10:00:00Z',
      '2026-07-02T10:00:00Z',
      '2026-07-03T10:00:00Z',
    ];
    expect(bestStreak(dates)).toBe(3);
  });

  it('ignores gaps between runs and returns the longest', () => {
    const dates = [
      '2026-06-01T10:00:00Z',
      '2026-06-02T10:00:00Z', // run of 2
      '2026-06-10T10:00:00Z',
      '2026-06-11T10:00:00Z',
      '2026-06-12T10:00:00Z',
      '2026-06-13T10:00:00Z', // run of 4 → best
      '2026-06-20T10:00:00Z', // isolated
    ];
    expect(bestStreak(dates)).toBe(4);
  });

  it('deduplicates multiple check-ins on the same day', () => {
    const dates = [
      '2026-07-01T08:00:00Z',
      '2026-07-01T20:00:00Z', // same day
      '2026-07-02T10:00:00Z',
    ];
    expect(bestStreak(dates)).toBe(2);
  });

  it('handles non-sorted input', () => {
    const dates = [
      '2026-07-03T10:00:00Z',
      '2026-07-01T10:00:00Z',
      '2026-07-02T10:00:00Z',
    ];
    expect(bestStreak(dates)).toBe(3);
  });

  it('a single isolated day followed by another run picks the larger', () => {
    const dates = [
      '2026-05-01T10:00:00Z', // 1
      '2026-06-01T10:00:00Z',
      '2026-06-02T10:00:00Z',
      '2026-06-03T10:00:00Z', // 3
    ];
    expect(bestStreak(dates)).toBe(3);
  });

  it('all same day gives streak of 1', () => {
    const dates = [
      '2026-07-01T08:00:00Z',
      '2026-07-01T12:00:00Z',
      '2026-07-01T20:00:00Z',
    ];
    expect(bestStreak(dates)).toBe(1);
  });
});
