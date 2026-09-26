'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Rocket, AlertTriangle } from 'lucide-react';
import type { MissionState, MissionObjective, Destination, SpacecraftType, Instrument, Propulsion, Power, Communication } from '@/lib/missionData';
import { DESTINATIONS } from '@/lib/missionData';
import {
  runMission,
  resolveAutonomy,
  configurationFactors,
} from '@/lib/simulationEngine';
import type { SimulationRecord, MissionEvent, AutonomyChoice, RunResult } from '@/lib/simulationEngine';
import type { SystemStatus } from '@/lib/simTypes';
import { AUTONOMY_OPTIONS, SCENARIO_DEFINITIONS } from '@/lib/simTypes';
import { saveMissionRecord, clearActiveMission } from '@/lib/missionHistory';
import MissionControlDashboard from './MissionControlDashboard';
import DecisionModal from './DecisionModal';
import AutonomyModal from './AutonomyModal';
import MissionResultScreen from './MissionResultScreen';

// Unique log IDs — never array indexes (per project convention).
let _logIdCounter = 0;
function createUniqueLogId(): string {
  _logIdCounter += 1;
  return `log-${Date.now()}-${_logIdCounter}`;
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  cause?: string;
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export type SimPhase =
  | 'pre-launch' | 'launch' | 'transit' | 'approach' | 'operations' | 'complete';

function phaseForProgress(progress: number): SimPhase {
  if (progress >= 95) return 'complete';
  if (progress >= 55) return 'operations';
  if (progress >= 40) return 'approach';
  if (progress >= 12) return 'transit';
  return 'launch';
}

/**
 * Phase label for in-run events. Only reaching 100% progress marks the mission
 * complete — an event firing at 97% must NOT flip the phase to 'complete',
 * because that stops the simulation clock before the run can finish.
 */
function phaseForEventProgress(progress: number): SimPhase {
  if (progress >= 95) return 'operations';
  return phaseForProgress(progress);
}

interface TransitSignal {
  label: string;
  progress: number;
}

function buildMissionFromParams(params: URLSearchParams): MissionState {
  return {
    missionName: params.get('missionName') || 'Mission Alpha',
    objective: (params.get('objective') as MissionObjective) || null,
    destination: (params.get('destination') as Destination) || null,
    spacecraft: (params.get('spacecraft') as SpacecraftType) || null,
    instruments: (params.get('instruments') || '').split(',').filter(Boolean) as Instrument[],
    propulsion: (params.get('propulsion') as Propulsion) || null,
    power: (params.get('power') as Power) || null,
    communication: (params.get('communication') as Communication) || null,
    currentStage: 9,
    completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  };
}

function hasActiveMission(params: URLSearchParams): boolean {
  const destination = params.get('destination');
  const spacecraft = params.get('spacecraft');
  const objective = params.get('objective');
  return Boolean(destination && spacecraft && objective);
}

function NoActiveMission() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="space-card p-10 max-w-lg w-full text-center border-warning/40 border">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mx-auto mb-6">
          <AlertTriangle size={32} className="text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">No Active Mission</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Create and launch a mission before entering Mission Simulation.
          <br />
          <span className="text-sm mt-2 block">
            Design your spacecraft, choose your destination, and configure all systems
            in the Mission Designer — then launch to begin your simulation.
          </span>
        </p>
        <button
          onClick={() => router.push('/mission-designer')}
          className="btn-accent text-base px-8 py-3 inline-flex items-center gap-2"
        >
          <Rocket size={18} />
          Create Mission
        </button>
      </div>
    </div>
  );
}

