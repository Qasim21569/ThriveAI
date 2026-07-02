import React from 'react';

type FormProgressProps = {
  progress: number;
};

export function FormProgress({ progress }: FormProgressProps) {
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-text-muted">
        <span className="font-mono uppercase tracking-wide">Progress</span>
        <span className="font-mono">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-standard"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
