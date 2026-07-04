import { describe, it, expect } from 'vitest';
import { emptyLifeModel, type LifeEvent } from '@/lib/lifemodel/types';
import { assembleMentorContext } from '@/lib/coach/context';

function populatedModel() {
  const model = emptyLifeModel();
  model.profile = {
    identity: 'Final-year CS student in Mumbai',
    personality: 'Ambitious, hard on himself',
    coachingStyle: 'Direct feedback, no sugarcoating',
  };
  model.areas.career.status = 'Job hunting, one interview scheduled at TCS.';
  model.areas.career.goals.push({ id: 'g1', text: 'Land a frontend job', targetDate: '2026-09-01', status: 'active' });
  model.areas.career.goals.push({ id: 'g2', text: 'Old goal', targetDate: null, status: 'done' });
  model.areas.career.threads.push({ id: 't1', text: 'interviewing at TCS', status: 'open' });
  model.areas.career.threads.push({ id: 't2', text: 'closed loop', status: 'closed' });
  model.areas.health.summary = 'Trained consistently through June.';
  return model;
}

const EVENTS: LifeEvent[] = [
  { id: 'e1', date: '2026-07-02T10:00:00.000Z', area: 'career', type: 'milestone', content: 'Interview scheduled at TCS' },
];

describe('assembleMentorContext', () => {
  it('returns empty string for an empty model with no events', () => {
    expect(assembleMentorContext(emptyLifeModel(), [])).toBe('');
  });

  it('renders sections in the spec order', () => {
    const block = assembleMentorContext(populatedModel(), EVENTS);
    const order = [
      block.indexOf('## How to coach this user'),
      block.indexOf('## Who they are'),
      block.indexOf('## Life areas right now'),
      block.indexOf('## Active goals and open threads'),
      block.indexOf('## Recent events'),
      block.indexOf('## Earlier history (summarized)'),
    ];
    for (const idx of order) expect(idx).toBeGreaterThanOrEqual(0);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('includes only active goals and open threads', () => {
    const block = assembleMentorContext(populatedModel(), []);
    expect(block).toContain('Land a frontend job');
    expect(block).not.toContain('Old goal');
    expect(block).toContain('interviewing at TCS');
    expect(block).not.toContain('closed loop');
  });

  it('formats events with date and area', () => {
    const block = assembleMentorContext(populatedModel(), EVENTS);
    expect(block).toContain('- 2026-07-02 [career] Interview scheduled at TCS');
  });

  it('omits sections with no content', () => {
    const model = emptyLifeModel();
    model.areas.career.status = 'Job hunting.';
    const block = assembleMentorContext(model, []);
    expect(block).toContain('## Life areas right now');
    expect(block).not.toContain('## How to coach this user');
    expect(block).not.toContain('## Recent events');
  });

  it('truncates oversized layers to their budget', () => {
    const model = emptyLifeModel();
    model.profile.coachingStyle = 'x'.repeat(2000);
    const block = assembleMentorContext(model, []);
    // coaching style budget is 300 chars + section header + ellipsis
    expect(block.length).toBeLessThan(400);
    expect(block).toContain('…');
  });
});
