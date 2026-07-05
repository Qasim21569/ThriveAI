import type { Step } from 'onborda';

// onborda defines a Tour interface but does not re-export it from the
// package root; this structural twin satisfies OnbordaProps.steps.
interface Tour {
  tour: string;
  steps: Step[];
}

/**
 * Tour definitions for /today and /brain.
 * Copy follows the mentor register: plain, warm, sentence case, no exclamation marks.
 * Each step ≤ 2 short sentences.
 *
 * Target selectors match id attributes added to the target elements:
 *   /today:  #wt-today-prompts, #wt-today-entry, #wt-today-streak
 *   /brain:  #wt-brain-profile, #wt-brain-area-edit, #wt-brain-timeline
 */
export const walkthroughTours: Tour[] = [
  {
    tour: 'today',
    steps: [
      {
        icon: null,
        title: 'Your daily prompts',
        content: (
          <p>
            These questions are tailored to what your mentor already knows about you. You
            don&apos;t need to answer all of them — one honest sentence is enough.
          </p>
        ),
        selector: '#wt-today-prompts',
        side: 'bottom',
        showControls: false,
        pointerPadding: 12,
        pointerRadius: 10,
      },
      {
        icon: null,
        title: 'Your check-in entry',
        content: (
          <p>
            Write freely here. Your mentor reads this after you submit and updates
            everything it knows about you.
          </p>
        ),
        selector: '#wt-today-entry',
        side: 'top',
        showControls: false,
        pointerPadding: 12,
        pointerRadius: 10,
      },
      {
        icon: null,
        title: 'Your streak',
        content: (
          <p>
            This counts the days you&apos;ve checked in. Consistency matters more than
            perfection — every day you show up counts.
          </p>
        ),
        selector: '#wt-today-streak',
        side: 'bottom',
        showControls: false,
        pointerPadding: 8,
        pointerRadius: 24,
      },
    ],
  },
  {
    tour: 'brain',
    steps: [
      {
        icon: null,
        title: 'Your profile',
        content: (
          <p>
            This is what your mentor knows about who you are and how you like to be
            coached. You can edit any of it at any time.
          </p>
        ),
        selector: '#wt-brain-profile',
        side: 'bottom',
        showControls: false,
        pointerPadding: 12,
        pointerRadius: 12,
      },
      {
        icon: null,
        title: 'Editing an area',
        content: (
          <p>
            Each life area has an Edit button. Your corrections always win over anything
            the mentor inferred on its own.
          </p>
        ),
        selector: '#wt-brain-area-edit',
        side: 'left',
        showControls: false,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        icon: null,
        title: 'The timeline',
        content: (
          <p>
            Every insight your mentor has logged appears here, newest first. It&apos;s the
            raw record of what it has learned.
          </p>
        ),
        selector: '#wt-brain-timeline',
        side: 'top',
        showControls: false,
        pointerPadding: 12,
        pointerRadius: 12,
      },
    ],
  },
];
