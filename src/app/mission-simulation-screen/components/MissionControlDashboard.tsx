'use client';

import React from 'react';
import type { MissionState, AnalysisScores } from '@/lib/missionData';
import { DESTINATIONS, SPACECRAFT_TYPES, OBJECTIVES } from '@/lib/missionData';
import type { SimPhase, LogEntry, SystemStatus } from './SimulationClient';
import TrajectoryView from './TrajectoryView';
import SystemGauges from './SystemGauges';
import { Rocket, Radio, Zap, Navigation } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface Props {
  mission: MissionState;
  phase: SimPhase;
  progress: number;
  systems: SystemStatus;
  log: LogEntry[];
  logRef: React.RefObject<HTMLDivElement>;
  isRunning: boolean;
  onLaunch: () => void;
  scores: AnalysisScores;
}

const phaseLabels: Record<SimPhase, string> = {
  'pre-launch': 'PRE-LAUNCH',
  'launch': 'LAUNCH',
  'transit': 'TRANSIT',
  'approach': 'APPROACH',
  'operations': 'SCIENCE OPERATIONS',
  'complete': 'COMPLETE',
};

const phaseColors: Record<SimPhase, string> = {
  'pre-launch': 'text-muted-foreground',
  'launch': 'text-accent',
  'transit': 'text-info',
  'approach': 'text-warning',
  'operations': 'text-success',
  'complete': 'text-success',
};

export default function MissionControlDashboard({
  mission, phase, progress, systems, log, logRef, isRunning, onLaunch, scores
}: Props) {
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;
  const scInfo = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;
  const objInfo = mission.objective ? OBJECTIVES[mission.objective] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
            <span className={`badge badge-info font-mono text-xs`}>
              {phaseLabels[phase]}
            </span>
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

      {/* Progress bar */}
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
        <div className="flex items-center justify-between mt-2">
          {(['pre-launch', 'launch', 'transit', 'approach', 'operations', 'complete'] as SimPhase[]).map((p) => (
            <span key={`phase-step-${p}`} className={`text-[9px] font-mono uppercase ${phase === p ? phaseColors[p] + ' font-bold' : 'text-muted-foreground'}`}>
              {phaseLabels[p]}
            </span>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Trajectory */}
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

          {/* System Gauges */}
          <SystemGauges systems={systems} />

          {/* Mission info strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Rocket, label: 'Spacecraft', value: scInfo?.label ?? '—' },
              { icon: Navigation, label: 'Destination', value: destInfo?.label ?? '—' },
              { icon: Radio, label: 'Signal Delay', value: destInfo?.communicationDelay ?? '—' },
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
                  {phase === 'pre-launch' ?'Launch your mission to begin receiving telemetry.' :'Awaiting telemetry...'}
                </p>
              </div>
            ) : (
              log.map((entry) => (
                <div key={entry.id} className={`mission-log-entry ${entry.type} py-1`}>
                  <span className="text-muted-foreground mr-2">[{entry.time}]</span>
                  {entry.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}