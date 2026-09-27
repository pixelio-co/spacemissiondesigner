'use client';

/**
 * MissionControlDashboard — mission-control style operating view.
 *
 * Sections (kept deliberately clean): MISSION STATUS · SYSTEM STATUS ·
 * SCIENCE · EVENTS · DECISION, plus the phase timeline, trajectory view,
 * and the communication-delay indicator.
 */

import React from 'react';
import type { MissionState } from '@/lib/missionData';
import { DESTINATIONS, OBJECTIVES, INSTRUMENTS } from '@/lib/missionData';
import { getDestinationFacts } from '@/lib/spaceData';
import { getCommDelay, MISSION_PHASES, type SimPhase, type LogEntry, type SystemStatus, type EventCategory } from '@/lib/simulationEngine';
import TrajectoryView from './TrajectoryView';
import SystemGauges from './SystemGauges';
import { Rocket, Radio, Zap, Navigation, FlaskConical, Satellite, Activity, ChevronRight, Clock, ShieldAlert } from 'lucide-react';

interface Props {
  mission: MissionState;
  phase: SimPhase;
  progress: number;
  systems: SystemStatus;
  log: LogEntry[];
  logRef: React.RefObject<HTMLDivElement | null>;
  isRunning: boolean;
  onLaunch: () => void;
  commPing: 'none' | 'sent' | 'in-transit' | 'received';
  events: { category: EventCategory; title: string }[];
  decisions: string[];
  scienceModifier: number;
  configSummary: { label: string; detail: string }[];
}

const phaseLabels: Record<SimPhase, string> = {
  'pre-launch': 'PRE-LAUNCH',
  'launch': 'LAUNCH',
  'cruise': 'CRUISE',
  'approach': 'APPROACH',
  'encounter': 'ORBIT / ENCOUNTER',
  'science-operations': 'SCIENCE OPERATIONS',
  'data-collection': 'DATA COLLECTION',
  'data-transmission': 'DATA TRANSMISSION',
  'complete': 'COMPLETE',
};

