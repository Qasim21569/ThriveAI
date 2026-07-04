import type { LifeModel, LifeEvent } from './types';
import type { ExtractionDiff } from './extraction';

export interface ApplyResult {
  model: LifeModel;
  newEvents: LifeEvent[];
}

/**
 * Apply an extraction diff to a Life Model. Pure: returns a new model,
 * never mutates the input. Firestore persistence is the caller's job —
 * keeping this pure is what makes the extraction pipeline unit-testable
 * without any Firebase or network dependency.
 */
export function applyDiff(
  model: LifeModel,
  diff: ExtractionDiff,
  now: string,
  makeId: () => string = () => crypto.randomUUID(),
): ApplyResult {
  const next: LifeModel = structuredClone(model);

  if (diff.profile) {
    if (diff.profile.identity) next.profile.identity = diff.profile.identity;
    if (diff.profile.personality) next.profile.personality = diff.profile.personality;
    if (diff.profile.coachingStyle) next.profile.coachingStyle = diff.profile.coachingStyle;
  }

  for (const update of diff.areas) {
    const area = next.areas[update.area];
    if (update.status) area.status = update.status;
    if (update.summary) area.summary = update.summary;
    for (const g of update.addGoals ?? []) {
      area.goals.push({ id: makeId(), text: g.text, targetDate: g.targetDate, status: 'active' });
    }
    if (update.closeGoalIds?.length) {
      for (const goal of area.goals) {
        if (update.closeGoalIds.includes(goal.id)) goal.status = 'done';
      }
    }
    for (const t of update.addThreads ?? []) {
      area.threads.push({ id: makeId(), text: t, status: 'open' });
    }
    if (update.closeThreadIds?.length) {
      for (const thread of area.threads) {
        if (update.closeThreadIds.includes(thread.id)) thread.status = 'closed';
      }
    }
  }

  const newEvents: LifeEvent[] = diff.events.map((e) => ({
    id: makeId(),
    date: now,
    area: e.area,
    type: e.type,
    content: e.content,
  }));

  return { model: next, newEvents };
}
