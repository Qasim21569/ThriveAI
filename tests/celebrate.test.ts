import { describe, it, expect } from 'vitest';
import { isStreakMilestone } from '@/lib/celebrate';

describe('isStreakMilestone', () => {
  it('is false below the first milestone', () => {
    expect(isStreakMilestone(1)).toBe(false);
    expect(isStreakMilestone(2)).toBe(false);
  });

  it('fires on 3, 7, 14, 30 and every 30 after', () => {
    for (const n of [3, 7, 14, 30, 60, 90]) {
      expect(isStreakMilestone(n)).toBe(true);
    }
  });

  it('is false between milestones', () => {
    for (const n of [4, 10, 15, 29, 31, 45, 59]) {
      expect(isStreakMilestone(n)).toBe(false);
    }
  });
});
