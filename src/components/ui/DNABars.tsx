'use client';

import React from 'react';
import type { MissionDNA, DNADimension } from '@/lib/missionDNA';
import { DNA_RULES } from '@/lib/missionDNA';
import { Info } from 'lucide-react';

interface DNABarsProps {
  dna: MissionDNA;
  /** Show the explanation line under each bar. */
  showExplanations?: boolean;
  /** Alternative DNA to compare against (What-If Lab). */
  compareWith?: MissionDNA | null;
  dense?: boolean;
}

function filledBlocks(value: number): string {
  const filled = Math.round((value / 100) * 10);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, 10 - filled));
}

function valueColor(value: number): string {
  if (value >= 70) return 'text-success';
  if (value >= 40) return 'text-warning';
  return 'text-danger';
}

export function DNABar({ dim }: { dim: DNADimension }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs font-medium text-foreground">{dim.label}</span>
        <span className={`text-xs font-mono font-bold ${valueColor(dim.value)}`}>
          {filledBlocks(dim.value)} {dim.value}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">{dim.explanation}</p>
    </div>
  );
}

/**
 * Mission DNA display: six dimensions with transparent explanations.
 * An educational summary of the configuration — not a "winning score".
 */
export default function DNABars({ dna, showExplanations = true, compareWith, dense = false }: DNABarsProps) {
  return (
    <div className={dense ? 'space-y-3' : 'space-y-4'}>
      {dna.dimensions.map(dim => {
        const alt = compareWith?.dimensions.find(d => d.key === dim.key);
        const delta = alt ? alt.value - dim.value : null;
        return (
          <div key={dim.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{dim.label}</span>
              <span className={`text-xs font-mono font-bold ${valueColor(dim.value)}`}>{dim.value}</span>
            </div>

            {/* Block bar */}
            <div className="font-mono text-sm leading-none tracking-widest select-none" aria-hidden="true">
              <span className="text-primary">{filledBlocks(dim.value).slice(0, Math.round((dim.value / 100) * 10))}</span>
              <span className="text-muted/70">{filledBlocks(dim.value).slice(Math.round((dim.value / 100) * 10))}</span>
            </div>

            {/* Comparison deltas (What-If) */}
            {alt && delta !== null && (
              <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px]">
                <span className="text-muted-foreground">alt:</span>
                <span className={`font-bold ${delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                <span className="text-muted-foreground">({filledBlocks(alt.value)} {alt.value})</span>
              </div>
            )}

            {showExplanations && (
              <div className="mt-1 flex items-start gap-1.5">
                <Info size={10} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{dim.explanation}</p>
                  <p className="text-[10px] text-muted-foreground/70 italic leading-snug mt-0.5">{dim.hint}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Rule reference panel — explains what each dimension means and its rule. */
export function DNARulesPanel() {
  return (
    <div className="space-y-3">
      {Object.entries(DNA_RULES).map(([key, rule]) => (
        <div key={key} className="p-3 rounded-lg bg-muted/40 border border-border">
          <div className="text-xs font-bold text-foreground mb-0.5">{rule.label}</div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="text-info font-medium">Meaning: </span>{rule.meaning}
          </div>
          <div className="text-[11px] text-muted-foreground leading-relaxed mt-1">
            <span className="text-accent font-medium">Rule: </span>{rule.rule}
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground italic px-1">
        Mission DNA is an educational model, not a professional engineering calculation.
      </p>
    </div>
  );
}
