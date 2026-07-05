/**
 * Consecutive-day check-in streak. Grace rule: a day in progress (today,
 * no check-in yet) doesn't break the streak — it just doesn't count yet.
 * Dates are compared as UTC calendar days for determinism.
 */
export function computeStreak(checkinDates: string[], today: string): number {
  const days = new Set(checkinDates.map((d) => d.slice(0, 10)));
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
