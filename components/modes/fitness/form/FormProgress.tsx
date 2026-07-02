'use client';

import { useMemo } from 'react';
import { User, Target, BarChart3, Dumbbell, Heart, Check, type LucideIcon } from 'lucide-react';

type FormStage = 'basic' | 'goals' | 'level' | 'preferences' | 'health';

interface FormProgressProps {
  currentStage: FormStage;
  setStage: (stage: FormStage) => void;
  validStages: FormStage[];
}

export function FormProgress({ currentStage, setStage, validStages }: FormProgressProps) {
  const stages = useMemo<{ id: FormStage; label: string; Icon: LucideIcon }[]>(
    () => [
      { id: 'basic', label: 'Basics', Icon: User },
      { id: 'goals', label: 'Goals', Icon: Target },
      { id: 'level', label: 'Level', Icon: BarChart3 },
      { id: 'preferences', label: 'Preferences', Icon: Dumbbell },
      { id: 'health', label: 'Health', Icon: Heart },
    ],
    []
  );

  const progressPercentage = useMemo(() => {
    const idx = stages.findIndex((stage) => stage.id === currentStage);
    return ((idx + 1) / stages.length) * 100;
  }, [currentStage, stages]);

  const getStageStatus = (stageId: FormStage): 'active' | 'completed' | 'upcoming' => {
    const stageIndex = stages.findIndex((stage) => stage.id === stageId);
    const currentStageIndex = stages.findIndex((stage) => stage.id === currentStage);
    if (stageId === currentStage) return 'active';
    if (stageIndex < currentStageIndex) return 'completed';
    return 'upcoming';
  };

  const isClickable = (stageId: FormStage) => validStages.includes(stageId);

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative mb-8 h-2 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-[width] duration-500 ease-standard"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stage Indicators */}
      <div className="relative flex justify-between">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-6 -z-10 h-0.5 bg-border" />

        {stages.map((stage) => {
          const status = getStageStatus(stage.id);
          const clickable = isClickable(stage.id);

          return (
            <div key={stage.id} className="flex flex-col items-center space-y-2">
              <button
                type="button"
                onClick={() => clickable && setStage(stage.id)}
                disabled={!clickable}
                aria-current={status === 'active' ? 'step' : undefined}
                className={[
                  'flex size-12 items-center justify-center rounded-full border transition-colors duration-base ease-standard',
                  status === 'active'
                    ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
                    : status === 'completed'
                    ? 'border-transparent bg-coffee-300 text-primary-foreground'
                    : 'border-border bg-surface-sunken text-text-muted',
                  clickable ? 'cursor-pointer' : 'cursor-not-allowed',
                ].join(' ')}
              >
                {status === 'completed' ? <Check className="size-5" /> : <stage.Icon className="size-5" />}
              </button>

              <span
                className={[
                  'text-xs font-medium',
                  status === 'active'
                    ? 'text-foreground'
                    : status === 'completed'
                    ? 'text-text-body'
                    : 'text-text-muted',
                ].join(' ')}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
