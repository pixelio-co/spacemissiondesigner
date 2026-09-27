'use client';

import React from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import type { DecisionDef, DecisionOption } from '@/lib/simulationEngine';

interface Props {
  prompt: DecisionDef;
  onDecide: (option: DecisionOption) => void;
}

/**
 * Decision modal for mission events. Options carry real trade-offs —
 * the modal presents them neutrally (no "correct answer" labeling).
 */
export default function DecisionModal({ prompt, onDecide }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
    >
      <div className="space-card border-warning/50 border-2 p-6 max-w-xl w-full max-h-[88vh] overflow-y-auto animate-slideUp">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div>
            <h2 id="decision-modal-title" className="text-base font-bold text-warning font-mono tracking-wider">
              {prompt.title}
            </h2>
            <div className="text-xs text-muted-foreground">Mission Decision Required</div>
          </div>
        </div>

        <p className="text-sm text-foreground mb-6 leading-relaxed">{prompt.description}</p>

        <div className="space-y-3">
          {prompt.options.map((option, idx) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onDecide(option)}
              className="decision-card p-4 w-full text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold font-mono text-accent">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground mb-1">{option.label}</div>
                  <div className="text-xs text-muted-foreground mb-1.5">{option.description}</div>
                  <div className="text-xs text-foreground/80">
                    <span className="text-muted-foreground">Likely outcome: </span>
                    {option.consequence}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-info/5 border border-info/20 flex items-start gap-2">
          <Lightbulb size={12} className="text-info mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Each choice trades resources (power, science time, risk) differently —
            exactly like real mission-operations decisions. There is no universal “right” answer.
          </p>
        </div>
      </div>
    </div>
  );
}
