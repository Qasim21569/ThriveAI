import { describe, it, expect } from 'vitest';
import { emptyLifeModel } from '@/lib/lifemodel/types';
import { buildDailyPrompts } from '@/lib/checkins/prompts';

describe('buildDailyPrompts', () => {
  it('returns only the generic prompt for a null or empty model', () => {
    expect(buildDailyPrompts(null)).toEqual([
      'How was your day? Energy, mood, anything notable.',
    ]);
    expect(buildDailyPrompts(emptyLifeModel())).toHaveLength(1);
  });

  it('generates prompts from open threads first', () => {
    const model = emptyLifeModel();
    model.areas.career.threads.push({ id: 't1', text: 'interviewing at TCS', status: 'open' });
    model.areas.health.threads.push({ id: 't2', text: 'fixing sleep schedule', status: 'closed' });
    const prompts = buildDailyPrompts(model);
    expect(prompts[0]).toContain('interviewing at TCS');
    expect(prompts.join(' ')).not.toContain('fixing sleep schedule'); // closed threads excluded
    expect(prompts[prompts.length - 1]).toContain('How was your day');
  });

  it('falls back to active goals when fewer than two open threads', () => {
    const model = emptyLifeModel();
    model.areas.financial.goals.push({ id: 'g1', text: 'Save 50k', targetDate: null, status: 'active' });
    const prompts = buildDailyPrompts(model);
    expect(prompts[0]).toContain('Save 50k');
  });

  it('caps at three prompts', () => {
    const model = emptyLifeModel();
    for (let i = 0; i < 5; i++) {
      model.areas.career.threads.push({ id: `t${i}`, text: `thread ${i}`, status: 'open' });
    }
    expect(buildDailyPrompts(model)).toHaveLength(3);
  });
});
