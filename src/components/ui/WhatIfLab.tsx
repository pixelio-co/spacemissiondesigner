'use client';

/**
 * WHAT-IF LAB — take the current mission and test one alternative
 * configuration at a time. Shows CURRENT vs ALTERNATIVE with objective
 * trade-offs (gains AND losses) — never a simple "this one is better".
 */

import React, { useMemo, useState } from 'react';
import type { MissionState } from '@/lib/missionData';
import type { WhatIfVariant, WhatIfComparison } from '@/lib/missionRules';
import { generateWhatIfVariants, compareWhatIf, computeMissionDna } from '@/lib/missionRules';
import MissionDna from '@/components/ui/MissionDna';
import { FlaskConical, ArrowRight, TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface Props {
  mission: MissionState;
}

type CategoryFilter = 'all' | 'power' | 'propulsion' | 'communication' | 'instruments';

const CATEGORY_LABEL: Record<CategoryFilter, string> = {
  all: 'All changes',
  power: 'Power',
  propulsion: 'Propulsion',
  communication: 'Communication',
  instruments: 'Instruments',
};

function SuitabilityRow({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  const deltaColor = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted-foreground';
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;
  return (
    <div className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-mono">
        <span className="text-muted-foreground">{before}</span>
        <ArrowRight size={10} className="text-muted-foreground/60" />
        <span className="text-foreground font-semibold">{after}</span>
        <span className={`w-8 text-right font-bold ${deltaColor}`}>{delta !== 0 ? deltaText : '—'}</span>
      </span>
    </div>
  );
}

export default function WhatIfLab({ mission }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const variants = useMemo(() => generateWhatIfVariants(mission), [mission]);
  const filtered = useMemo(
    () => (filter === 'all' ? variants : variants.filter(v => v.category === filter)),
    [variants, filter]
  );
  const selected: WhatIfVariant | null = variants.find(v => v.id === selectedId) ?? null;
  const comparison: WhatIfComparison | null = useMemo(
    () => (selected ? compareWhatIf(mission, selected) : null),
    [mission, selected]
  );
  const currentDna = useMemo(() => computeMissionDna(mission), [mission]);
  const alternativeMission = useMemo(() => (selected ? selected.apply(mission) : null), [selected, mission]);
  const alternativeDna = useMemo(
    () => (alternativeMission ? computeMissionDna(alternativeMission) : null),
    [alternativeMission]
  );

  const canTest = mission.destination !== null && mission.power !== null;

  if (!canTest) {
    return (
      <div className="space-card p-4 text-center">
        <FlaskConical size={24} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          Choose at least a destination and a power system, then return here to test one
          alternative configuration at a time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What-If Lab
        </span>
        <span className="badge badge-neutral text-[9px]">One change at a time</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Take your current mission and test a single alternative. The comparison shows
        objective trade-offs — what you gain AND what you give up. Neither version is
        declared "better"; real mission design is about which trade-offs you accept.
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(Object.keys(CATEGORY_LABEL) as CategoryFilter[]).map(cat => (
          <button
            key={`filter-${cat}`}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              filter === cat
                ? 'bg-primary/15 border-primary text-primary'
                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Variant picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto pr-1">
        {filtered.map(v => (
          <button
            key={`variant-${v.id}`}
            type="button"
            onClick={() => setSelectedId(v.id)}
            className={`option-card p-3 text-left ${selectedId === v.id ? 'selected' : ''}`}
            aria-pressed={selectedId === v.id}
          >
            <div className="text-xs font-semibold text-foreground mb-0.5">{v.label}</div>
            <div className="text-[11px] text-muted-foreground leading-snug">{v.description}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-4 text-xs text-muted-foreground">
            No further changes available in this category.
          </div>
        )}
      </div>

      {/* Comparison */}
      {comparison && alternativeDna && selected && (
        <div className="animate-fadeIn space-y-4">
          <div className="flex items-center justify-center gap-3 text-xs font-mono">
            <span className="badge badge-info">CURRENT</span>
            <ArrowRight size={14} className="text-muted-foreground" />
            <span className="badge badge-warning">{selected.label}</span>
          </div>

          {/* Side-by-side DNA */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Scale size={10} /> Current mission
              </div>
              <MissionDna dna={currentDna} compact />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-warning mb-2 flex items-center gap-1">
                <Scale size={10} /> Alternative
              </div>
              <MissionDna dna={alternativeDna} deltas={comparison.dnaDeltas} compact />
            </div>
          </div>

          {/* Suitability comparison */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Design metrics — current → alternative
            </div>
            {comparison.suitability.map(s => (
              <SuitabilityRow key={`suit-${s.label}`} label={s.label} before={s.before} after={s.after} />
            ))}
          </div>

          {/* Outcome outlook */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['before', 'after'] as const).map(side => {
              const outlook = comparison.outlook[side];
              return (
                <div key={`outlook-${side}`} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {side === 'before' ? 'Current' : 'Alternative'} likely outcomes
                  </div>
                  <div className="space-y-1.5">
                    {outlook.probabilities.slice(0, 3).map(p => (
                      <div key={`out-${side}-${p.scenario}`}>
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-muted-foreground">{p.label}</span>
                          <span className="font-mono font-bold text-foreground">{p.percent}%</span>
                        </div>
                        <div className="score-bar-track h-1">
                          <div className="score-bar-fill bg-info" style={{ width: `${p.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2 italic">
                    Educational likelihood model — not a prediction.
                  </p>
                </div>
              );
            })}
          </div>

          {/* Gains and losses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-success/5 border border-success/25">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-success uppercase tracking-wider mb-2">
                <TrendingUp size={12} /> What you gain
              </div>
              {comparison.gains.length > 0 ? (
                comparison.gains.map((g, i) => (
                  <div key={`gain-${i}`} className="text-xs text-foreground leading-relaxed">{g}</div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No measurable gains from this change.</div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-danger/5 border border-danger/25">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-danger uppercase tracking-wider mb-2">
                <TrendingDown size={12} /> What you give up
              </div>
              {comparison.losses.length > 0 ? (
                comparison.losses.map((l, i) => (
                  <div key={`loss-${i}`} className="text-xs text-foreground leading-relaxed">{l}</div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No measurable losses from this change.</div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Test a different change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
