import { getUserPlans, getPlan, pickActivePlan } from '@/lib/firebase/plans';
import { getRecentCheckins, type Checkin } from '@/lib/firebase/checkins';
import { getMemory, saveMemory } from '@/lib/firebase/memory';

// How many of the most recent check-ins are shown in full, verbatim.
// Anything older than this window gets folded into the rolling summary
// instead of growing the prompt forever.
const RECENT_CHECKIN_WINDOW = 5;

// Character budgets per layer. This is a character-count approximation of
// a token budget (roughly 4 characters per token for English text) rather
// than a real tokenizer — accurate enough to bound prompt size without
// adding a tokenizer dependency for a project this size.
const BUDGET = {
  plan: 500,
  recentCheckins: 600,
  memory: 400,
} as const;

function truncateToBudget(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + '…';
}

/**
 * Build a compact text summary of a plan for injection into the coach's
 * system prompt. We summarize rather than send the raw plan JSON to keep
 * the prompt small and cheap.
 */
export function summarizePlanForPrompt(
  planType: string,
  planData: Record<string, unknown>,
): string {
  if (planType !== 'fitness') {
    return `A ${planType} plan exists but isn't summarized for chat yet.`;
  }

  const data = planData as {
    goals?: { short_term?: string[]; long_term?: string[] };
    workouts?: { name?: string }[];
    health_summary?: { overview?: string };
  };

  const parts: string[] = [];

  if (data.health_summary?.overview) {
    parts.push(data.health_summary.overview);
  }
  if (data.workouts?.length) {
    const names = data.workouts.map((w) => w.name).filter(Boolean).join(', ');
    if (names) parts.push(`Workouts in the plan: ${names}.`);
  }
  if (data.goals?.short_term?.length) {
    parts.push(`Short-term goals: ${data.goals.short_term.join('; ')}.`);
  }
  if (data.goals?.long_term?.length) {
    parts.push(`Long-term goals: ${data.goals.long_term.join('; ')}.`);
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'A fitness plan exists but has no summarizable details yet.';
}

function formatCheckinsForPrompt(checkins: Checkin[]): string {
  if (checkins.length === 0) return 'No check-ins yet.';
  return checkins.map((c) => `- [${c.type}] ${c.summary}`).join('\n');
}

/**
 * Get (or lazily rebuild) the rolling summary of check-ins older than the
 * recent window. Caches on `summarizedCount`: if the number of "old"
 * check-ins hasn't changed since the last summary was built, the stored
 * summary is reused with no Groq call. If it has changed (new check-ins
 * aged out of the recent window), the whole older set is re-summarized —
 * not merged incrementally.
 *
 * That's a deliberate simplification: at the scale this app operates at
 * (tens of check-ins per user), re-summarizing the full older set on each
 * boundary shift is cheap and simple. Incremental merge-summarization
 * would only start paying for its added complexity in the thousands of
 * entries — see ARCHITECTURE.md for the fuller trade-off.
 */
async function getOrBuildMemorySummary(
  uid: string,
  allCheckins: Checkin[],
  idToken: string,
): Promise<string | null> {
  const oldCheckins = allCheckins.slice(RECENT_CHECKIN_WINDOW);
  if (oldCheckins.length === 0) return null;

  const existing = await getMemory(uid);
  if (existing && existing.summarizedCount === oldCheckins.length) {
    return existing.summary;
  }

  try {
    const res = await fetch('/api/coach/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ checkinsText: formatCheckinsForPrompt(oldCheckins) }),
    });
    if (!res.ok) throw new Error(`Summarize request failed: ${res.status}`);
    const { summary } = await res.json();
    await saveMemory(uid, summary, oldCheckins.length);
    return summary;
  } catch (error) {
    console.error('Failed to build rolling memory summary:', error);
    // Degrade gracefully — fall back to the previous summary if one exists,
    // otherwise proceed without memory rather than blocking the chat.
    return existing?.summary ?? null;
  }
}

export interface CoachContext {
  contextBlock: string;
  hasPlan: boolean;
}

/**
 * Assemble the full context pipeline: plan summary + recent check-ins +
 * rolling memory of older check-ins, each independently budgeted and
 * labeled so the model can tell them apart. This runs client-side (not in
 * the API route) because it needs the Firestore client SDK — consistent
 * with this app's client-orchestrated architecture (see Phase 1/2 notes).
 */
export async function buildCoachContext(uid: string, idToken: string): Promise<CoachContext> {
  const [plans, checkins] = await Promise.all([
    getUserPlans(uid),
    getRecentCheckins(uid, 20),
  ]);

  let planBlock = '';
  let hasPlan = false;
  const activePlan = pickActivePlan(plans);
  if (activePlan) {
    const fullPlan = await getPlan(uid, activePlan.id);
    if (fullPlan) {
      hasPlan = true;
      planBlock = truncateToBudget(summarizePlanForPrompt(fullPlan.type, fullPlan.data), BUDGET.plan);
    }
  }

  const recentCheckins = checkins.slice(0, RECENT_CHECKIN_WINDOW);
  const recentBlock = truncateToBudget(formatCheckinsForPrompt(recentCheckins), BUDGET.recentCheckins);

  const memorySummary = await getOrBuildMemorySummary(uid, checkins, idToken);
  const memoryBlock = memorySummary ? truncateToBudget(memorySummary, BUDGET.memory) : null;

  const sections: string[] = [];
  if (planBlock) sections.push(`## Active plan\n${planBlock}`);
  if (recentCheckins.length > 0) sections.push(`## Recent check-ins\n${recentBlock}`);
  if (memoryBlock) sections.push(`## Earlier history (summarized)\n${memoryBlock}`);

  return {
    contextBlock: sections.join('\n\n'),
    hasPlan,
  };
}