export default function MissionControlDashboard({
  mission, phase, progress, systems, log, logRef, isRunning, onLaunch,
  commPing, events, decisions, scienceModifier, configSummary,
}: Props) {
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;
  const facts = mission.destination ? getDestinationFacts(mission.destination) : null;
  const objInfo = mission.objective ? OBJECTIVES[mission.objective] : null;
  const delay = getCommDelay(mission.destination);
  const milestoneDone = (id: string) =>
    progress >= (MISSION_PHASES.find(m => m.id === id)?.at ?? 0);

  const activeDecision = decisions.length > 0 ? decisions[decisions.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
            <span className="badge badge-info font-mono text-xs">{phaseLabels[phase]}</span>
            {commPing !== 'none' && commPing !== 'received' && (
              <span className="badge badge-warning font-mono text-xs animate-pulse">
                {commPing === 'sent' ? 'COMMAND SENT' : 'SIGNAL IN TRANSIT…'}
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

      {/* Phase timeline */}
      <div className="space-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Mission Timeline
          </span>
          <span className="text-xs font-bold font-mono text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="score-bar-track mb-4">
          <div className="score-bar-fill bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {MISSION_PHASES.map((m, idx) => {
            const done = milestoneDone(m.id) && phase !== 'pre-launch';
            const active = phaseLabels[phase] === phaseLabels[m.phase];
            return (
              <React.Fragment key={m.id}>
                <div className="flex flex-col items-center gap-1 min-w-[64px]">
                  <div
                    className={`stage-indicator ${done ? 'completed' : active ? 'active' : 'pending'}`}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[8px] font-medium uppercase tracking-wide leading-tight text-center ${
                      active ? 'text-primary font-bold' : done ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
                {idx < MISSION_PHASES.length - 1 && (
                  <div className={`flex-1 h-px min-w-[6px] ${done ? 'bg-success' : 'bg-border'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Educational visualization — phases represent mission stages, not exact real-time events.
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-4">
        <div className="space-y-4">
          {/* Mission status cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {configSummary.map(item => (
              <div key={item.label} className="space-card p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
                <div className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{item.detail}</div>
              </div>
            ))}
          </div>

          {/* Trajectory / solar system view */}
          <div className="space-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mission Trajectory
              </div>
              {facts && (
                <div className="text-[10px] text-muted-foreground font-mono">
                  {facts.earthDistanceMillionKm} from Earth
                </div>
              )}
            </div>
            <TrajectoryView
              destination={mission.destination}
              progress={progress}
              phase={phase}
            />
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Educational visualization — not to scale, not a real-time ephemeris.
            </p>
          </div>

          {/* System gauges */}
          <SystemGauges systems={systems} />

          {/* Communication status strip */}
          <div className="space-card p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-info" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">One-way light time</div>
                <div className="text-sm font-mono font-bold text-info">{delay.oneWayLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${commPing === 'sent' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  MISSION CONTROL: “Command sent.”
                </span>
                <ChevronRight size={12} className="text-muted-foreground" />
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${commPing === 'in-transit' ? 'bg-warning/20 text-warning animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                  SIGNAL IN TRANSIT…
                </span>
                <ChevronRight size={12} className="text-muted-foreground" />
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${commPing === 'received' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                  SPACECRAFT RECEIVES
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground basis-full leading-relaxed">
              {delay.source} This is why distant spacecraft operate autonomously.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Science panel */}
          <div className="space-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical size={14} className="text-success" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Science</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Instruments selected</span>
                <span className="font-mono font-bold text-foreground">{mission.instruments.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Observation types enabled</span>
                <span className="font-mono font-bold text-foreground">
                  {new Set(mission.instruments).size > 0 ? `${mission.instruments.length} classes` : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Data-return capability</span>
                <span className={`font-mono font-bold ${systems.communication >= 60 ? 'text-success' : systems.communication >= 35 ? 'text-warning' : 'text-danger'}`}>
                  {systems.communication >= 80 ? 'HIGH' : systems.communication >= 55 ? 'MEDIUM' : systems.communication >= 30 ? 'LOW' : 'CRITICAL'}
                </span>
              </div>
              {mission.instruments.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {mission.instruments.map(inst => (
                    <span key={`sci-inst-${inst}`} className="badge badge-neutral text-[9px] normal-case">
                      {INSTRUMENTS[inst].label}
                    </span>
                  ))}
                </div>
              )}
              {scienceModifier !== 0 && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  Decision modifier active: your choices are affecting science throughput ({scienceModifier > 0 ? '+' : ''}{scienceModifier}).
                </p>
              )}
            </div>
          </div>

          {/* Decision panel */}
          <div className="space-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decision</span>
            </div>
            {phase === 'pre-launch' ? (
              <p className="text-xs text-muted-foreground">
                No decisions yet. Launch to begin — your configuration will shape which challenges appear.
              </p>
            ) : activeDecision ? (
              <div>
                <div className="text-xs text-foreground font-medium mb-1">Latest decision</div>
                <p className="text-xs text-accent leading-relaxed">{activeDecision}</p>
                {decisions.length > 1 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {decisions.length} decisions made this mission.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isRunning
                  ? 'Monitoring… events may require your decision.'
                  : 'Awaiting mission events.'}
              </p>
            )}
          </div>

          {/* Event log */}
          <div className="space-card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Satellite size={14} className="text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mission Events
                </span>
              </div>
              {isRunning && (
                <div className="flex items-center gap-1.5">
                  <span className="pulse-dot online" />
                  <span className="text-xs text-success font-mono">LIVE</span>
                </div>
              )}
            </div>

            {/* Warning/danger events summary */}
            {events.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {events.map((ev, i) => (
                  <span
                    key={`evt-${ev.category}-${i}`}
                    className="badge badge-warning text-[9px] normal-case inline-flex items-center gap-1"
                  >
                    <ShieldAlert size={9} />
                    {ev.title}
                  </span>
                ))}
              </div>
            )}

            <div
              ref={logRef}
              className="flex-1 overflow-y-auto space-y-2 min-h-[260px] max-h-[420px] pr-1"
              role="log"
              aria-live="polite"
              aria-label="Mission event log"
            >
              {log.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">🚀</div>
                  <p className="text-xs text-muted-foreground">
                    {phase === 'pre-launch'
                      ? 'Launch your mission to begin receiving telemetry.'
                      : 'Awaiting telemetry…'}
                  </p>
                </div>
              ) : (
                log.map(entry => (
                  <div
                    key={entry.id}
                    className={`mission-log-entry ${entry.type} py-1 ${entry.isDecision ? 'font-semibold' : ''}`}
                  >
                    <span className="text-muted-foreground mr-2">[{entry.missionTime}]</span>
                    {entry.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
