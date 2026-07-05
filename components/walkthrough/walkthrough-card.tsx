'use client';

import { useOnborda } from 'onborda';
import type { CardComponentProps } from 'onborda';
import { Button } from '@/components/ui/button';

/**
 * WalkthroughCard — Onborda custom card component.
 * Oat surface, shadow-xl floating elevation, serif step titles, sans body.
 * Transitions are disabled at the provider level (cardTransition={{ duration: 0 }}).
 * Skippable at every step; sets localStorage done key on close/complete.
 */
export function WalkthroughCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const { closeOnborda } = useOnborda();
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className="relative w-72 rounded-lg border border-border bg-surface p-5"
      style={{ boxShadow: 'var(--shadow-xl)' }}
      role="dialog"
      aria-label={`Step ${currentStep + 1} of ${totalSteps}: ${step.title}`}
    >
      {/* Arrow connector rendered by Onborda — text-surface so SVG matches card bg */}
      <span className="text-surface">{arrow}</span>

      {/* Step indicator eyebrow */}
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">
        Step {currentStep + 1} of {totalSteps}
      </p>

      {/* Title — serif, sentence case, warm ink */}
      <h3 className="mb-2 font-serif text-base font-semibold leading-snug text-foreground">
        {step.title}
      </h3>

      {/* Body — sans, 14px, relaxed */}
      <div className="mb-5 text-sm leading-relaxed text-text-body">
        {step.content}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={closeOnborda}
          className="text-text-muted hover:text-text-body"
        >
          Skip tour
        </Button>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={prevStep}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={isLast ? closeOnborda : nextStep}
          >
            {isLast ? 'Done' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
