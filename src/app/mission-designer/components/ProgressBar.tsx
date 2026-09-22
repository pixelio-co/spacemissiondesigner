'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Stage { id: number; label: string; key: string; }

interface Props {
  stages: Stage[];
  currentStage: number;
  completedStages: number[];
  progress: number;
  onStageClick: (stage: number) => void;
}

export default function ProgressBar({ stages, currentStage, completedStages, progress, onStageClick }: Props) {
  return (
    <div className="space-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          Mission Progress
        </span>
        <span className="text-xs font-bold font-mono text-primary">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="score-bar-track mb-4">
        <div
          className="score-bar-fill bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {stages.map((stage, idx) => {
          const isCompleted = completedStages.includes(stage.id);
          const isActive = stage.id === currentStage;
          const isClickable = isCompleted || stage.id <= currentStage;

          return (
            <React.Fragment key={`stage-indicator-${stage.id}`}>
              <button
                onClick={() => isClickable && onStageClick(stage.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-1 min-w-[48px] group ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                title={stage.label}
                aria-label={`Stage ${stage.id + 1}: ${stage.label}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
              >
                <div
                  className={`stage-indicator ${
                    isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : (
                    <span className="text-xs">{stage.id + 1}</span>
                  )}
                </div>
                <span className={`text-[9px] font-medium uppercase tracking-wide leading-none text-center ${
                  isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {stage.label}
                </span>
              </button>
              {idx < stages.length - 1 && (
                <div className={`flex-1 h-px min-w-[4px] ${
                  completedStages.includes(stage.id) ? 'bg-success' : 'bg-border'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}