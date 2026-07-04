import { describe, it, expect } from 'vitest';
import { emptyLifeModel } from '@/lib/lifemodel/types';
import { applyDiff } from '@/lib/lifemodel/apply';
import type { ExtractionDiff } from '@/lib/lifemodel/extraction';

const NOW = '2026-07-03T12:00:00.000Z';
let counter = 0;
const makeId = () => `id-${++counter}`;

function diff(partial: Partial<ExtractionDiff>): ExtractionDiff {
  return { events: [], areas: [], ...partial };
}

describe('applyDiff', () => {
  it('does not mutate the input model', () => {
    const model = emptyLifeModel();
    applyDiff(model, diff({ areas: [{ area: 'career', status: 'Job hunting' }] }), NOW, makeId);
    expect(model.areas.career.status).toBe('');
  });

  it('updates area status and summary', () => {
    const { model } = applyDiff(
      emptyLifeModel(),
      diff({ areas: [{ area: 'career', status: 'Job hunting', summary: 'Started search in June' }] }),
      NOW,
      makeId,
    );
    expect(model.areas.career.status).toBe('Job hunting');
    expect(model.areas.career.summary).toBe('Started search in June');
    expect(model.areas.health.status).toBe(''); // untouched areas stay empty
  });

  it('adds goals as active with generated ids', () => {
    const { model } = applyDiff(
      emptyLifeModel(),
      diff({ areas: [{ area: 'financial', addGoals: [{ text: 'Save 50k', targetDate: null }] }] }),
      NOW,
      makeId,
    );
    const goal = model.areas.financial.goals[0];
    expect(goal.text).toBe('Save 50k');
    expect(goal.status).toBe('active');
    expect(goal.id).toMatch(/^id-/);
  });

  it('closes goals and threads by id, ignoring unknown ids', () => {
    const base = emptyLifeModel();
    base.areas.career.goals.push({ id: 'g1', text: 'Get job', targetDate: null, status: 'active' });
    base.areas.career.threads.push({ id: 't1', text: 'interviewing at TCS', status: 'open' });
    const { model } = applyDiff(
      base,
      diff({ areas: [{ area: 'career', closeGoalIds: ['g1', 'nope'], closeThreadIds: ['t1'] }] }),
      NOW,
      makeId,
    );
    expect(model.areas.career.goals[0].status).toBe('done');
    expect(model.areas.career.threads[0].status).toBe('closed');
  });

  it('adds threads as open', () => {
    const { model } = applyDiff(
      emptyLifeModel(),
      diff({ areas: [{ area: 'social', addThreads: ['reconnecting with college friends'] }] }),
      NOW,
      makeId,
    );
    expect(model.areas.social.threads[0]).toMatchObject({
      text: 'reconnecting with college friends',
      status: 'open',
    });
  });

  it('overwrites only the profile fields present in the diff', () => {
    const base = emptyLifeModel();
    base.profile.identity = 'CS student in Mumbai';
    const { model } = applyDiff(
      base,
      diff({ profile: { coachingStyle: 'Direct, no fluff' } }),
      NOW,
      makeId,
    );
    expect(model.profile.identity).toBe('CS student in Mumbai');
    expect(model.profile.coachingStyle).toBe('Direct, no fluff');
  });

  it('turns diff events into LifeEvents with id and date', () => {
    const { newEvents } = applyDiff(
      emptyLifeModel(),
      diff({ events: [{ area: 'career', type: 'milestone', content: 'Interview at TCS' }] }),
      NOW,
      makeId,
    );
    expect(newEvents).toHaveLength(1);
    expect(newEvents[0]).toMatchObject({ area: 'career', type: 'milestone', content: 'Interview at TCS', date: NOW });
    expect(newEvents[0].id).toMatch(/^id-/);
  });

  it('empty diff is a no-op', () => {
    const base = emptyLifeModel();
    const { model, newEvents } = applyDiff(base, diff({}), NOW, makeId);
    expect(model).toEqual(base);
    expect(newEvents).toEqual([]);
  });
});
