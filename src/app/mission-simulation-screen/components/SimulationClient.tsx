'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Rocket, AlertTriangle } from 'lucide-react';
import type { MissionState, ScenarioType, MissionResultData } from '@/lib/missionData';
import { DESTINATIONS, SPACECRAFT_TYPES, calculateMissionScores, determineScenario, generateMissionResult,  } from '@/lib/missionData';
import type {
  Destination, SpacecraftType, MissionObjective,
  Instrument, Propulsion, Power, Communication
} from '@/lib/missionData';
import MissionControlDashboard from './MissionControlDashboard';
import DecisionModal from './DecisionModal';
import MissionResultScreen from './MissionResultScreen';

// Module-level counter — guarantees unique IDs even when multiple entries
// are created within the same millisecond.
let _logIdCounter = 0;
function createUniqueLogId(): string {
  _logIdCounter += 1;
  return `log-${Date.now()}-${_logIdCounter}`;
}

export type SimPhase =
  | 'pre-launch' |'launch' |'transit' |'approach' |'operations' |'complete';

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface SystemStatus {
  power: number;
  communication: number;
  propulsion: number;
  instruments: number;
  navigation: number;
  radiation: number;
}

interface DecisionPrompt {
  title: string;
  description: string;
  options: { label: string; consequence: string; effect: Partial<SystemStatus> }[];
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
    completedStages: [0,1,2,3,4,5,6,7,8],
  };
}

