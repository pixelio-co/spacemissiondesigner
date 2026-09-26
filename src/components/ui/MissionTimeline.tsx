'use client';

/**
 * MISSION TIMELINE — vertical phase tracker with event markers.
 * Highlights the current phase and lists important events (success/warning)
 * so the user can see the mission story at a glance.
 */

import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

export interface TimelineEventMarker {
  id: string;
  phaseIndex: number;
  label: string;
  kind: 'success' | 'warning' | 'danger' | 'info';
}

interface Props {
  phases: string[];
  /** Index of the phase currently underway (or phases.length for complete). */
  currentPhase: number;
  complete?: boolean;
  events?: TimelineEventMarker[];
  /** Show only phases up to currentPhase as a compact strip (dashboard). */
  compact?: boolean;
}

const KIND_ICON = {
  success: { char: '✓', color: 'text-success' },
  info: { char: '·', color: 'text-info' },
  warning: { char: '⚠', color: 'text-warning' },
  danger: { char: '✕', color: 'text-danger' },
};

export function phaseIndexForProgress(progress: number): number {
  // Mirrors the simulation's phase thresholds.
  if (progress >= 95) return 7;
  if (progress >= 90) return 6;
  if (progress >= 80) return 5;
  if (progress >= 55) return 4;
  if (progress >= 40) return 3;
  if (progress >= 12) return 2;
  if (progress >= 3) return 1;
  return 0;
}

export const MISSION_PHASES = [
  'Launch',
  'Cruise',
  'Approach',
  'Orbit / Encounter',
  'Science Operations',
  'Data Collection',
  'Data Transmission',
  'Mission Complete',
];

export default function MissionTimeline({ phases, currentPhase, complete = false, events = [], compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
        {phases.map((phase, idx) => {
          const done = complete || idx < currentPhase;
          const active = !complete && idx === currentPhase;
          return (
            <React.Fragment key={`phase-${phase}`}>
              <div className="flex flex-col items-center min-w-[64px]">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-colors ${
                    done
                      ? 'bg-success text-white'
                      : active
                        ? 'bg-primary text-white pulse-glow'
                        : 'bg-muted border border-border text-muted-foreground'
                  }`}
                >
                  {done ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-[8px] font-mono uppercase text-center leading-tight mt-1 ${
                    active ? 'text-primary font-bold' : done ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {phase}
                </span>
              </div>
              {idx < phases.length - 1 && (
                <div className={`h-px flex-1 min-w-[6px] ${done ? 'bg-success/60' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative pl-1">
      {phases.map((phase, idx) => {
        const done = complete || idx < currentPhase;
        const active = !complete && idx === currentPhase;
        const phaseEvents = events.filter(e => e.phaseIndex === idx);
        return (
          <div key={`tl-phase-${phase}`} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line */}
            {idx < phases.length - 1 && (
              <div
                className={`absolute left-[9px] top-5 bottom-0 w-px ${done ? 'bg-success/50' : 'bg-border'}`}
                aria-hidden="true"
              />
            )}
            {/* Node */}
            <div
              className={`relative z-10 w-[19px] h-[19px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-mono font-bold transition-colors ${
                done
                  ? 'bg-success text-white'
                  : active
                    ? 'bg-primary text-white'
                    : 'bg-muted border border-border text-muted-foreground'
              }`}
              style={active ? { boxShadow: 'var(--glow-primary)' } : undefined}
            >
              {done ? <Check size={10} /> : idx + 1}
            </div>
            {/* Content */}
            <div className="min-w-0 flex-1">
              <div
                className={`text-xs font-medium leading-5 ${
                  active ? 'text-primary font-semibold' : done ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {phase}
                {active && <span className="ml-2 badge badge-info text-[8px]">Current phase</span>}
              </div>
              {phaseEvents.map(ev => {
                const icon = KIND_ICON[ev.kind];
                return (
                  <div key={ev.id} className={`text-[11px] flex items-start gap-1.5 mt-1 ${icon.color}`}>
                    <span className="font-mono flex-shrink-0">{icon.char}</span>
                    <span className="text-muted-foreground">{ev.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AlertTriangleIcon() {
  return <AlertTriangle size={10} />;
}
