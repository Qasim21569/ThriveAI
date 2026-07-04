import { getUserPlans, getPlan, pickActivePlan } from '@/lib/firebase/plans';
import { getRecentCheckins, type Checkin } from '@/lib/firebase/checkins';
import { getMemory, saveMemory } from '@/lib/firebase/memory';
import { LIFE_AREAS, emptyLifeModel, type LifeModel, type LifeEvent } from '@/lib/lifemodel/types';
import { getLifeModel, getRecentEvents } from '@/lib/firebase/lifeModel';
import { runExtraction } from './extraction-client';

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

// ---------------------------------------------------------------------------
// Life Model context (Plan 1: The Brain). Replaces the plan/check-in pipeline
// above — old exports are removed once the chat page is rewired (Task 8).
// ---------------------------------------------------------------------------

// Per-layer character budgets (~4 chars/token, same approximation as BUDGET
// above). Total worst case ≈ 4,000 chars ≈ 1,000 tokens of user context.
const MENTOR_BUDGET = {
  coachingStyle: 300,
  profile: 500,
  areaStatuses: 800,
  goalsThreads: 700,
  recentEvents: 800,
  summaries: 900,
} as const;

/**
 * Assemble the mentor's user-context block from the Life Model + recent
 * events. Pure and deterministic — all Firestore reads happen in
 * buildMentorContext (Task 7). Layer order follows the spec: coaching
 * style, profile, area statuses, goals/threads, recent events, summaries.
 */
export function assembleMentorContext(model: LifeModel, recentEvents: LifeEvent[]): string {
  const sections: string[] = [];

  if (model.profile.coachingStyle) {
    sections.push(
      `## How to coach this user\n${truncateToBudget(model.profile.coachingStyle, MENTOR_BUDGET.coachingStyle)}`,
    );
  }

  const profileText = [model.profile.identity, model.profile.personality]
    .filter(Boolean)
    .join(' ');
  if (profileText) {
    sections.push(`## Who they are\n${truncateToBudget(profileText, MENTOR_BUDGET.profile)}`);
  }

  const statusLines = LIFE_AREAS.filter((a) => model.areas[a].status)
    .map((a) => `- ${a}: ${model.areas[a].status}`)
    .join('\n');
  if (statusLines) {
    sections.push(
      `## Life areas right now\n${truncateToBudget(statusLines, MENTOR_BUDGET.areaStatuses)}`,
    );
  }

  const goalThreadLines = LIFE_AREAS.flatMap((a) => [
    ...model.areas[a].goals
      .filter((g) => g.status === 'active')
      .map((g) => `- goal [${a}] ${g.text}${g.targetDate ? ` (by ${g.targetDate})` : ''}`),
    ...model.areas[a].threads
      .filter((t) => t.status === 'open')
      .map((t) => `- open [${a}] ${t.text}`),
  ]).join('\n');
  if (goalThreadLines) {
    sections.push(
      `## Active goals and open threads\n${truncateToBudget(goalThreadLines, MENTOR_BUDGET.goalsThreads)}`,
    );
  }

  const eventLines = recentEvents
    .map((e) => `- ${e.date.slice(0, 10)} [${e.area}] ${e.content}`)
    .join('\n');
  if (eventLines) {
    sections.push(`## Recent events\n${truncateToBudget(eventLines, MENTOR_BUDGET.recentEvents)}`);
  }

  const summaryLines = LIFE_AREAS.filter((a) => model.areas[a].summary)
    .map((a) => `- ${a}: ${model.areas[a].summary}`)
    .join('\n');
  if (summaryLines) {
    sections.push(
      `## Earlier history (summarized)\n${truncateToBudget(summaryLines, MENTOR_BUDGET.summaries)}`,
    );
  }

  return sections.join('\n\n');
}

export interface MentorContext {
  contextBlock: string;
  hasModel: boolean;
  model: LifeModel | null;
}

/**
 * One-time backfill (spec section 5): when no Life Model exists yet, feed
 * the user's existing check-ins and active plan through the extraction
 * pipeline to seed it. Returns null when there is nothing to seed from —
 * the mentor then starts cold and the model is created by the first
 * extraction after a real conversation.
 */
async function seedLifeModelFromHistory(uid: string, idToken: string): Promise<LifeModel | null> {
  const [plans, checkins] = await Promise.all([getUserPlans(uid), getRecentCheckins(uid, 20)]);

  const parts: string[] = [];
  const activePlan = pickActivePlan(plans);
  if (activePlan) {
    const fullPlan = await getPlan(uid, activePlan.id);
    if (fullPlan) {
      parts.push(
        `The user has an existing ${fullPlan.type} plan: ${summarizePlanForPrompt(fullPlan.type, fullPlan.data)}`,
      );
    }
  }
  if (checkins.length > 0) {
    const lines = checkins
      .map((c) => `- [${c.type}] (${c.createdAt.slice(0, 10)}) ${c.summary}`)
      .join('\n');
    parts.push(`The user's past check-ins, newest first:\n${lines}`);
  }
  if (parts.length === 0) return null;

  const outcome = await runExtraction(uid, idToken, emptyLifeModel(), parts.join('\n\n'));
  return outcome?.model ?? null;
}

/**
 * Load the brain for a chat session: fetch the Life Model (seeding it from
 * pre-Life-Model history on first use) plus recent events, and assemble
 * the context block. Client-side because it needs the Firestore client SDK
 * — same reasoning as buildCoachContext before it.
 */
export async function buildMentorContext(uid: string, idToken: string): Promise<MentorContext> {
  let model: LifeModel | null = null;
  try {
    model = await getLifeModel(uid);
    if (!model) model = await seedLifeModelFromHistory(uid, idToken);
  } catch (error) {
    console.error('Failed to load Life Model:', error);
  }
  if (!model) return { contextBlock: '', hasModel: false, model: null };

  let events: LifeEvent[] = [];
  try {
    events = await getRecentEvents(uid, 15);
  } catch (error) {
    // Degrade gracefully: chat proceeds on the model alone (spec section 6).
    console.error('Failed to load recent events:', error);
  }

  return {
    contextBlock: assembleMentorContext(model, events),
    hasModel: true,
    model,
  };
}
