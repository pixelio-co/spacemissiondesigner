'use client';

/**
 * What-If Lab — take the current mission, change ONE variable, and compare
 * CURRENT vs ALTERNATIVE across Mission DNA dimensions. Trade-offs are shown
 * objectively (both gains and losses) — the lab never says "alternative is
 * better"; it explains what each change costs and buys.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { MissionState, Power, Propulsion, Communication, SpacecraftType, Instrument } from '@/lib/missionData';
import {
  POWER_SYSTEMS, PROPULSION_SYSTEMS, COMMUNICATION_SYSTEMS, SPACECRAFT_TYPES, INSTRUMENTS,
} from '@/lib/missionData';
import { calculateMissionScores } from '@/lib/missionData';
import { computeMissionDNA, compareDNA } from '@/lib/missionDNA';
import { useMissionStore } from '@/lib/missionStore';
import { useHydrated } from '@/lib/useHydrated';
import DNABars from '@/components/ui/DNABars';
import { FlaskConical, ArrowRight, ArrowLeft, Scale, Rocket, Lightbulb } from 'lucide-react';

type ChangeKind =
  | { type: 'power'; value: Power }
  | { type: 'propulsion'; value: Propulsion }
  | { type: 'communication'; value: Communication }
  | { type: 'spacecraft'; value: SpacecraftType }
  | { type: 'toggle-instrument'; value: Instrument; add: boolean };

function applyChange(mission: MissionState, change: ChangeKind): MissionState {
  switch (change.type) {
    case 'power': return { ...mission, power: change.value };
    case 'propulsion': return { ...mission, propulsion: change.value };
    case 'communication': return { ...mission, communication: change.value };
    case 'spacecraft': return { ...mission, spacecraft: change.value };
    case 'toggle-instrument':
      return {
        ...mission,
        instruments: change.add
          ? mission.instruments.includes(change.value)
            ? mission.instruments
            : [...mission.instruments, change.value]
          : mission.instruments.filter(i => i !== change.value),
      };
  }
}

function describeChange(change: ChangeKind): string {
  switch (change.type) {
    case 'power': return `Power → ${POWER_SYSTEMS[change.value].label}`;
    case 'propulsion': return `Propulsion → ${PROPULSION_SYSTEMS[change.value].label}`;
    case 'communication': return `Communication → ${COMMUNICATION_SYSTEMS[change.value].label}`;
    case 'spacecraft': return `Spacecraft → ${SPACECRAFT_TYPES[change.value].label}`;
    case 'toggle-instrument':
      return change.add
        ? `Add ${INSTRUMENTS[change.value].label}`
        : `Remove ${INSTRUMENTS[change.value].label}`;
  }
}

function labelOf(change: ChangeKind): string {
  switch (change.type) {
    case 'power': return POWER_SYSTEMS[change.value].label;
    case 'propulsion': return PROPULSION_SYSTEMS[change.value].label;
    case 'communication': return COMMUNICATION_SYSTEMS[change.value].label;
    case 'spacecraft': return SPACECRAFT_TYPES[change.value].label;
    case 'toggle-instrument': return INSTRUMENTS[change.value].label;
  }
}

export default function WhatIfLabClient() {
  const store = useMissionStore();
  const hydrated = useHydrated();

  // The What-If Lab always operates on the CURRENT session mission. There is
  // no archive fallback and no default mission: with no active mission the lab
  // shows an empty state, and a refresh clears everything.
  const mission: MissionState = store.mission;

  const [change, setChange] = useState<ChangeKind | null>(null);

  const currentDNA = useMemo(() => computeMissionDNA(mission, calculateMissionScores(mission)), [mission]);
  const altMission = useMemo(
    () => (change ? applyChange(mission, change) : null),
    [mission, change],
  );
  const altDNA = useMemo(
    () => (altMission ? computeMissionDNA(altMission, calculateMissionScores(altMission)) : null),
    [altMission],
  );
  const comparison = useMemo(
    () => (currentDNA && altDNA ? compareDNA(currentDNA, altDNA) : null),
    [currentDNA, altDNA],
  );

  const isComplete = Boolean(
    mission.destination && mission.spacecraft && mission.instruments.length &&
    mission.propulsion && mission.power && mission.communication
  );

  if (!hydrated) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!isComplete) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-card p-10 max-w-xl mx-auto text-center border-warning/30">
          <FlaskConical size={40} className="text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-3">No Active Mission</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Create a mission before using the What-If Lab. Design a complete mission
            (destination, spacecraft, instruments, propulsion, power, and communication),
            then return to experiment with single-variable changes.
          </p>
          <Link href="/mission-designer" className="btn-accent inline-flex items-center gap-2">
            <Rocket size={16} />
            Create Mission
          </Link>
        </div>
      </div>
    );
  }

  // Group changes by category
  const powerOptions: ChangeKind[] = (Object.keys(POWER_SYSTEMS) as Power[])
    .filter(p => p !== mission.power)
    .map(p => ({ type: 'power', value: p }));
  const propOptions: ChangeKind[] = (Object.keys(PROPULSION_SYSTEMS) as Propulsion[])
    .filter(p => p !== mission.propulsion)
    .map(p => ({ type: 'propulsion', value: p }));
  const commOptions: ChangeKind[] = (Object.keys(COMMUNICATION_SYSTEMS) as Communication[])
    .filter(c => c !== mission.communication)
    .map(c => ({ type: 'communication', value: c }));
  const scOptions: ChangeKind[] = (Object.keys(SPACECRAFT_TYPES) as SpacecraftType[])
    .filter(s => s !== mission.spacecraft)
    .map(s => ({ type: 'spacecraft', value: s }));
  const instOptions: ChangeKind[] = (Object.keys(INSTRUMENTS) as Instrument[])
    .map(i => ({ type: 'toggle-instrument', value: i, add: !mission.instruments.includes(i) }));

  const groups: { title: string; options: ChangeKind[] }[] = [
    { title: 'Change Power', options: powerOptions },
    { title: 'Change Propulsion', options: propOptions },
    { title: 'Change Communication', options: commOptions },
    { title: 'Change Spacecraft', options: scOptions },
    { title: 'Toggle Instruments', options: instOptions },
  ];

  const significant = comparison?.filter(c => Math.abs(c.delta) >= 3) ?? [];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical size={22} className="text-info" />
          <h1 className="text-2xl font-bold text-foreground">What-If Lab</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Mission design is the art of trade-offs. Change <strong>one variable</strong> at a time and
          compare it against your current design — the lab shows gains and losses objectively,
          never verdicts.
        </p>
      </div>

      {/* Current mission summary */}
      <div className="space-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Mission</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-foreground">{mission.missionName || 'Mission Alpha'}</span>
          <span className="text-muted-foreground">
            {mission.spacecraft && mission.destination
              ? `${SPACECRAFT_TYPES[mission.spacecraft].label} → ${mission.destination}`
              : ''}
          </span>
          <span className="text-muted-foreground">{mission.power ? POWER_SYSTEMS[mission.power].label : ''}</span>
          <span className="text-muted-foreground">{mission.propulsion ? PROPULSION_SYSTEMS[mission.propulsion].label : ''}</span>
          <span className="text-muted-foreground">{mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].label : ''}</span>
          <span className="text-muted-foreground">{mission.instruments.length} instruments</span>
        </div>
      </div>

      {/* Variable selectors */}
      <div className="space-y-4 mb-6">
        {groups.map(group => (
          <div key={group.title} className="space-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{group.title}</div>
            <div className="flex flex-wrap gap-2">
              {group.options.map(opt => {
                const selected = change?.type === opt.type && change?.value === opt.value;
                return (
                  <button
                    key={`${opt.type}-${opt.value}`}
                    type="button"
                    onClick={() => setChange(selected ? null : opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selected
                        ? 'bg-info/20 border-info text-info'
                        : 'bg-muted border-border text-muted-foreground hover:border-info/50 hover:text-foreground'
                    }`}
                  >
                    {labelOf(opt)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison */}
      {change && altMission && altDNA && comparison ? (
        <div className="space-y-4">
          <div className="space-card p-4 border-info/40">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-info" />
              <span className="text-sm font-bold text-foreground">Comparison</span>
              <span className="badge badge-info ml-2">{describeChange(change)}</span>
              <button
                type="button"
                onClick={() => setChange(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CURRENT */}
            <div className="space-card p-5 border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <ArrowLeft size={14} className="text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Current</span>
              </div>
              <DNABars dna={currentDNA} showExplanations={false} dense />
            </div>

            {/* ALTERNATIVE */}
            <div className="space-card p-5 border-accent/30">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight size={14} className="text-accent" />
                <span className="text-sm font-bold text-accent uppercase tracking-wider">Alternative</span>
                <span className="text-[10px] text-muted-foreground">{describeChange(change)}</span>
              </div>
              <DNABars dna={altDNA} showExplanations={false} dense compareWith={currentDNA} />
            </div>
          </div>

          {/* Objective trade-off summary */}
          <div className="space-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-1">What this change does</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Both improvements and costs are listed — every design decision buys something and pays for it.
            </p>
            {significant.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This change has little measurable effect on your current configuration —
                try a different variable or a more distant destination.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {significant.map(dim => {
                  const altDim = altDNA.dimensions.find(d => d.key === dim.key);
                  return (
                    <div
                      key={dim.key}
                      className={`p-3 rounded-lg border ${
                        dim.delta > 0 ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{dim.label}</span>
                        <span className={`text-xs font-mono font-bold ${dim.delta > 0 ? 'text-success' : 'text-danger'}`}>
                          {dim.delta > 0 ? `+${dim.delta}` : dim.delta}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {altDim?.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20 flex items-start gap-2">
              <Lightbulb size={13} className="text-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">
                <strong>How to read this:</strong> improvements in one dimension often cost another
                (e.g. deep-space communication raises Science Return but also Complexity).
                The “best” design depends on your objective and destination — that judgment is the skill.
              </p>
            </div>
          </div>

          {/* Apply option */}
          <div className="space-card p-5 border-success/25 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Want to fly this alternative instead? Apply it to your mission in the designer.
            </p>
            <Link
              href="/mission-designer"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => {
                if (change.type === 'power') store.updatePower(change.value);
                else if (change.type === 'propulsion') store.updatePropulsion(change.value);
                else if (change.type === 'communication') store.updateCommunication(change.value);
                else if (change.type === 'spacecraft') store.updateSpacecraft(change.value);
                else if (change.type === 'toggle-instrument') store.toggleInstrument(change.value);
              }}
            >
              Apply change & open Mission Designer
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-card p-10 text-center">
          <div className="text-3xl mb-3">🧪</div>
          <p className="text-sm text-muted-foreground">
            Select a change above to see the comparison. One variable at a time — like a real trade study.
          </p>
        </div>
      )}
    </div>
  );
}
