import { describe, it, expect } from 'vitest';
import { stripEmptyOptionals } from '@/app/api/coach/extract/service';

describe('stripEmptyOptionals', () => {
  it('drops empty-string status/summary on areas', () => {
    const out = stripEmptyOptionals({
      areas: [{ area: 'career', status: '', summary: '  ' }],
    }) as { areas: Record<string, unknown>[] };
    expect(out.areas[0]).not.toHaveProperty('status');
    expect(out.areas[0]).not.toHaveProperty('summary');
  });

  it('filters empty strings out of addThreads and empty-text goals out of addGoals', () => {
    const out = stripEmptyOptionals({
      areas: [
        {
          area: 'career',
          addThreads: ['real thread', '', '  '],
          addGoals: [{ text: 'real goal', targetDate: null }, { text: '', targetDate: null }],
        },
      ],
    }) as { areas: { addThreads: string[]; addGoals: { text: string }[] }[] };
    expect(out.areas[0].addThreads).toEqual(['real thread']);
    expect(out.areas[0].addGoals).toEqual([{ text: 'real goal', targetDate: null }]);
  });

  it('filters events with empty content and drops an all-empty profile', () => {
    const out = stripEmptyOptionals({
      events: [{ area: 'career', type: 'fact', content: '' }],
      profile: { identity: '', personality: ' ' },
    }) as Record<string, unknown>;
    expect(out.events).toEqual([]);
    expect(out).not.toHaveProperty('profile');
  });

  it('passes through non-object input unchanged', () => {
    expect(stripEmptyOptionals(null)).toBe(null);
    expect(stripEmptyOptionals('x')).toBe('x');
  });
});
