'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DecisionOption {
  label: string;
  consequence: string;
  effect: Record<string, number>;
}

interface DecisionPrompt {
  title: string;
  description: string;
  options: DecisionOption[];
}

interface Props {
  prompt: DecisionPrompt;
  onDecide: (index: number) => void;
}

export default function DecisionModal({ prompt, onDecide }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
    >
      <div className="space-card border-warning/50 border-2 p-6 max-w-lg w-full animate-slideUp">
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
              key={`decision-option-${idx}`}
              type="button"
              onClick={() => onDecide(idx)}
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
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Your decision will affect mission outcomes. Choose carefully.
        </p>
      </div>
    </div>
  );
}