import React from 'react';

type FormProgressProps = {
  progress: number;
};

export function FormProgress({ progress }: FormProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-xs text-slate-400">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
} 