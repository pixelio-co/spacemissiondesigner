'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import type { MissionEvent } from '@/lib/simulationEngine';
import { SCENARIO_DEFINITIONS } from '@/lib/simTypes';

interface Props {
  event: MissionEvent;
  onDecide: (index: number, educationalWhy: string) => void;
}

export default function DecisionModal({ event, onDecide }: Props) {
  const def = event.scenario ? SCENARIO_DEFINITIONS[event.scenario] : null;
  const options = def?.decisionOptions ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
    >
      <div className="space-card border-warning/50 border-2 p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div>
            <h2 id="decision-modal-title" className="text-base font-bold text-warning font-mono tracking-wider">
              {event.title.toUpperCase()}
            </h2>
            <div className="text-xs text-muted-foreground">Mission Decision Required</div>
          </div>
        </div>

        <p className="text-sm text-foreground mb-3 leading-relaxed">{event.message}</p>

        {event.cause && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20 mb-5">
            <Info size={12} className="text-info mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-info font-semibold">Why this is happening: </span>
              {event.cause}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {options.map((option, idx) => (
            <button
              key={`decision-option-${event.id}-${idx}`}
              type="button"
              onClick={() => onDecide(idx, option.educationalWhy)}
              className="decision-card p-4 w-full text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold font-mono text-accent">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.consequence}</div>
                  <div className="text-[10px] text-info/80 italic mt-1">{option.educationalWhy}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Every option is a real trade-off — mission planners rank objectives before flight for moments like this.
        </p>
      </div>
    </div>
  );
}
