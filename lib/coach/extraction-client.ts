import { extractionDiffSchema } from '@/lib/lifemodel/extraction';
import { applyDiff } from '@/lib/lifemodel/apply';
import { saveLifeModel, addEvents } from '@/lib/firebase/lifeModel';
import type { LifeModel, LifeEvent } from '@/lib/lifemodel/types';

export interface ExtractionOutcome {
  model: LifeModel;
  newEvents: LifeEvent[];
}

/**
 * Run one extraction round-trip: send conversation text + current model to
 * /api/coach/extract, validate the diff, apply it, persist model + events.
 * Returns null on ANY failure — never throws. The raw conversation is
 * already persisted by the caller (messages/check-ins), so a failed
 * extraction only means the brain is briefly stale, not that data is lost.
 */
export async function runExtraction(
  uid: string,
  idToken: string,
  model: LifeModel,
  conversationText: string,
): Promise<ExtractionOutcome | null> {
  try {
    const res = await fetch('/api/coach/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ conversationText, lifeModel: model }),
    });
    if (!res.ok) throw new Error(`Extract request failed: ${res.status}`);

    const { diff } = await res.json();
    const parsed = extractionDiffSchema.safeParse(diff);
    if (!parsed.success) throw new Error('Extract response failed validation');

    const { model: next, newEvents } = applyDiff(model, parsed.data, new Date().toISOString());
    await Promise.all([saveLifeModel(uid, next), addEvents(uid, newEvents)]);
    return { model: next, newEvents };
  } catch (error) {
    console.error('Extraction failed (brain will catch up on next interaction):', error);
    return null;
  }
}
