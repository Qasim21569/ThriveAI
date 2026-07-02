/**
 * Build a compact text summary of a plan for injection into the coach's
 * system prompt. We summarize rather than send the raw plan JSON to keep
 * the prompt small and cheap. This is layer 2 of the context pipeline
 * (layer 1 is coach identity, built in the API service). Full context
 * management — token budgets, check-in history, rolling summaries —
 * arrives in Phase 4; this is the minimal version that makes the coach
 * plan-aware today.
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
