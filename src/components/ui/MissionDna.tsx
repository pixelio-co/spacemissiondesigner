'use client';

/**
 * MISSION DNA — visualizes the mission configuration as a profile of
 * interconnected dimensions. Each bar shows named rule contributions and a
 * plain-language explanation. Explicitly labelled an educational model.
 */

import React, { useState } from 'react';
import type { MissionDna, DnaDelta } from '@/lib/missionRules';
import { Info, ChevronDown, Dna } from 'lucide-react';

interface Props {
  dna: MissionDna;
  /** Optional deltas vs. an alternative (What-If comparison mode). */
  deltas?: DnaDelta[];
  compact?: boolean;
  defaultExpanded?: boolean;
}

function valueColor(value: number, key: string): string {
  // Risk and complexity are "informational" — high is not bad, just demanding.
  if (key === 'operationalRisk') {
    if (value >= 70) return 'bg-danger';
    if (value >= 40) return 'bg-warning';
    return 'bg-success';
  }
  if (value >= 70) return 'bg-success';
  if (value >= 40) return 'bg-warning';
  return 'bg-danger';
}

const BAR_LENGTH = 10;

function bar(value: number, key: string): string {
  const filled = Math.round((value / 100) * BAR_LENGTH);
  const color = valueColor(value, key);
  return '█'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled) + ` ${color}`;
}

export default function MissionDna({ dna, deltas, compact = false, defaultExpanded = false }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const deltaFor = (key: string): DnaDelta | undefined => deltas?.find(d => d.key === key);

  return (
    <div className="space-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Dna size={14} className="text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mission DNA
        </span>
        <span className="badge badge-neutral text-[9px]">Educational model</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        A profile of your mission\u0027s trade-offs — not a winning score. Tap a dimension to see which
        rules produced its value.
      </p>
      {!compact && (
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground italic">
          {dna.profileSummary}
        </div>
      )}

      <div className="space-y-2">
        {dna.dimensions.map(dim => {
          const delta = deltaFor(dim.key);
          const isOpen = expandedKey === dim.key;
          return (
            <div key={`dna-${dim.key}`} className="rounded-lg border border-transparent hover:border-border transition-colors">
              <button
                type="button"
                onClick={() => setExpandedKey(isOpen ? null : dim.key)}
                className="w-full text-left px-3 py-2.5"
                aria-expanded={isOpen}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    {dim.label}
                    {delta && delta.delta !== 0 && (
                      <span className={`font-mono text-[10px] font-bold ${delta.delta > 0 ? 'text-success' : 'text-danger'}`}>
                        {delta.delta > 0 ? '▲' : '▼'} {Math.abs(delta.delta)}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">{dim.value}</span>
                </div>
                <div className="score-bar-track h-2.5">
                  <div
                    className={`score-bar-fill ${valueColor(dim.value, dim.key)}`}
                    style={{ width: `${dim.value}%`, transition: 'width 500ms ease' }}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 pt-1 animate-fadeIn">
                  <p className="text-xs text-muted-foreground italic mb-2">{dim.meaning}</p>
                  <div className="text-xs text-foreground leading-relaxed mb-2">{dim.explanation}</div>
                  {dim.contributions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Rules that produced this value
                      </div>
                      {dim.contributions.map((c, i) => (
                        <div key={`contrib-${dim.key}-${i}`} className="flex items-start justify-between gap-2 text-xs bg-muted/30 rounded px-2 py-1">
                          <span className="text-muted-foreground">{c.label}</span>
                          <span className={`font-mono font-bold flex-shrink-0 ${(c.points ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {(c.points ?? 0) >= 0 ? '+' : ''}{Math.round((c.points ?? 0) * 10) / 10}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {delta && delta.reasons.length > 0 && (
                    <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                        Why it changed
                      </div>
                      {delta.reasons.map((r, i) => (
                        <div key={`reason-${dim.key}-${i}`} className="text-xs text-muted-foreground">· {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Info size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          This profile is a transparent teaching model built from visible rules — not a professional
          engineering assessment. Real mission design weighs many more factors.
        </p>
      </div>
    </div>
  );
}
