'use client';

/**
 * SimulationClient — orchestrates the mission simulation.
 *
 * Rebuilt around the transparent simulation engine:
 * - 8-phase timeline (launch → cruise → approach → encounter → science →
 *   data collection → transmission → complete) highlighted as it runs.
 * - Events fire from configuration predicates + weighted randomness (no two
 *   runs identical, but the config clearly matters).
 * - Communication uses real one-way light-time: "Command sent" →
 *   "SIGNAL IN TRANSIT" → "Spacecraft receives command".
 * - Science is gated by instrument eligibility (camera → imaging, radar →
 *   subsurface, etc.) and run as transparent probabilistic checks.
 * - Decisions feed a science modifier; outcomes use the actual run history.
 * - Completed missions are archived for the Replay + Learn pages.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Rocket, AlertTriangle } from 'lucide-react';
import type { MissionState, MissionResultData } from '@/lib/missionData';
import { DESTINATIONS, SPACECRAFT_TYPES, calculateMissionScores } from '@/lib/missionData';
import {
  loadActiveMission,
  clearActiveMission,
  clearMissionResult,
  saveCompletedMission,
  saveLearnedLessons,
  saveMissionResult,
  type MissionRecord,
} from '@/lib/missionArchive';
import { computeMissionDNA } from '@/lib/missionDNA';
import {
  MISSION_PHASES,
  makeLogId,
  getCommDelay,
  runScienceChecks,
  computeMissionOutcome,
  buildInvestigation,
  buildLessons,
  selectEligibleEvents,
  pickEvent,
  configSummary,
  type SimPhase,
  type LogEntry,
  type SystemStatus,
  type MissionEventDef,
  type DecisionDef,
  type DecisionOption,
  type ScienceStats,
  type EventCategory,
} from '@/lib/simulationEngine';
import MissionControlDashboard from './MissionControlDashboard';
import DecisionModal from './DecisionModal';
import MissionResultScreen from './MissionResultScreen';

export type { SimPhase, LogEntry, SystemStatus };

interface Props {
  /** When replaying, this mission is simulated instead of the stored one. */
  overrideMission?: MissionState | null;
  onMissionComplete?: (record: {
    result: MissionResultData;
    science: ScienceStats;
    events: { category: EventCategory; title: string }[];
    decisions: string[];
  }) => void;
}

const INITIAL_SYSTEMS: SystemStatus = {
  power: 100,
  communication: 100,
  propulsion: 100,
  instruments: 100,
  navigation: 100,
  radiation: 0,
};

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
          Create and launch a mission before entering Mission Control.
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

