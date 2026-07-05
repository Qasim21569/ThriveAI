import { describe, it, expect } from 'vitest';
import { computeStreak } from '@/lib/checkins/streak';

const T = '2026-07-05';

describe('computeStreak', () => {
  it('returns 0 with no check-ins', () => {
    expect(computeStreak([], T)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(
      computeStreak(
        ['2026-07-05T08:00:00Z', '2026-07-04T21:00:00Z', '2026-07-03T10:00:00Z'],
        T,
      ),
    ).toBe(3);
  });

  it('applies the grace rule when today has no check-in yet', () => {
    expect(computeStreak(['2026-07-04T21:00:00Z', '2026-07-03T10:00:00Z'], T)).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(computeStreak(['2026-07-05T08:00:00Z', '2026-07-03T10:00:00Z'], T)).toBe(1);
  });

  it('returns 0 when the last check-in was before yesterday', () => {
    expect(computeStreak(['2026-07-02T08:00:00Z'], T)).toBe(0);
  });

  it('counts a day once regardless of multiple check-ins', () => {
    expect(computeStreak(['2026-07-05T08:00:00Z', '2026-07-05T20:00:00Z'], T)).toBe(1);
  });
});
