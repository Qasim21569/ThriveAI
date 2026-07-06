import { LIFE_AREAS, type LifeModel } from '@/lib/lifemodel/types';

const GENERIC_PROMPT = 'How was your day? Energy, mood, anything notable.';

/**
 * Template-based adaptive prompts from the Life Model's open loops.
 * Deterministic and free — no LLM call. Up to two specific prompts
 * (open threads first, then active goals), always ending generic.
 */
export function buildDailyPrompts(model: LifeModel | null): string[] {
  const specific: string[] = [];
  if (model) {
    const openThreads = LIFE_AREAS.flatMap((a) =>
      model.areas[a].threads.filter((t) => t.status === 'open'),
    );
    for (const t of openThreads.slice(0, 2)) {
      specific.push(`Any progress on "${t.text}"?`);
    }
    if (specific.length < 2) {
      const activeGoals = LIFE_AREAS.flatMap((a) =>
        model.areas[a].goals.filter((g) => g.status === 'active'),
      );
      for (const g of activeGoals.slice(0, 2 - specific.length)) {
        specific.push(`Did you move toward "${g.text}" today?`);
      }
    }
  }
  return [...specific, GENERIC_PROMPT].slice(0, 3);
}