export default function SimulationClient({ overrideMission = null, onMissionComplete }: Props = {}) {
  const router = useRouter();

  const [mission, setMission] = useState<MissionState | null>(null);
  const [checked, setChecked] = useState(false);
  const [phase, setPhase] = useState<SimPhase>('pre-launch');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [systems, setSystems] = useState<SystemStatus>({ ...INITIAL_SYSTEMS });
  const [progress, setProgress] = useState(0);
  const [decisionPrompt, setDecisionPrompt] = useState<DecisionDef | null>(null);
  const [pendingDecisionEvent, setPendingDecisionEvent] = useState<MissionEventDef | null>(null);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [eventsFired, setEventsFired] = useState<{ category: EventCategory; title: string }[]>([]);
  const [scienceModifier, setScienceModifier] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MissionResultData | null>(null);
  const [resultScience, setResultScience] = useState<ScienceStats | null>(null);
  const [commPing, setCommPing] = useState<'none' | 'sent' | 'in-transit' | 'received'>('none');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  // Mutable run state used inside the interval (avoids stale closures).
  const firedEventsRef = useRef<Set<string>>(new Set());
  const phaseIdxRef = useRef(0);
  const pausedRef = useRef(false);
  const eventLogRef = useRef<{ category: EventCategory; title: string }[]>([]);
  const decisionsRef = useRef<string[]>([]);
  const scienceModRef = useRef(0);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'neutral', isDecision = false) => {
    const entry: LogEntry = {
      id: makeLogId(),
      missionTime: `T+${String(Math.round(progress)).padStart(3, '0')}`,
      message,
      type,
      isDecision,
    };
    setLog(prev => [...prev, entry]);
  }, [progress]);

  // Hydrate mission: replay override → stored mission.
  useEffect(() => {
    if (overrideMission) {
      setMission(overrideMission);
      setChecked(true);
      return;
    }
    setMission(loadActiveMission());
    setChecked(true);
  }, [overrideMission]);

  const applySystemEffect = useCallback((effect: Partial<SystemStatus>) => {
    setSystems(prev => {
      const next = { ...prev };
      (Object.keys(effect) as (keyof SystemStatus)[]).forEach(key => {
        const delta = effect[key] ?? 0;
        next[key] = Math.max(0, Math.min(100, prev[key] + delta));
      });
      return next;
    });
  }, []);

  const handleDecision = useCallback((option: DecisionOption) => {
    if (!pendingDecisionEvent) return;
    applySystemEffect(option.effect);
    if (typeof option.scienceDelta === 'number') {
      scienceModRef.current += option.scienceDelta;
      setScienceModifier(scienceModRef.current);
    }
    decisionsRef.current = [...decisionsRef.current, option.label];
    setDecisions(decisionsRef.current);
    addLog(`DECISION: ${option.label}`, 'info', true);
    addLog(`Outcome: ${option.consequence}`, 'success');
    if (option.lesson) {
      addLog(`Lesson: ${option.lesson}`, 'neutral');
    }
    setDecisionPrompt(null);
    setPendingDecisionEvent(null);
    pausedRef.current = false;
    toast.success(option.consequence);
  }, [pendingDecisionEvent, applySystemEffect, addLog]);

  const finishMission = useCallback((
    finalMission: MissionState,
    finalSystems: SystemStatus,
    events: { category: EventCategory; title: string }[],
    playerDecisions: string[],
    mod: number,
  ) => {
    const { stats } = runScienceChecks(finalMission, finalSystems, mod);
    const outcome = computeMissionOutcome(finalMission, finalSystems, stats, events.length);
    const lessons = buildLessons(finalMission, finalSystems, stats, playerDecisions);
    const investigation = buildInvestigation(outcome, finalSystems, events, playerDecisions);
    const scores = calculateMissionScores(finalMission);

    const missionResult: MissionResultData = {
      type: outcome.category === 'successful' ? 'success'
        : outcome.category === 'successful-with-challenges' ? 'success-challenges'
        : outcome.category === 'partially-successful' ? 'partial'
        : outcome.category === 'ended-early' ? 'failure'
        : 'breakthrough',
      title: outcome.label,
      subtitle: outcome.subtitle,
      // The legacy ScenarioType union is retired; the live engine's outcome
      // category is the scenario of record. Cast keeps the result shape stable.
      scenario: outcome.category as unknown as MissionResultData['scenario'],
      objectivesCompleted: [
        ...(stats.observationsCompleted > 0
          ? [`${stats.observationsCompleted} scientific observations completed`]
          : []),
        ...(stats.instrumentsOperated > 0
          ? [`${stats.instrumentsOperated} of ${finalMission.instruments.length} instruments operated successfully`]
          : []),
        ...(stats.majorFindings > 0
          ? [`${stats.majorFindings} major scientific finding${stats.majorFindings === 1 ? '' : 's'}`]
          : []),
        ...(playerDecisions.length > 0
          ? [`Autonomy decision: ${playerDecisions[playerDecisions.length - 1]}`]
          : []),
      ],
      objectivesMissed: [
        ...(stats.objectivesCompletedPercent < 100
          ? [`${100 - stats.objectivesCompletedPercent}% of scientific objectives not completed`]
          : []),
        ...(finalSystems.power < 55 ? ['Full power margin maintained throughout the mission'] : []),
        ...(finalSystems.communication < 55 ? ['Uninterrupted communication with Earth'] : []),
      ],
      eventsEncountered: events.map(e => e.title),
      playerDecisionSummary: playerDecisions.length > 0
        ? playerDecisions.join(' → ')
        : 'No decision required',
      lessons,
      dataCollected: [
        ...(stats.observationsCompleted > 0 ? [`${stats.dataReturned} of science data returned to Earth`] : []),
        ...finalMission.instruments.map(i => {
          const names: Record<string, string> = {
            camera: 'Imaging data archived', spectrometer: 'Spectral data archived',
            radar: 'Radar soundings archived', magnetometer: 'Magnetic field data archived',
            thermal: 'Thermal maps archived', atmospheric: 'Atmospheric profiles archived',
            radiation: 'Radiation measurements archived', seismometer: 'Seismic data archived',
            particle: 'Particle/plasma data archived',
          };
          return names[i] ?? `${i} data archived`;
        }),
      ],
      recommendations: outcome.category === 'partially-successful' || outcome.category === 'ended-early' ? [
        ...(finalSystems.power < 55 ? ['Review your power system choice against your destination’s real sunlight level'] : []),
        ...(finalSystems.communication < 55 ? ['A stronger communication system would return more of your science'] : []),
        ...(finalMission.instruments.length > 5 ? ['Consider a smaller, focused instrument suite'] : []),
      ] : [],
    };

    // Capture the finished run into the in-memory session archive so Replay,
    // the Learn page and the result page can use it — for THIS session only.
    const dna = computeMissionDNA(finalMission, scores);
    const record: MissionRecord = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      completedAt: Date.now(),
      mission: finalMission,
      result: missionResult,
      dna,
      scienceStats: stats,
      timeline: events.map(e => ({
        label: e.title,
        status: (e.category === 'power' || e.category === 'comm' ? 'warn' : 'bad') as 'warn' | 'bad',
      })),
      keyDecision: missionResult.playerDecisionSummary,
    };
    saveCompletedMission(record);
    saveLearnedLessons(lessons, finalMission.missionName || 'Mission Alpha');
    saveMissionResult({
      mission: finalMission,
      result: missionResult,
      science: stats,
      investigation,
      events,
    });
    // The run is finished history, not a draft: clear the active mission so the
    // designer/What-If no longer show it as work in progress.
    clearActiveMission();

    setResult(missionResult);
    setResultScience(stats);
    // Expose investigation data to the result screen for this render.
    (missionResult as MissionResultData & { investigation?: unknown }).investigation = investigation;

    onMissionComplete?.({
      result: missionResult,
      science: stats,
      events,
      decisions: playerDecisions,
    });
  }, [onMissionComplete]);

  const handleLaunch = useCallback(() => {
    if (!mission) return;
    setIsRunning(true);
    setPhase('launch');
    firedEventsRef.current = new Set();
    phaseIdxRef.current = 0;
    pausedRef.current = false;
    eventLogRef.current = [];
    decisionsRef.current = [];
    scienceModRef.current = 0;
    addLog(`LAUNCH SEQUENCE INITIATED for ${mission.missionName || 'Mission Alpha'}.`, 'info');
    const delay = getCommDelay(mission.destination);
    addLog(
      `Note: one-way light time to ${mission.destination ? DESTINATIONS[mission.destination].label : 'target'} is ${delay.oneWayLabel}. Real-time control is impossible at this distance — autonomy matters.`,
      'neutral',
    );
    toast.success('Mission launched! Monitoring all systems.');
  }, [mission, addLog]);

  // Main simulation loop.
  useEffect(() => {
    if (!mission || !isRunning || result) return;
    const scores = calculateMissionScores(mission);
    const delay = getCommDelay(mission.destination);

    const tick = () => {
      if (pausedRef.current) return;

      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          setPhase('complete');
          setIsRunning(false);
          addLog('MISSION COMPLETE. Compiling final report…', 'success');
          setTimeout(() => {
            finishMission(mission, systemsRef.current, eventLogRef.current, decisionsRef.current, scienceModRef.current);
          }, 600);
          return 100;
        }

        // Phase milestones
        while (phaseIdxRef.current < MISSION_PHASES.length) {
          const milestone = MISSION_PHASES[phaseIdxRef.current];
          if (next >= milestone.at) {
            setPhase(milestone.phase);
            const phaseMsg: Record<string, string> = {
              launch: 'Launch confirmed — spacecraft separated from the launch vehicle.',
              cruise: `Cruise phase begins. En route to ${mission.destination ? DESTINATIONS[mission.destination].label : 'destination'}.`,
              approach: 'Approach phase — optical navigation and final trajectory trim.',
              encounter: 'ORBIT / ENCOUNTER — the spacecraft has arrived at its target.',
              'science-operations': 'Science operations phase — instruments are acquiring data.',
              'data-collection': 'Data collection continuing — observations are being stored onboard.',
              'data-transmission': 'Data transmission phase — downlink to Earth in progress.',
              complete: 'Mission complete.',
            };
            addLog(phaseMsg[milestone.id] ?? milestone.label, 'success');
            phaseIdxRef.current += 1;
          } else break;
        }

        // Periodic comm ping animation
        if (next % 12 === 0 && decisionPrompt === null) {
          setCommPing('sent');
          setTimeout(() => setCommPing('in-transit'), 500);
          setTimeout(() => {
            setCommPing('received');
            addLog(
              `Spacecraft received command sent ${(delay.oneWaySeconds / 60).toFixed(1)} min ago (one-way light time).`,
              'info',
            );
          }, Math.min(600 + delay.oneWaySeconds * 2, 2200));
        }

        // Event selection (weighted by configuration)
        if (!pausedRef.current && next > 12 && decisionPrompt === null) {
          const eligible = selectEligibleEvents(mission, scores, next, firedEventsRef.current);
          const ev = pickEvent(eligible, mission, scores);
          if (ev && Math.random() < 0.02 + eligible.length * 0.008) {
            firedEventsRef.current.add(ev.id);
            eventLogRef.current = [...eventLogRef.current, { category: ev.category, title: ev.title }];
            setEventsFired([...eventLogRef.current]);
            applySystemEffect(ev.impact);
            addLog(`⚠ ${ev.title}: ${ev.log}`, ev.logType);
            if (ev.decision) {
              pausedRef.current = true;
              setTimeout(() => {
                setPendingDecisionEvent(ev);
                setDecisionPrompt(ev.decision ?? null);
              }, 900);
            }
          }
        }

        return next;
      });
    };

    timerRef.current = setInterval(tick, 160);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mission, isRunning, result, applySystemEffect, addLog, finishMission, decisionPrompt]);

  // Keep a ref of systems for the completion path.
  const systemsRef = useRef<SystemStatus>({ ...INITIAL_SYSTEMS });
  useEffect(() => {
    systemsRef.current = systems;
  }, [systems]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Initializing Mission Control…</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return <NoActiveMission />;
  }

  if (result) {
    return (
      <MissionResultScreen
        result={result}
        mission={mission}
        science={resultScience}
        investigation={(result as MissionResultData & { investigation?: import('@/lib/simulationEngine').InvestigationNode }).investigation ?? null}
        events={eventsFired}
        onRestart={() => {
          // "Design New Mission" starts a truly fresh session mission: clear
          // both the active mission and the current result, then return to the
          // designer. Completed runs stay in the in-memory archive for Replay
          // while this browser session remains open.
          clearMissionResult();
          clearActiveMission();
          router.push('/mission-designer');
        }}
      />
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
      <MissionControlDashboard
        mission={mission}
        phase={phase}
        progress={progress}
        systems={systems}
        log={log}
        logRef={logRef}
        isRunning={isRunning}
        onLaunch={handleLaunch}
        commPing={commPing}
        events={eventsFired}
        decisions={decisions}
        scienceModifier={scienceModifier}
        configSummary={configSummary(mission)}
      />

      {decisionPrompt && (
        <DecisionModal
          prompt={decisionPrompt}
          onDecide={handleDecision}
        />
      )}
    </div>
  );
}
