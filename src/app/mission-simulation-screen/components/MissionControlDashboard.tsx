'use client';

import React from 'react';
import type { MissionState } from '@/lib/missionData';
import { DESTINATIONS, SPACECRAFT_TYPES, OBJECTIVES } from '@/lib/missionData';
import type { SimPhase, LogEntry } from './SimulationClient';
import type { SystemStatus } from '@/lib/simTypes';
import type { ScienceDiscovery } from '@/lib/scienceEngine';
import type { AutonomyChoice } from '@/lib/simulationEngine';
import TrajectoryView from './TrajectoryView';
import SystemGauges from './SystemGauges';
import MissionTimeline, { MISSION_PHASES, phaseIndexForProgress } from '@/components/ui/MissionTimeline';
import SolarSystemView from '@/components/ui/SolarSystemView';
import { Rocket, Radio, Zap, Navigation, Satellite, FlaskConical } from 'lucide-react';

interface Props {
  mission: MissionState;
  phase: SimPhase;
  progress: number;
  systems: SystemStatus;
  log: LogEntry[];
  logRef: React.RefObject<HTMLDivElement | null>;
  isRunning: boolean;
  onLaunch: () => void;
  transit: { label: string; progress: number } | null;
  autonomyChoice: AutonomyChoice | null;
  currentDecisionLabel: string;
  discoveries: ScienceDiscovery[];
}

const phaseLabels: Record<SimPhase, string> = {
  'pre-launch': 'PRE-LAUNCH',
  'launch': 'LAUNCH',
  'transit': 'TRANSIT',
  'approach': 'APPROACH',
  'operations': 'SCIENCE OPERATIONS',
  'complete': 'COMPLETE',
};

export default function MissionControlDashboard({
  mission, phase, progress, systems, log, logRef, isRunning, onLaunch,
  transit, autonomyChoice, currentDecisionLabel, discoveries,
}: Props) {
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;
  const scInfo = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;
  const objInfo = mission.objective ? OBJECTIVES[mission.objective] : null;

  const tlPhase = phase === 'pre-launch' ? 0 : phaseIndexForProgress(progress);
  const timelineEvents = log
    .filter(l => l.type === 'warning' || l.type === 'danger')
    .slice(-4)
    .map(l => ({
      id: l.id,
      phaseIndex: phaseIndexForProgress(progress),
      label: l.message.slice(0, 80),
      kind: l.type as 'warning' | 'danger',
    }));
  void timelineEvents; // detailed markers shown in log; compact strip used for phases

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
            <span className={`badge badge-info font-mono text-xs`}>
              {phaseLabels[phase]}
            </span>
            {transit && (
              <span className="badge badge-warning font-mono text-xs animate-pulse-glow">
                {transit.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            {mission.missionName || 'Mission Alpha'} · {destInfo?.label ?? 'Unknown'} · {objInfo?.label ?? 'Unknown'}
          </p>
        </div>

        {phase === 'pre-launch' && (
          <button onClick={onLaunch} className="btn-accent text-base px-8 py-3">
            <Rocket size={18} />
            Launch Mission
          </button>
        )}
      </div>

      {/* Progress + timeline */}
      <div className="space-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Mission Progress</span>
          <span className="text-xs font-mono font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="score-bar-track">
          <div
            className="score-bar-fill bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4">
          <MissionTimeline
            phases={MISSION_PHASES}
            currentPhase={tlPhase}
            complete={phase === 'complete'}
            compact
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Trajectory + Solar System */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Spacecraft Trajectory
              </div>
              <TrajectoryView
                destination={mission.destination}
                progress={progress}
                phase={phase}
              />
            </div>
            <div className="space-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Solar System Position
              </div>
              <SolarSystemView
                destination={mission.destination}
                progress={progress}
                phaseLabel={phaseLabels[phase]}
                height={200}
              />
            </div>
          </div>

          {/* System Gauges */}
          <SystemGauges systems={systems} />

          {/* Science discoveries */}
          <div className="space-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={13} className="text-success" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Science Discoveries
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{discoveries.length} observations</span>
            </div>
            {discoveries.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                {mission.instruments.length === 0
                  ? 'No instruments were selected — no science observations are possible.'
                  : 'Observations will appear here as your instruments operate during the encounter.'}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {discoveries.map(d => (
                  <div key={d.id} className="flex items-start gap-2 text-xs p-2 rounded bg-success/5 border border-success/15">
                    <span className={`mt-0.5 ${d.significance === 'major' ? 'text-accent' : 'text-success'}`}>
                      {d.significance === 'major' ? '★' : '·'}
                    </span>
                    <div>
                      <span className="text-foreground font-medium">{d.label}</span>
                      <span className="text-muted-foreground"> — {d.instrumentLabel}</span>
                      {d.significance === 'major' && (
                        <span className="badge badge-warning text-[8px] ml-2">Major finding</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mission info strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Rocket, label: 'Spacecraft', value: scInfo?.label ?? '—' },
              { icon: Navigation, label: 'Destination', value: destInfo?.label ?? '—' },
              { icon: Radio, label: 'Signal Delay (one-way)', value: destInfo?.communicationDelay ?? '—' },
              { icon: Zap, label: 'Propulsion', value: mission.propulsion?.replace('-', ' ').toUpperCase() ?? '—' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={`info-${item.label}`} className="space-card p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-primary" />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate">{item.value}</div>
                </div>
              );
            })}
          </div>

          {/* Current decision status */}
          <div className="space-card p-3 flex items-center gap-3">
            <Satellite size={14} className={autonomyChoice ? 'text-success' : 'text-muted-foreground'} />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Decision / Autonomy Mode</div>
              <div className="text-xs font-semibold text-foreground truncate">
                {autonomyChoice
                  ? `Autonomous: ${autonomyChoice.replace('-', ' ')}`
                  : currentDecisionLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Event log */}
        <div className="space-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mission Event Log
            </div>
            {isRunning && (
              <div className="flex items-center gap-1.5">
                <span className="pulse-dot online" />
                <span className="text-xs text-success font-mono">LIVE</span>
              </div>
            )}
          </div>

          <div
            ref={logRef}
            className="flex-1 overflow-y-auto space-y-2 min-h-[300px] max-h-[500px] pr-1"
            role="log"
            aria-live="polite"
            aria-label="Mission event log"
          >
            {log.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">🚀</div>
                <p className="text-xs text-muted-foreground">
                  {phase === 'pre-launch' ? 'Launch your mission to begin receiving telemetry.' : 'Awaiting telemetry...'}
                </p>
              </div>
            ) : (
              log.map((entry) => (
                <div key={entry.id} className={`mission-log-entry ${entry.type} py-1`}>
                  <span className="text-muted-foreground mr-2">[{entry.time}]</span>
                  {entry.message}
                  {entry.cause && (
                    <span className="block text-[10px] text-muted-foreground/70 italic mt-0.5">↳ {entry.cause}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
