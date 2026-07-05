import type { LifeAreaId } from '@/lib/lifemodel/types';

export interface InterviewEntry {
  area: LifeAreaId;
  question: string;
  answer: string;
}

export const INTERVIEW_QUESTIONS: { area: LifeAreaId; question: string }[] = [
  {
    area: 'career',
    question:
      "Let's start with work. What's your current situation — job, studies — and what are you aiming for right now?",
  },
  {
    area: 'health',
    question:
      "How's your physical health — energy, exercise, sleep? Anything you're actively working on?",
  },
  {
    area: 'mental',
    question:
      'How have you been doing mentally lately? Stress, mood, anything weighing on you?',
  },
  {
    area: 'financial',
    question:
      "What's your money situation like, and what would you want it to look like?",
  },
  {
    area: 'social',
    question:
      'And your social life — relationships, friends, family. What matters most there right now?',
  },
];

/**
 * Format the interview for the seeding extraction. The preamble tells the
 * extractor this is a first-person self-description, so it should populate
 * profile identity and area statuses/goals rather than treating it as a
 * day's events.
 */
export function buildInterviewTranscript(entries: InterviewEntry[]): string {
  const answered = entries.filter((e) => e.answer.trim() !== '');
  if (answered.length === 0) return '';
  const lines = answered.map((e) => `[${e.area}] Q: ${e.question}\nA: ${e.answer.trim()}`);
  return (
    'This is the user\'s onboarding interview — a first-person description of their life. ' +
    'Build their profile (identity, personality) and per-area statuses, goals, and open ' +
    'threads from it.\n\n' +
    lines.join('\n\n')
  );
}