export default function SimulationClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const missionActive = hasActiveMission(searchParams);
  const mission = useMemo(() => buildMissionFromParams(searchParams), [searchParams]);
  const replayId = searchParams.get('replay');
  const replayAutonomy = searchParams.get('autonomy') as AutonomyChoice | null;
  const replayLabel = searchParams.get('replayLabel');

  // Pre-compute the full mission story from the pure engine.
  const run: RunResult | null = useMemo(() => {
    if (!missionActive) return null;
    const opts: { autonomy?: AutonomyChoice } = {};
    if (replayAutonomy) opts.autonomy = replayAutonomy;
    return runMission(mission, opts);
  }, [mission, missionActive, replayAutonomy]);

  const [phase, setPhase] = useState<SimPhase>('pre-launch');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [systems, setSystems] = useState<SystemStatus>({
    power: 100, communication: 100, propulsion: 100, instruments: 100, navigation: 100, radiation: 0,
  });
  const [progress, setProgress] = useState(0);
  const [decisionEvent, setDecisionEvent] = useState<MissionEvent | null>(null);
  const [autonomyOpen, setAutonomyOpen] = useState(false);
  const [autonomyChoice, setAutonomyChoice] = useState<AutonomyChoice | null>(null);
  const [transit, setTransit] = useState<TransitSignal | null>(null);
  const [result, setResult] = useState<SimulationRecord | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDecisionLabel, setCurrentDecisionLabel] = useState<string>('None yet — awaiting events');
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  // Mutable run-state read by the interval tick (avoids effect re-subscription).
  const runStateRef = useRef({
    firedEvents: new Set<string>(),
    pendingDecision: null as MissionEvent | null,
    pendingAutonomy: false,
    autonomyChosen: null as AutonomyChoice | null,
    finished: false,
  });

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'neutral', cause?: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const entry: LogEntry = { id: createUniqueLogId(), time, message, type, cause };
    setLog(prev => [...prev, entry]);
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 50);
  }, []);

  const applyEffect = useCallback((effect?: Partial<SystemStatus>) => {
    if (!effect) return;
    setSystems(prev => {
      const next = { ...prev };
      (Object.keys(effect) as (keyof SystemStatus)[]).forEach(key => {
        next[key] = Math.max(0, Math.min(100, prev[key] + (effect[key] ?? 0)));
      });
      return next;
    });
  }, []);

  // Reset all run state (used by launch).
  const resetRun = useCallback(() => {
    runStateRef.current = {
      firedEvents: new Set(),
      pendingDecision: null,
      pendingAutonomy: false,
      autonomyChosen: replayAutonomy ?? null,
      finished: false,
    };
    setLog([]);
    setSystems({ power: 100, communication: 100, propulsion: 100, instruments: 100, navigation: 100, radiation: 0 });
    setProgress(0);
    setDecisionEvent(null);
    setAutonomyOpen(false);
    setAutonomyChoice(replayAutonomy ?? null);
    setTransit(null);
    setResult(null);
    setCurrentDecisionLabel('None yet — awaiting events');
    setSavedRecordId(null);
  }, [replayAutonomy]);

  const finishMission = useCallback(() => {
    if (runStateRef.current.finished || !run) return;
    runStateRef.current.finished = true;
    setPhase('complete');
    setIsRunning(false);
    addLog('Mission complete. Compiling final report…', 'success');

    const stored = saveMissionRecord(mission, run.record);
    setSavedRecordId(stored.id);
    setTimeout(() => setResult(run.record), 900);
  }, [run, mission, addLog]);

  // The single stable interval — reads all live state from refs.
  useEffect(() => {
    if (!missionActive || !isRunning || phase === 'complete') return;
    if (!run) return;

    const tick = () => {
      const st = runStateRef.current;
      setProgress(prev => {
        const next = Math.min(prev + 1.2, 100);

        for (const ev of run.record.events) {
          if (st.firedEvents.has(ev.id) || next < ev.atProgress) continue;
          st.firedEvents.add(ev.id);

          setPhase(phaseForEventProgress(ev.atProgress));
          addLog(ev.message, ev.type, ev.cause);

          if (ev.commDelay) {
            // Educational transit demo: command → in transit → received.
            setTransit({ label: 'COMMAND SENT', progress: 0 });
            setTimeout(() => setTransit({ label: 'SIGNAL IN TRANSIT…', progress: 50 }), 900);
            setTimeout(() => setTransit({ label: 'SPACECRAFT RECEIVES COMMAND', progress: 100 }), 2100);
            setTimeout(() => setTransit(null), 4200);
          }

          if (ev.requiresDecision && ev.scenario && !st.autonomyChosen) {
            st.pendingDecision = ev;
            setDecisionEvent(ev);
            setIsRunning(false);
          }
          if (ev.autonomyPrompt && !st.autonomyChosen) {
            st.pendingAutonomy = true;
            setAutonomyOpen(true);
            setIsRunning(false);
          }
        }

        if (next >= 100) {
          finishMission();
        }
        return next;
      });
    };

    timerRef.current = setInterval(tick, 170);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [missionActive, isRunning, phase, run, addLog, finishMission]);

  const handleDecision = useCallback((optionIndex: number, educationalWhy: string) => {
    const st = runStateRef.current;
    const ev = st.pendingDecision;
    if (!ev || !ev.scenario) return;

    const def = SCENARIO_DEFINITIONS[ev.scenario];
    const opt = def.decisionOptions[Math.min(optionIndex, def.decisionOptions.length - 1)];
    applyEffect(opt.effects);
    setCurrentDecisionLabel(opt.label);
    addLog(`Decision: ${opt.label}`, 'info');
    addLog(opt.consequence, 'success');
    addLog(`Why: ${opt.educationalWhy}`, 'neutral');
    toast.success(opt.consequence);
    st.pendingDecision = null;
    setDecisionEvent(null);
    setIsRunning(true);
  }, [applyEffect, addLog]);

  const handleAutonomyChoice = useCallback((choice: AutonomyChoice) => {
    const st = runStateRef.current;
    const outcome = resolveAutonomy(choice, configurationFactors(mission), systems);
    applyEffect(outcome.effects);
    setAutonomyChoice(choice);
    setCurrentDecisionLabel(`Autonomy: ${outcome.label}`);
    addLog(`Autonomous behavior: ${outcome.label}`, 'info');
    addLog(outcome.description, 'warning');
    addLog(outcome.educationalNote, 'neutral');
    toast.info(outcome.label);
    st.pendingAutonomy = false;
    st.autonomyChosen = choice;
    setAutonomyOpen(false);
    setIsRunning(true);
  }, [mission, systems, applyEffect, addLog]);

  const handleLaunch = useCallback(() => {
    resetRun();
    setIsRunning(true);
    setPhase('launch');
    addLog(`T+0 — ${mission.missionName || 'Mission Alpha'} launch sequence initiated.`, 'info');
    toast.success('Mission launched! Monitoring all systems.');
  }, [mission.missionName, resetRun, addLog]);

  // Auto-launch on arrival: arriving from the designer (or refreshing this page)
  // starts the mission immediately — no second Launch click required. Keyed to
  // the mission signature so a replay navigation (same page, new params) also
  // re-runs instead of showing the stale previous result.
  const missionSignature = [
    searchParams.get('objective'),
    searchParams.get('destination'),
    searchParams.get('spacecraft'),
    searchParams.get('instruments'),
    searchParams.get('propulsion'),
    searchParams.get('power'),
    searchParams.get('communication'),
    searchParams.get('replay'),
    searchParams.get('autonomy'),
    searchParams.get('replayLabel'),
  ].join('|');
  const launchedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!missionActive || !run) return;
    if (launchedForRef.current === missionSignature) return;
    launchedForRef.current = missionSignature;
    handleLaunch();
  }, [missionActive, run, handleLaunch, missionSignature]);

  // The launched mission lives entirely in the URL params. Once the simulation
  // page holds it, clear the stored designer draft so returning to the designer
  // starts a new design (one-time flight) — without repainting the designer at
  // stage 0 mid-navigation.
  useEffect(() => {
    if (missionActive) clearActiveMission();
  }, [missionActive]);

  // Guard: show no-active-mission screen if mission params are missing.
  if (!missionActive || !run) {
    return <NoActiveMission />;
  }

  if (result) {
    return (
      <MissionResultScreen
        record={result}
        replayMode={Boolean(replayId)}
        replayChangedLabel={replayLabel}
        savedRecordId={savedRecordId}
      />
    );
  }

  const visibleDiscoveries = run.record.discoveries.filter(d => {
    const opProgress = Number(d.time.replace('OPS+', '').replace('d', '')) / 1.8;
    return progress >= opProgress;
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
      {replayId && (
        <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30 flex items-center gap-2 flex-wrap">
          <span className="badge badge-warning text-[9px]">REPLAY</span>
          <p className="text-xs text-accent/90">
            Testing one changed decision{replayLabel ? `: ${replayLabel}` : ''}. Compare the outcome
            with your original mission at the end.
          </p>
        </div>
      )}

      <MissionControlDashboard
        mission={mission}
        phase={phase}
        progress={progress}
        systems={systems}
        log={log}
        logRef={logRef}
        isRunning={isRunning}
        onLaunch={handleLaunch}
        transit={transit}
        autonomyChoice={autonomyChoice}
        currentDecisionLabel={currentDecisionLabel}
        discoveries={visibleDiscoveries}
      />

      {decisionEvent && (
        <DecisionModal
          event={decisionEvent}
          onDecide={handleDecision}
        />
      )}

      {autonomyOpen && (
        <AutonomyModal
          options={AUTONOMY_OPTIONS}
          onChoose={handleAutonomyChoice}
          destinationLabel={mission.destination ? DESTINATIONS[mission.destination].label : ''}
          oneWayDelay={run.record.commDelayInfo.oneWay}
        />
      )}
    </div>
  );
}
