'use client';

import React, { useState } from 'react';
import type { MissionState } from '@/lib/missionData';
import type { MissionDNA } from '@/lib/missionDNA';
import { DNA_RULES } from '@/lib/missionDNA';
import DNABars, { DNARulesPanel } from '@/components/ui/DNABars';
import { Sparkles, ScrollText, X } from 'lucide-react';

interface Props {
  dna: MissionDNA;
  mission: MissionState;
}

/**
 * Right-hand designer panel: Mission DNA (with explanations) and the
 * transparent rule-based Mission Advisor. Replaces the old numeric-only
 * analysis panel as the primary feedback surface.
 */
export default function DNAPanel({ dna, mission }: Props) {
  const [showRules, setShowRules] = useState(false);
  const hasAny = Boolean(mission.objective || mission.destination || mission.spacecraft || mission.instruments.length);

  return (
    <div className="space-y-4 sticky top-24">
      <div className="space-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mission DNA
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          A live summary of your configuration across six educational dimensions.
        </p>

        {!hasAny ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🧬</div>
            <p className="text-xs text-muted-foreground">
              Your Mission DNA forms as you make design choices.
            </p>
          </div>
        ) : (
          <DNABars dna={dna} showExplanations />
        )}

        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-info hover:text-info/80 font-medium py-2 rounded-lg border border-info/25 bg-info/5 transition-colors"
        >
          <ScrollText size={12} />
          What do these dimensions mean?
        </button>

        <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Educational model — not a professional engineering calculation and not a
            “winning score”. Each value traces to a rule you can read.
          </p>
        </div>
      </div>

      {/* Mission Advisor */}
      {dna.advisorNotes.length > 0 && (
        <div className="space-card p-4 border-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Mission Advisor
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            Rule-based observations about your current configuration — no AI, no NASA affiliation.
          </p>
          <div className="space-y-2">
            {dna.advisorNotes.map((note, i) => (
              <div
                key={`advisor-${i}`}
                className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-foreground leading-relaxed"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules modal */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Mission DNA rules"
        >
          <div className="space-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Mission DNA — Transparent Rules</h3>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close rules"
              >
                <X size={18} />
              </button>
            </div>
            <DNARulesPanel />
          </div>
        </div>
      )}
    </div>
  );
}
