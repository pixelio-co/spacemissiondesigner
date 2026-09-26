'use client';

/**
 * AUTONOMY MODAL — during communication gaps the spacecraft follows a
 * pre-planned behavior chosen here. Each option shows its trade-off and an
 * educational note about why real spacecraft need autonomy.
 */

import React from 'react';
import { Satellite, Radio } from 'lucide-react';
import type { AutonomyOptionDef } from '@/lib/simTypes';
import type { AutonomyChoice } from '@/lib/simulationEngine';

interface Props {
  options: AutonomyOptionDef[];
  onChoose: (choice: AutonomyChoice) => void;
  destinationLabel: string;
  oneWayDelay: string;
}

export default function AutonomyModal({ options, onChoose, destinationLabel, oneWayDelay }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="autonomy-modal-title"
    >
      <div className="space-card border-info/50 border-2 p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center flex-shrink-0">
            <Satellite size={20} className="text-info" />
          </div>
          <div>
            <h2 id="autonomy-modal-title" className="text-base font-bold text-info font-mono tracking-wider">
              COMMUNICATION GAP — AUTONOMY REQUIRED
            </h2>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Radio size={10} />
              One-way delay to {destinationLabel}: {oneWayDelay} — Earth cannot help right now
            </div>
          </div>
        </div>

        <p className="text-sm text-foreground mb-5 leading-relaxed">
          Your spacecraft is out of contact. Real missions pre-plan exactly this moment: which
          behavior should the spacecraft follow until the next contact window?
        </p>

        <div className="space-y-3">
          {options.map(option => (
            <button
              key={`autonomy-${option.id}`}
              type="button"
              onClick={() => onChoose(option.id)}
              className="decision-card p-4 w-full text-left"
            >
              <div className="text-sm font-semibold text-foreground mb-1">{option.label}</div>
              <div className="text-xs text-muted-foreground mb-1.5 leading-relaxed">{option.description}</div>
              <div className="text-[11px] font-mono text-accent">{option.tradeOffHint}</div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center italic">
          This is why autonomous operations exist — at Mars and beyond, spacecraft must think for
          themselves between contacts.
        </p>
      </div>
    </div>
  );
}
