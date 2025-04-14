'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

type FormStage = 'basic' | 'goals' | 'level' | 'preferences' | 'health';

interface FormProgressProps {
  currentStage: FormStage;
  setStage: (stage: FormStage) => void;
  validStages: FormStage[];
}

export function FormProgress({ currentStage, setStage, validStages }: FormProgressProps) {
  // Memoize stages to prevent recreation on each render
  const stages = useMemo(() => [
    { id: 'basic' as FormStage, label: 'Basics', icon: '👤' },
    { id: 'goals' as FormStage, label: 'Goals', icon: '🎯' },
    { id: 'level' as FormStage, label: 'Level', icon: '📊' },
    { id: 'preferences' as FormStage, label: 'Preferences', icon: '💪' },
    { id: 'health' as FormStage, label: 'Health', icon: '❤️' },
  ], []);

  // Calculate progress percentage - memoize to prevent recalculation
  const { currentIndex, progressPercentage } = useMemo(() => {
    const idx = stages.findIndex(stage => stage.id === currentStage);
    return {
      currentIndex: idx,
      progressPercentage: ((idx + 1) / stages.length) * 100
    };
  }, [currentStage, stages]);

  // Determine if a stage is active, completed, or upcoming
  const getStageStatus = useMemo(() => (stageId: FormStage) => {
    const stageIndex = stages.findIndex(stage => stage.id === stageId);
    const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
    
    if (stageId === currentStage) return 'active';
    if (stageIndex < currentStageIndex) return 'completed';
    return 'upcoming';
  }, [currentStage, stages]);

  // Determine if a stage is clickable (only completed stages or the current stage can be clicked)
  const isClickable = useMemo(() => (stageId: FormStage) => {
    return validStages.includes(stageId);
  }, [validStages]);

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative h-2 bg-violet-900/20 rounded-full overflow-hidden mb-8">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-600 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      
      {/* Stage Indicators */}
      <div className="flex justify-between relative">
        {/* Connecting line between indicators */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-violet-900/20 -z-10" />
        
        {stages.map((stage) => {
          const status = getStageStatus(stage.id);
          const clickable = isClickable(stage.id);
          
          return (
            <div key={stage.id} className="flex flex-col items-center space-y-2">
              <button
                onClick={() => clickable && setStage(stage.id)}
                disabled={!clickable}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-lg
                  transition-all duration-300 relative
                  ${status === 'active' ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30' : ''}
                  ${status === 'completed' ? 'bg-violet-800 text-white' : ''}
                  ${status === 'upcoming' ? 'bg-violet-900/20 text-violet-300/50' : ''}
                  ${clickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                `}
              >
                {status === 'completed' ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stage.icon
                )}
                
                {/* Glow effect for active stage */}
                {status === 'active' && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.5, 0.2, 0.5], 
                      scale: [1, 1.15, 1] 
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    style={{
                      background: 'linear-gradient(to right, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.3))',
                      filter: 'blur(8px)',
                      zIndex: -1
                    }}
                  />
                )}
              </button>
              
              <span className={`text-xs font-medium
                ${status === 'active' ? 'text-violet-200' : ''}
                ${status === 'completed' ? 'text-violet-300' : ''}
                ${status === 'upcoming' ? 'text-violet-400/50' : ''}
              `}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
} 