function hasActiveMission(params: URLSearchParams): boolean {
  // A real mission must have at minimum a destination, spacecraft, and objective
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

const DECISION_PROMPTS: Record<string, DecisionPrompt> = {
  'power-challenge': {
    title: 'POWER SYSTEM WARNING',
    description: 'Power generation is below nominal levels. The spacecraft cannot sustain all systems at full capacity. How do you respond?',
    options: [
      { label: 'Reduce science instruments to minimum', consequence: 'Power stabilized. Some science data lost.', effect: { power: 20, instruments: -25 } },
      { label: 'Reduce communication activity', consequence: 'Power recovered. Data downlink rate reduced.', effect: { power: 15, communication: -20 } },
      { label: 'Continue normal operation', consequence: 'Power continues to degrade. Mission at risk.', effect: { power: -20 } },
    ],
  },
  'comm-interrupted': {
    title: 'COMMUNICATION LINK INTERRUPTED',
    description: 'Contact with Earth has been lost. The spacecraft is operating autonomously. What is your contingency plan?',
    options: [
      { label: 'Wait for communication to return', consequence: 'Link restored after delay. No data lost.', effect: { communication: 10 } },
      { label: 'Continue autonomous science operations', consequence: 'Science continues. Data stored onboard.', effect: { instruments: 5, communication: 0 } },
      { label: 'Enter safe mode', consequence: 'Systems protected. Science paused until link restored.', effect: { power: 10, instruments: -15 } },
    ],
  },
  'navigation-challenge': {
    title: 'TRAJECTORY DEVIATION DETECTED',
    description: 'The spacecraft has deviated from its planned trajectory. A correction maneuver is required. Propulsion resources are limited.',
    options: [
      { label: 'Execute full correction burn', consequence: 'Trajectory corrected. Propellant reserves reduced.', effect: { navigation: 25, propulsion: -20 } },
      { label: 'Execute partial correction', consequence: 'Partial correction. Destination approach adjusted.', effect: { navigation: 10, propulsion: -8 } },
      { label: 'Accept deviation and adjust mission plan', consequence: 'Destination still reachable. Some objectives modified.', effect: { navigation: -10 } },
    ],
  },
  'radiation-challenge': {
    title: 'RADIATION LEVEL ELEVATED',
    description: 'The spacecraft is entering a high-radiation environment. Electronics are at risk without protective measures.',
    options: [
      { label: 'Activate radiation shielding protocols', consequence: 'Systems protected. Power consumption increased.', effect: { radiation: 25, power: -15 } },
      { label: 'Reduce instrument exposure time', consequence: 'Electronics protected. Science window reduced.', effect: { radiation: 15, instruments: -10 } },
      { label: 'Continue through radiation zone', consequence: 'Maximum science data collected. System wear increased.', effect: { instruments: 10, radiation: -20, power: -10 } },
    ],
  },
  'instrument-failure': {
    title: 'INSTRUMENT ANOMALY DETECTED',
    description: 'One scientific instrument has stopped responding. Mission science objectives may be affected.',
    options: [
      { label: 'Attempt instrument restart', consequence: 'Instrument partially recovered. Reduced capability.', effect: { instruments: -10 } },
      { label: 'Reallocate power to remaining instruments', consequence: 'Remaining instruments perform at enhanced capacity.', effect: { instruments: 5, power: -5 } },
      { label: 'Continue with remaining instruments', consequence: 'Mission adapts. Some science objectives modified.', effect: { instruments: -15 } },
    ],
  },
  'propulsion-problem': {
    title: 'PROPULSION WARNING',
    description: 'The propulsion system is showing anomalous readings. Thrust performance is below nominal.',
    options: [
      { label: 'Perform diagnostic and recalibrate', consequence: 'Propulsion partially restored. Time cost.', effect: { propulsion: 15 } },
      { label: 'Switch to backup thrusters', consequence: 'Reduced thrust capability. Mission continues.', effect: { propulsion: 5, navigation: -5 } },
      { label: 'Continue on current trajectory', consequence: 'Destination still reachable. No correction burns available.', effect: { propulsion: -10 } },
    ],
  },
};

export default function SimulationClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const missionActive = hasActiveMission(searchParams);
  const mission = buildMissionFromParams(searchParams);
  const scores = calculateMissionScores(mission);
  const scenario = determineScenario(mission, scores);

  const [phase, setPhase] = useState<SimPhase>('pre-launch');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [systems, setSystems] = useState<SystemStatus>({
    power: 100,
    communication: 100,
    propulsion: 100,
    instruments: 100,
    navigation: 100,
    radiation: 0,
  });
  const [progress, setProgress] = useState(0);
  const [decisionPrompt, setDecisionPrompt] = useState<DecisionPrompt | null>(null);
  const [playerDecision, setPlayerDecision] = useState('');
  const [result, setResult] = useState<MissionResultData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioTriggered, setScenarioTriggered] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'neutral') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const entry: LogEntry = {
      id: createUniqueLogId(),
      time,
      message,
      type,
    };
    setLog(prev => [...prev, entry]);
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 50);
  }, []);

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

  const handleDecision = useCallback((optionIndex: number) => {
    if (!decisionPrompt) return;
    const option = decisionPrompt.options[optionIndex];
    applySystemEffect(option.effect);
    setPlayerDecision(option.label);
    addLog(`Decision made: ${option.label}`, 'info');
    addLog(`Result: ${option.consequence}`, 'success');
    toast.success(option.consequence);
    setDecisionPrompt(null);
  }, [decisionPrompt, applySystemEffect, addLog]);

  const triggerScenarioEvent = useCallback(() => {
    if (scenarioTriggered) return;
    setScenarioTriggered(true);

    const scenarioMessages: Record<ScenarioType, { msg: string; type: LogEntry['type']; systemEffect: Partial<SystemStatus> }> = {
      'smooth': { msg: 'All systems nominal. Mission proceeding as planned.', type: 'success', systemEffect: {} },
      'power-challenge': { msg: 'ALERT: Power generation below nominal. Initiating power management protocol.', type: 'warning', systemEffect: { power: -30 } },
      'comm-interrupted': { msg: 'ALERT: Communication link interrupted. Last contact 4 minutes ago.', type: 'warning', systemEffect: { communication: -40 } },
      'instrument-failure': { msg: 'ALERT: Instrument anomaly detected. Diagnostic in progress.', type: 'danger', systemEffect: { instruments: -25 } },
      'navigation-challenge': { msg: 'ALERT: Trajectory deviation detected. Correction burn required.', type: 'danger', systemEffect: { navigation: -30 } },
      'radiation-challenge': { msg: 'ALERT: Elevated radiation environment detected. System exposure increasing.', type: 'danger', systemEffect: { radiation: 45, power: -10 } },
      'propulsion-problem': { msg: 'ALERT: Propulsion system anomaly. Thrust below nominal.', type: 'danger', systemEffect: { propulsion: -35 } },
      'science-breakthrough': { msg: 'UNEXPECTED OBSERVATION: Instruments detecting anomalous readings of high scientific interest!', type: 'success', systemEffect: { instruments: 10 } },
      'partial-success': { msg: 'NOTE: Mission encountering operational constraints. Objectives being reprioritized.', type: 'warning', systemEffect: { instruments: -15, communication: -10 } },
      'mission-failure': { msg: 'CRITICAL: Multiple system failures detected. Mission viability compromised.', type: 'danger', systemEffect: { power: -50, propulsion: -40, communication: -35 } },
    };

    const ev = scenarioMessages[scenario];
    applySystemEffect(ev.systemEffect);
    addLog(ev.msg, ev.type);

    if (scenario !== 'smooth' && scenario !== 'science-breakthrough' && DECISION_PROMPTS[scenario]) {
      setTimeout(() => {
        setDecisionPrompt(DECISION_PROMPTS[scenario]);
      }, 1500);
    }
  }, [scenario, scenarioTriggered, applySystemEffect, addLog]);

  // Mission timeline
  useEffect(() => {
    if (!missionActive) return;
    if (!isRunning || phase === 'complete') return;

    const destLabel = mission.destination ? DESTINATIONS[mission.destination].label : 'destination';
    const scLabel = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft].label : 'spacecraft';

    const timeline: { progress: number; phase: SimPhase; messages: { msg: string; type: LogEntry['type'] }[] }[] = [
      {
        progress: 5, phase: 'launch', messages: [
          { msg: 'Launch vehicle ignition sequence initiated.', type: 'info' },
          { msg: 'Main engine cutoff confirmed. Spacecraft separation nominal.', type: 'success' },
          { msg: `${mission.missionName || 'Mission Alpha'} — ${scLabel} successfully deployed.`, type: 'success' },
        ]
      },
      {
        progress: 20, phase: 'transit', messages: [
          { msg: `Communication link established with Deep Space Network.`, type: 'success' },
          { msg: `Scientific instruments activated and nominal.`, type: 'success' },
          { msg: `Trajectory confirmed — en route to ${destLabel}.`, type: 'info' },
        ]
      },
      {
        progress: 45, phase: 'transit', messages: [
          { msg: `Mid-course navigation check complete.`, type: 'info' },
          { msg: `Power systems nominal. Telemetry nominal.`, type: 'success' },
        ]
      },
      {
        progress: 60, phase: 'approach', messages: [
          { msg: `${destLabel} approach phase initiated.`, type: 'info' },
          { msg: `Instruments reconfigured for approach science.`, type: 'info' },
        ]
      },
      {
        progress: 75, phase: 'operations', messages: [
          { msg: `${destLabel} encounter — science operations commenced.`, type: 'success' },
          { msg: `Primary instrument suite active.`, type: 'success' },
        ]
      },
      {
        progress: 90, phase: 'operations', messages: [
          { msg: `Science data collection phase complete.`, type: 'success' },
          { msg: `Initiating data downlink to Earth.`, type: 'info' },
        ]
      },
    ];

    let timelineIdx = 0;

    const tick = () => {
      setProgress(prev => {
        const next = Math.min(prev + 1.5, 100);

        // Check timeline events
        if (timelineIdx < timeline.length && next >= timeline[timelineIdx].progress) {
          const ev = timeline[timelineIdx];
          setPhase(ev.phase);
          ev.messages.forEach(m => addLog(m.msg, m.type));
          timelineIdx++;
        }

        // Trigger scenario at ~55% progress
        if (next >= 55 && !scenarioTriggered) {
          triggerScenarioEvent();
        }

        if (next >= 100) {
          setPhase('complete');
          addLog('Mission simulation complete. Generating final report...', 'success');
          setIsRunning(false);

          const finalResult = generateMissionResult(mission, scores, scenario, playerDecision || 'No active decision required');
          finalResult.eventsEncountered = log.filter(l => l.type === 'warning' || l.type === 'danger').map(l => l.message).slice(0, 5);
          setTimeout(() => setResult(finalResult), 1000);
        }

        return next;
      });
    };

    timerRef.current = setInterval(tick, 180);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, phase, mission, scores, scenario, scenarioTriggered, playerDecision, triggerScenarioEvent, addLog, log, missionActive]);

  const handleLaunch = () => {
    setIsRunning(true);
    setPhase('launch');
    addLog(`T+0:00 — ${mission.missionName || 'Mission Alpha'} launch sequence initiated.`, 'info');
    toast.success('Mission launched! Monitoring all systems.');
  };

  // Guard: show no-active-mission screen if mission params are missing
  if (!missionActive) {
    return <NoActiveMission />;
  }

  if (result) {
    return (
      <MissionResultScreen
        result={result}
        mission={mission}
        scores={scores}
        onRestart={() => router.push('/mission-designer')}
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
        scores={scores}
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