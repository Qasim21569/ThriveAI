import { describe, it, expect } from 'vitest';
import { extractionDiffSchema } from '@/lib/lifemodel/extraction';

describe('extractionDiffSchema', () => {
  it('parses a full valid diff', () => {
    const result = extractionDiffSchema.safeParse({
      events: [{ area: 'career', type: 'milestone', content: 'Got an interview at TCS' }],
      areas: [
        {
          area: 'career',
          status: 'Actively job hunting, one interview scheduled.',
          addThreads: ['interviewing at TCS'],
          addGoals: [{ text: 'Land a frontend job', targetDate: '2026-09-01' }],
        },
      ],
      profile: { coachingStyle: 'Prefers direct, no-fluff feedback' },
    });
    expect(result.success).toBe(true);
  });

  it('defaults events and areas to empty arrays when the model returns {}', () => {
    const result = extractionDiffSchema.parse({});
    expect(result.events).toEqual([]);
    expect(result.areas).toEqual([]);
  });

  it('rejects unknown area names', () => {
    const result = extractionDiffSchema.safeParse({
      events: [{ area: 'hobbies', type: 'fact', content: 'x' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects event content over 300 chars', () => {
    const result = extractionDiffSchema.safeParse({
      events: [{ area: 'career', type: 'fact', content: 'x'.repeat(301) }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts goals with null targetDate', () => {
    const result = extractionDiffSchema.safeParse({
      areas: [{ area: 'financial', addGoals: [{ text: 'Save 50k', targetDate: null }] }],
    });
    expect(result.success).toBe(true);
  });
});
