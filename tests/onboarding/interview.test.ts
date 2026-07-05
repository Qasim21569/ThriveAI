import { describe, it, expect } from 'vitest';
import { LIFE_AREAS } from '@/lib/lifemodel/types';
import { INTERVIEW_QUESTIONS, buildInterviewTranscript } from '@/lib/onboarding/interview';

describe('INTERVIEW_QUESTIONS', () => {
  it('covers all five areas in LIFE_AREAS order', () => {
    expect(INTERVIEW_QUESTIONS.map((q) => q.area)).toEqual([...LIFE_AREAS]);
    for (const q of INTERVIEW_QUESTIONS) expect(q.question.length).toBeGreaterThan(10);
  });
});

describe('buildInterviewTranscript', () => {
  it('formats entries with area labels and skips empty answers', () => {
    const t = buildInterviewTranscript([
      { area: 'career', question: 'Work?', answer: 'Final-year CS student, job hunting.' },
      { area: 'health', question: 'Health?', answer: '   ' },
    ]);
    expect(t).toContain('onboarding interview');
    expect(t).toContain('[career] Q: Work?');
    expect(t).toContain('A: Final-year CS student, job hunting.');
    expect(t).not.toContain('[health]');
  });

  it('returns empty string when no non-empty answers exist', () => {
    expect(buildInterviewTranscript([{ area: 'career', question: 'Q', answer: '' }])).toBe('');
  });
});
