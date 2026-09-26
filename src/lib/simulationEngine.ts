/**
 * SIMULATION ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs the mission simulation as a pure, replayable function of:
 *   (mission configuration, player decisions, seeded randomness)
 *
 * Key properties:
 *  - Seeded RNG: the same mission + same decisions always produce the same
 *    story; changing a decision legitimately changes the outcome. That is
 *    what makes Replay a fair comparison.
 *  - Configuration influences everything: power margin sets the damage from
 *    power events; antenna and destination distance shape communication
 *    events; instrument count sets how many science opportunities exist.
 *  - Light-time delays are computed from real distance data (spaceData.ts).
 *
 * Educational models only — not engineering calculations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  MissionState,
  ScenarioType,
  Instrument,
} from './missionData';
import {
  calculateMissionScores,
  getOverallScore,
  DESTINATIONS,
  SPACECRAFT_TYPES,
  POWER_SYSTEMS,
  COMMUNICATION_SYSTEMS,
  INSTRUMENTS,
} from './missionData';
import { computeLightTime, getCommDelayInfo, DESTINATION_FACTS } from './spaceData';
import type { SystemStatus } from './simTypes';
import {
  AUTONOMY_OPTIONS,
  SCENARIO_DEFINITIONS,
  FAILURE_POINT_CONFIG,
} from './simTypes';

// ── Seeded RNG (mulberry32) ─────────────────────────────────────────────────

export interface SeededRandom {
  next(): number;
  range(min: number, max: number): number;
  pick<T>(arr: T[]): T;
  chance(p: number): boolean;
  seed: number;
}

export function createSeededRandom(seed: number): SeededRandom {
  let s = seed >>> 0;
  const next = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed,
    next,
    range: (min, max) => min + next() * (max - min),
    pick: arr => arr[Math.floor(next() * arr.length)],
    chance: p => next() < p,
  };
}

/** Derive a stable seed from mission config (so replays of the same mission match). */
export function seedFromMission(mission: MissionState): number {
  const str = [
    mission.missionName, mission.objective, mission.destination, mission.spacecraft,
    mission.instruments.join(','), mission.propulsion, mission.power, mission.communication,
  ].join('|');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Public interfaces ────────────────────────────────────────────────────────

export type AutonomyChoice = 'continue-science' | 'safe-mode' | 'wait';

export interface AutonomyOutcome {
  choice: AutonomyChoice;
  label: string;
  description: string;
  effects: Partial<SystemStatus>;
  scienceEffect: 'full' | 'partial' | 'paused' | 'protected';
  dataEffect: 'kept' | 'slower' | 'none';
  educationalNote: string;
}

export interface MissionEvent {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  atProgress: number;
  title: string;
  message: string;
  /** Educational "why" attached to the event. */
  cause?: string;
  systemEffect?: Partial<SystemStatus>;
  scenario?: ScenarioType;
  requiresDecision?: boolean;
  autonomyPrompt?: boolean;
  /** Light-time info when the event involves a command/data transit. */
  commDelay?: { commandDelay: string; dataDelay: string; note: string };
}

export interface DecisionRecord {
  eventId: string;
  eventTitle: string;
  optionLabel: string;
  consequence: string;
  effects: Partial<SystemStatus>;
  atProgress: number;
  kind: 'player' | 'autonomy';
}

export interface SimulationRecord {
  mission: MissionState;
  seed: number;
  scenario: ScenarioType;
  /** True when a failed state was reached before mission end. */
  endedEarly: boolean;
  endProgress: number;
  events: MissionEvent[];
  decisions: DecisionRecord[];
  discoveries: import('./scienceEngine').ScienceDiscovery[];
  finalSystems: SystemStatus;
  dataStoredGb: number;
  dataReturnedGb: number;
  observationsCompleted: number;
  majorFindings: number;
  outcomes: {
    type: 'success' | 'success-challenges' | 'partial' | 'failure' | 'breakthrough';
    title: string;
    subtitle: string;
    explanation: string;
  };
  lessons: { concept: string; lesson: string; learnHref: string }[];
  recommendations: string[];
  commDelayInfo: {
    label: string;
    oneWay: string;
    roundTrip: string;
    distanceNote: string;
  };
  scienceReturn: import('./scienceEngine').ScienceReturnSummary;
  failureInvestigation: import('./missionRules').FailureInvestigation | null;
}

// ── Internal helpers ────────────────────────────────────────────────────────

export function configurationFactors(mission: MissionState) {
  const scores = calculateMissionScores(mission);
  const overall = getOverallScore(scores);
  const instCount = mission.instruments.length;
  const totalPower = mission.instruments.reduce((s, i) => s + INSTRUMENTS[i].power, 0);
  const powerSys = mission.power ? POWER_SYSTEMS[mission.power] : null;
  const dest = mission.destination ? DESTINATIONS[mission.destination] : null;

  const powerMargin = powerSys ? Math.max(0, powerSys.powerOutput - totalPower) : 0;
  const commReach = mission.communication && mission.destination
    ? (COMMUNICATION_SYSTEMS[mission.communication].suitableDestinations.includes(mission.destination) ? 1 : 0.35)
    : 0.5;
  const destDistance = dest ? ({ near: 0, inner: 1, outer: 2, deep: 3 } as const)[dest.distanceCategory] : 1;

  return {
    scores,
    overall,
    instCount,
    powerMargin,
    commReach,
    destDistance,
    commSuitable: mission.communication && mission.destination
      ? COMMUNICATION_SYSTEMS[mission.communication].suitableDestinations.includes(mission.destination)
      : false,
  };
}

/** Weight-based event likelihood, modulated by configuration. */
function scenarioWeights(mission: MissionState, f: ReturnType<typeof configurationFactors>): Record<ScenarioType, number> {
  const dest = mission.destination;
  const w: Record<ScenarioType, number> = {
    smooth: 30,
    'science-breakthrough': f.instCount >= 3 ? 14 : 5,
    'power-challenge': 10,
    'comm-interrupted': 10,
    'instrument-failure': 6 + f.instCount * 2.5,
    'navigation-challenge': 8,
    'radiation-challenge': 6,
    'propulsion-problem': 6,
    'partial-success': 8,
    'mission-failure': 0,
  };

  // Configuration modulation — this is where choices matter.
  if (mission.power) {
    const suit = dest ? DESTINATIONS[dest].powerSuitability[mission.power] : 60;
    w['power-challenge'] += (70 - suit) * 0.6;          // weak match → more power trouble
    if (mission.power === 'solar' && ['jupiter', 'saturn', 'uranus', 'neptune'].includes(mission.destination!)) {
      w['power-challenge'] += 25;
    }
    if (f.powerMargin < 25) w['power-challenge'] += 15;  // power-hungry instrument suite
    if (suit >= 85 && f.powerMargin >= 40) w.smooth += 15;
  }

  if (mission.communication && dest) {
    const distancePenalty = f.destDistance * 12;
    w['comm-interrupted'] += f.commSuitable ? distancePenalty * 0.5 : distancePenalty + 25;
    if (f.commSuitable) w.smooth += 8;
    if (mission.communication === 'low-gain' && f.destDistance >= 1) w['comm-interrupted'] += 20;
  }

  if (mission.propulsion && dest) {
    const distCat = DESTINATIONS[dest].distanceCategory;
    const match = { chemical: { near: 1, inner: 0.7, outer: 0.3, deep: 0.1 }, ion: { near: 0.5, inner: 0.8, outer: 1, deep: 0.9 }, electric: { near: 0.7, inner: 0.8, outer: 0.6, deep: 0.4 }, 'solar-sail': { near: 1, inner: 0.7, outer: 0.2, deep: 0.05 } }[mission.propulsion][distCat];
    w['navigation-challenge'] += (1 - match) * 22;
    if (match < 0.4) w['propulsion-problem'] += 12;
    if (match >= 0.9) w.smooth += 8;
  }

  if (['jupiter', 'saturn'].includes(mission.destination!)) w['radiation-challenge'] += 22;
  if (mission.destination === 'moon') w['radiation-challenge'] += 6; // unfiltered solar events

  if (f.overall < 35) {
    w['mission-failure'] = 55; // badly mismatched designs genuinely risk ending early
  }

  return w;
}

function pickScenario(mission: MissionState, f: ReturnType<typeof configurationFactors>, rand: SeededRandom): ScenarioType {
  const w = scenarioWeights(mission, f);
  const entries = Object.entries(w) as [ScenarioType, number][];
  const total = entries.reduce((s, [, v]) => s + Math.max(v, 0), 0);
  let roll = rand.next() * total;
  for (const [scenario, weight] of entries) {
    roll -= Math.max(weight, 0);
    if (roll <= 0) return scenario;
  }
  return 'smooth';
}

// ── Core runner ─────────────────────────────────────────────────────────────

export interface RunOptions {
  seed?: number;
  /** Pre-seeded autonomy choice (used by replay); otherwise asked live. */
  autonomy?: AutonomyChoice;
  /** Pre-seeded decisions keyed by event id (used by replay). */
  fixedDecisions?: Record<string, number>;
}

export interface RunResult {
  record: SimulationRecord;
  /** Events that require the player to decide, in order. */
  decisionPoints: MissionEvent[];
  /** Progress at which the autonomy question fires (null if never). */
  autonomyPoint: MissionEvent | null;
}

/**
 * Execute the full mission. `fixedDecisions` lets a replay pre-answer every
 * prompt so the whole run can complete without UI interaction — the engine
 * is pure with respect to (mission, seed, decisions).
 */
export function runMission(
  mission: MissionState,
  options: RunOptions = {}
): RunResult {
  const seed = options.seed ?? seedFromMission(mission);
  const rand = createSeededRandom(seed);
  const f = configurationFactors(mission);
  const scenario = pickScenario(mission, f, rand);
  const dest = mission.destination ? DESTINATIONS[mission.destination] : null;
  const destFacts = mission.destination ? DESTINATION_FACTS[mission.destination] : null;
  const scInfo = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;

  const events: MissionEvent[] = [];
  const decisions: DecisionRecord[] = [];
  const decisionPoints: MissionEvent[] = [];
  let autonomyPoint: MissionEvent | null = null;

  const systems: SystemStatus = { power: 100, communication: 100, propulsion: 100, instruments: 100, navigation: 100, radiation: 0 };
  let dataStoredGb = 0;
  let observations = 0;
  let majorFindings = 0;
  const discoveries: import('./scienceEngine').ScienceDiscovery[] = [];

  const applyEffect = (effect?: Partial<SystemStatus>) => {
    if (!effect) return;
    (Object.keys(effect) as (keyof SystemStatus)[]).forEach(k => {
      systems[k] = Math.max(0, Math.min(100, systems[k] + (effect[k] ?? 0)));
    });
  };

  const addEvent = (e: Omit<MissionEvent, 'id'>) => {
    const ev: MissionEvent = { id: `evt-${events.length}-${e.atProgress.toFixed(0)}-${e.title.slice(0, 12).replace(/\s+/g, '-')}`, ...e };
    events.push(ev);
    return ev;
  };

  // ── Phase timeline events ────────────────────────────────────────────────
  const destLabel = dest?.label ?? 'the destination';
  const scLabel = scInfo?.label ?? 'spacecraft';
  const missionName = mission.missionName || 'Mission Alpha';

  addEvent({ atProgress: 2, type: 'info', title: 'Launch', message: `T+0 — ${missionName} leaves the pad. Launch vehicle performs nominally.` });
  addEvent({ atProgress: 5, type: 'success', title: 'Deployment', message: `${scLabel} separated from the launch vehicle. Solar arrays and antenna configured.` });
  addEvent({
    atProgress: 9, type: 'info', title: 'Commissioning',
    message: `Systems commissioned: ${mission.instruments.length} instrument${mission.instruments.length === 1 ? '' : 's'}, ${mission.power ? POWER_SYSTEMS[mission.power].label.toLowerCase() : 'power system'}, ${mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].label.toLowerCase() : 'communication'}.`,
  });

  // Communication delay context (computed from real distances).
  const delayInfo = mission.destination ? getCommDelayInfo(mission.destination) : null;
  if (delayInfo) {
    addEvent({
      atProgress: 14, type: 'neutral', title: 'Signal delay',
      message: `One-way light-time to ${destLabel} from ${Math.round(delayInfo.representativeDistanceKm / 1e6)} million km: ${delayInfo.lightTime.formatted}. Commands and data never arrive instantly.`,
      cause: 'Computed from verified Earth–destination distance data (see Data Sources).',
      commDelay: {
        commandDelay: delayInfo.lightTime.formatted,
        dataDelay: delayInfo.lightTime.formatted,
        note: delayInfo.distanceNote,
      },
    });
  }

  addEvent({ atProgress: 18, type: 'info', title: 'Cruise', message: `Cruise phase — trajectory en route to ${destLabel}. Trajectory correction maneuvers scheduled.` });
  addEvent({ atProgress: 30, type: 'success', title: 'Cruise science', message: mission.instruments.length > 0 ? `${mission.instruments.slice(0, 2).map(i => INSTRUMENTS[i].label).join(' and ')} ${mission.instruments.length > 2 ? 'and others ' : ''}collect cruise-phase data.` : 'No instruments selected — cruise science impossible.' });
  addEvent({ atProgress: 44, type: 'info', title: 'Approach', message: `Approaching ${destLabel}. Navigation camera frames the target for final targeting.` });
  addEvent({ atProgress: 55, type: 'success', title: 'Encounter', message: `${destLabel} encounter begins — science operations commence.` });

  // ── Scenario event (configuration-driven) ────────────────────────────────
  const scenarioDef = SCENARIO_DEFINITIONS[scenario];
  if (scenario !== 'smooth' && scenario !== 'science-breakthrough') {
    const severity = Math.min(1, 0.55 + (1 - f.overall / 100) * 0.45);
    const eff = { ...scenarioDef.systemEffect };
    // Scale damage by design quality: good designs absorb more.
    (Object.keys(eff) as (keyof SystemStatus)[]).forEach(k => {
      eff[k] = Math.round((eff[k] ?? 0) * (0.6 + severity * 0.5));
    });
    addEvent({
      atProgress: 60, type: scenarioDef.logType, title: scenarioDef.title,
      message: scenarioDef.message(destLabel),
      cause: scenarioDef.educationalCause(mission, destLabel),
      systemEffect: eff,
      requiresDecision: scenarioDef.decisionOptions.length > 0,
      scenario,
    });
    const ev = events[events.length - 1];
    if (scenarioDef.decisionOptions.length > 0) decisionPoints.push(ev);
  } else if (scenario === 'science-breakthrough') {
    addEvent({
      atProgress: 62, type: 'success', title: 'Unexpected observation',
      message: `${mission.instruments.length > 0 ? INSTRUMENTS[mission.instruments[0]].label : 'Instrument'} data shows an anomalous signature of high scientific interest at ${destLabel}.`,
      cause: 'Well-matched instruments operating in a rich environment occasionally produce standout results.',
      systemEffect: { instruments: 8 },
      scenario,
    });
  }

  // ── Science operations & discoveries ─────────────────────────────────────
  const opsEvents: { at: number }[] = [{ at: 66 }, { at: 76 }, { at: 86 }, { at: 94 }];
  for (const op of opsEvents) {
    if (systems.instruments <= 0 || systems.power <= 0) break;
    const ctx = {
      rand,
      designFit: f.overall / 100,
      instrumentHealth: systems.instruments / 100,
      progress: op.at / 100,
    };
    // Use lazy import pattern avoided: scienceEngine imported statically below.
    const batch = scienceRoll(mission, ctx);
    discoveries.push(...batch);
    observations += batch.length;
    majorFindings += batch.filter(d => d.significance === 'major').length;
    if (batch.length > 0) {
      addEvent({
        atProgress: op.at, type: 'success', title: 'Science operations',
        message: batch.map(d => d.label).join('; '),
        cause: `Your instrument suite made ${batch.length} observation${batch.length === 1 ? '' : 's'} possible${batch.some(d => d.significance === 'major') ? ' — one was flagged as scientifically significant.' : '.'}`,
      });
    }
    dataStoredGb += batch.reduce((s, d) => s + dataGbForDiscovery(mission, d.discoveryId), 0);
  }

  // ── Autonomy decision point (comm interruptions) ─────────────────────────
  if (scenario === 'comm-interrupted' || (f.commSuitable === false && f.destDistance >= 1) || (delayInfo && delayInfo.lightTime.seconds > 300)) {
    const ev = addEvent({
      atProgress: 72, type: 'warning', title: 'Communication gap',
      message: `The link with Earth drops during ${destLabel} operations. The spacecraft must act on its own for the next contact window.`,
      cause: 'Signal delay and antenna margin make continuous contact impossible for this design.',
      autonomyPrompt: true,
    });
    autonomyPoint = ev;
  }

  // ── Downlink phase ───────────────────────────────────────────────────────
  const lightTime = mission.destination
    ? computeLightTime(getCommDelayInfo(mission.destination).representativeDistanceKm)
    : null;
  addEvent({
    atProgress: 97, type: 'info', title: 'Data transmission',
    message: `Science data downlink to Earth begins${lightTime ? ` — first bits arrive after a ${lightTime.formatted} one-way transit` : ''}.`,
  });

  // ── Failure / early end evaluation ───────────────────────────────────────
  const criticalSystems = (['power', 'propulsion', 'communication', 'instruments'] as const).filter(k => systems[k] <= 8);
  const endedEarly = criticalSystems.length >= 2 || systems.power <= 0;
  const endProgress = endedEarly ? Math.min(...criticalSystems.length > 0 ? [70 + Math.round(rand.range(0, 15))] : [100], 100) : 100;

  if (endedEarly) {
    addEvent({
      atProgress: endProgress, type: 'danger', title: 'Mission-ending anomaly',
      message: `Multiple systems critical (${criticalSystems.join(', ')}). Autonomous safing placed the spacecraft in a survival configuration.`,
      cause: 'When a design carries too little margin, a single event can cascade into mission loss.',
    });
  }

  // ── Resolve decisions (fixed or auto 'balanced') ─────────────────────────
  for (const dp of decisionPoints) {
    const scenario2 = dp.scenario!;
    const opts = SCENARIO_DEFINITIONS[scenario2].decisionOptions;
    const fixed = options.fixedDecisions?.[dp.id];
    const idx = fixed !== undefined ? fixed : 0;
    const chosen = opts[Math.min(idx, opts.length - 1)];
    applyEffect(chosen.effects);
    decisions.push({
      eventId: dp.id, eventTitle: dp.title, optionLabel: chosen.label,
      consequence: chosen.consequence, effects: chosen.effects,
      atProgress: dp.atProgress, kind: 'player',
    });
  }

  // Resolve autonomy: fixed choice, or default to 'continue-science'.
  let autonomyOutcome: AutonomyOutcome | null = null;
  if (autonomyPoint) {
    const choice = options.autonomy ?? 'continue-science';
    autonomyOutcome = resolveAutonomy(choice, f, systems);
    applyEffect(autonomyOutcome.effects);
    decisions.push({
      eventId: autonomyPoint.id, eventTitle: autonomyPoint.title,
      optionLabel: autonomyOutcome.label,
      consequence: autonomyOutcome.description,
      effects: autonomyOutcome.effects,
      atProgress: autonomyPoint.atProgress, kind: 'autonomy',
    });
  }

  // ── Downlink efficiency & final data ─────────────────────────────────────
  const commFactor = systems.communication / 100;
  const dataReturnedGb = Math.round(dataStoredGb * Math.min(1, 0.12 + commFactor * 0.85));

  // ── Outcome determination ────────────────────────────────────────────────
  const outcomes = determineOutcome(mission, scenario, systems, endedEarly, f);
  const scienceReturn = buildScienceReturnForRecord(mission, discoveries, {
    instrumentHealth: systems.instruments,
    communicationHealth: systems.communication,
    powerHealth: systems.power,
    progress: endProgress,
    dataStoredGb,
    dataReturnedGb,
    scenario,
  });

  const lessons = buildLessons(mission, scenario, systems, endedEarly);
  const recommendations = buildRecommendations(mission, scenario, systems, f);

  const commLabel = mission.destination ? DESTINATIONS[mission.destination].label : '';
  const failureInvestigation = endedEarly || scenario === 'partial-success' || outcomes.type === 'partial'
    ? buildInvestigation(mission, scenario, systems)
    : null;

  const record: SimulationRecord = {
    mission,
    seed,
    scenario,
    endedEarly,
    endProgress,
    events,
    decisions,
    discoveries,
    finalSystems: { ...systems },
    dataStoredGb,
    dataReturnedGb,
    observationsCompleted: observations,
    majorFindings,
    outcomes,
    lessons,
    recommendations,
    commDelayInfo: {
      label: commLabel,
      oneWay: lightTime?.formatted ?? 'n/a',
      roundTrip: lightTime ? `${(lightTime.roundTripSeconds / 60).toFixed(1)} min` : 'n/a',
      distanceNote: delayInfo?.distanceNote ?? '',
    },
    scienceReturn,
    failureInvestigation,
  };

  return { record, decisionPoints, autonomyPoint };
}

// ── Autonomy resolution ─────────────────────────────────────────────────────

export function resolveAutonomy(choice: AutonomyChoice, f: ReturnType<typeof configurationFactors>, systems: SystemStatus): AutonomyOutcome {
  const powerStress = f.powerMargin < 25;
  switch (choice) {
    case 'continue-science':
      return {
        choice,
        label: 'Continue planned science',
        description: powerStress
          ? 'Science continues autonomously. With thin power margins, stored data grows faster than the power budget would like.'
          : 'Science continues autonomously while Earth is out of contact — data accumulates in onboard storage.',
        effects: powerStress ? { power: -8, instruments: 4 } : { instruments: 5 },
        scienceEffect: 'full',
        dataEffect: 'kept',
        educationalNote: 'This is why spacecraft carry autonomy: observations are too valuable (or too fleeting) to pause every time the link drops. Voyager\u2019s 1986 Uranus encounter was commanded years in advance and executed autonomously.',
      };
    case 'safe-mode':
      return {
        choice,
        label: 'Enter safe mode',
        description: 'Spacecraft powers down to essential systems only. Hardware is protected; science pauses.',
        effects: { power: 12, instruments: -12 },
        scienceEffect: 'protected',
        dataEffect: 'none',
        educationalNote: 'Safe mode trades science time for survivability. Real spacecraft enter it automatically when a fault is detected — Cassini survived multiple safe-mode entries and its mission continued.',
      };
    case 'wait':
      return {
        choice,
        label: 'Wait for communication',
        description: 'The spacecraft holds its attitude and waits for instructions. Conservative, but observation windows may be missed.',
        effects: { communication: 6, power: 2 },
        scienceEffect: 'paused',
        dataEffect: 'slower',
        educationalNote: 'Waiting is the most conservative option. New Horizons\u2019 Pluto flyby could not wait — the encounter geometry demanded hours of pre-planned, fully autonomous observations.',
      };
  }
}

// ── Science roll bridge (kept here to avoid circular imports at module init) ─

function scienceRoll(mission: MissionState, ctx: { rand: SeededRandom; designFit: number; instrumentHealth: number; progress: number }) {
  // Delegate to scienceEngine.rollDiscoveries via dynamic import is not allowed
  // in static contexts, so re-implement the roll loop here using eligibility.
  const { evaluateDiscoveries } = require('./scienceEngine') as typeof import('./scienceEngine');
  const findings: import('./scienceEngine').ScienceDiscovery[] = [];
  const dest = mission.destination;
  if (!dest || mission.instruments.length === 0) return findings;
  const eligibilities = evaluateDiscoveries(mission).filter(e => e.eligible);
  eligibilities.forEach((elig, idx) => {
    const baseChance = 0.35 + ctx.designFit * 0.3 + ctx.instrumentHealth * 0.2;
    const chance = Math.min(baseChance, 0.85);
    if (ctx.rand.next() > chance) return;
    const type = elig.type;
    const inst = elig.enablingInstruments[0];
    const major = ctx.rand.next() < 0.22 + ctx.designFit * 0.1;
    findings.push({
      id: `disc-${ctx.progress.toFixed(2)}-${idx}-${type.id}`,
      discoveryId: type.id,
      label: type.label,
      instrumentLabel: INSTRUMENTS[inst].label,
      detail: `${INSTRUMENTS[inst].label} data supports ${type.label.toLowerCase()}.`,
      example: type.example,
      significance: major ? 'major' : 'standard',
      time: `OPS+${Math.max(1, Math.round(ctx.progress * 180))}d`,
    });
  });
  return findings;
}

function dataGbForDiscovery(mission: MissionState, discoveryId: string): number {
  void mission;
  const rates: Record<string, number> = {
    'surface-imaging': 3.2, 'atmospheric-imaging': 2.8, 'mineral-composition': 1.4,
    'ice-composition': 1.1, 'organic-screening': 0.9, 'subsurface-layering': 2.1,
    'polar-ice': 1.6, 'magnetic-field-map': 0.4, 'ocean-induction': 0.5,
    'thermal-hotspot': 0.8, 'thermal-inertia': 0.7, 'atmospheric-profile': 0.9,
    'radiation-map': 0.4, 'plasma-flows': 0.5, 'seismic-events': 0.6, 'regolith-mechanics': 0.4,
  };
  return rates[discoveryId] ?? 0.8;
}

function buildScienceReturnForRecord(
  mission: MissionState,
  discoveries: import('./scienceEngine').ScienceDiscovery[],
  opts: { instrumentHealth: number; communicationHealth: number; powerHealth: number; progress: number; dataStoredGb: number; dataReturnedGb: number; scenario: string }
): import('./scienceEngine').ScienceReturnSummary {
  const { buildScienceReturn } = require('./scienceEngine') as typeof import('./scienceEngine');
  return buildScienceReturn(mission, discoveries, opts);
}

function buildInvestigation(
  mission: MissionState,
  scenario: ScenarioType,
  systems: SystemStatus
): import('./missionRules').FailureInvestigation {
  const { buildFailureInvestigation } = require('./missionRules') as typeof import('./missionRules');
  const inv = buildFailureInvestigation(mission, scenario);
  // Enrich with live system state.
  if (scenario === 'power-challenge' && systems.power < 50) {
    return { ...inv, whatHappened: `${inv.whatHappened} Reserves dropped to ${Math.round(systems.power)}%.` };
  }
  return inv;
}

// ── Outcome determination ───────────────────────────────────────────────────

function determineOutcome(
  mission: MissionState,
  scenario: ScenarioType,
  systems: SystemStatus,
  endedEarly: boolean,
  f: ReturnType<typeof configurationFactors>
): SimulationRecord['outcomes'] {
  const destLabel = mission.destination ? DESTINATIONS[mission.destination].label : 'the destination';
  const objLabel = mission.objective ? mission.objective.replace(/-/g, ' ') : 'science';

  if (endedEarly) {
    return {
      type: 'failure',
      title: 'MISSION ENDED EARLY',
      subtitle: `Cascading system failures prevented ${mission.missionName || 'the mission'} from reaching ${destLabel} operations.`,
      explanation: 'Two or more critical systems fell to zero. Real missions practice this scenario in "mission end-of-life" reviews — designing margin earlier is the fix.',
    };
  }

  const avgHealth = (systems.power + systems.communication + systems.propulsion + systems.instruments + systems.navigation) / 5;

  if (scenario === 'science-breakthrough' && avgHealth > 55) {
    return {
      type: 'breakthrough',
      title: 'EXTRAORDINARY SCIENTIFIC RESULT',
      subtitle: `Your instruments detected an unexpected observation at ${destLabel} that expands the mission's scientific value.`,
      explanation: 'Breakthroughs are rare alignments: capable instruments, a rich environment, and enough margin to follow up the finding.',
    };
  }

  if (avgHealth >= 78 && !endedEarly) {
    return {
      type: 'success',
      title: 'MISSION SUCCESSFUL',
      subtitle: `The ${objLabel} mission to ${destLabel} completed its planned science operations in good health.`,
      explanation: 'A balanced design matched to its destination, with margin left over. This is what mission designers aim for.',
    };
  }

  if (avgHealth >= 55) {
    return {
      type: 'success-challenges',
      title: 'MISSION SUCCESSFUL — WITH CHALLENGES',
      subtitle: `Your mission overcame significant challenges to achieve its primary objectives at ${destLabel}.`,
      explanation: 'The design absorbed real problems without losing the mission — the practical definition of good margin.',
    };
  }

  return {
    type: 'partial',
    title: 'MISSION PARTIALLY SUCCESSFUL',
    subtitle: `Your mission reached ${destLabel} but operational constraints forced objective changes.`,
    explanation: 'The mission survived but the science plan shrank. Partial success is common in real spaceflight — and informative.',
  };
}

function buildLessons(
  mission: MissionState,
  scenario: ScenarioType,
  systems: SystemStatus,
  endedEarly: boolean
): SimulationRecord['lessons'] {
  const lessons: SimulationRecord['lessons'] = [];
  const dest = mission.destination ? DESTINATIONS[mission.destination] : null;

  if (systems.power < 60 || scenario === 'power-challenge') {
    lessons.push({
      concept: 'Power Systems',
      lesson: `You saw why power budgets are critical — ${mission.power === 'solar' && mission.destination && ['jupiter', 'saturn', 'uranus', 'neptune'].includes(mission.destination) ? `sunlight at ${dest?.label} is only ${DESTINATION_FACTS[mission.destination].solarIlluminationPercentOfEarth}% of Earth's` : 'instrument demand approached the available supply'}. A power budget is a science budget.`,
      learnHref: '#power',
    });
  }
  if (systems.communication < 60 || scenario === 'comm-interrupted') {
    lessons.push({
      concept: 'Communication & Autonomy',
      lesson: `Signal delay made real-time control impossible — the spacecraft had to act on its own. That is exactly why real missions like Perseverance carry autonomous behaviors.`,
      learnHref: '#communication',
    });
  }
  if (mission.instruments.length >= 4) {
    lessons.push({
      concept: 'Mission Trade-offs',
      lesson: `Your ${mission.instruments.length} instruments multiplied science opportunities — and also power draw, data volume, and complexity. Every addition cuts both ways.`,
      learnHref: '#trade-offs',
    });
  }
  if (scenario === 'instrument-failure' || systems.instruments < 70) {
    lessons.push({
      concept: 'Redundancy & Margin',
      lesson: 'When an instrument struggles, missions rely on redundancy, margins, and graceful degradation — concepts every real mission budgets for.',
      learnHref: '#redundancy',
    });
  }
  if (mission.propulsion && dest && ['outer', 'deep'].includes(dest.distanceCategory) && mission.propulsion === 'chemical') {
    lessons.push({
      concept: 'Propulsion Reach',
      lesson: 'Chemical propulsion\u2019s limited efficiency shaped what your mission could attempt — deep-space missions trade thrust for fuel economy.',
      learnHref: '#propulsion',
    });
  }
  if (endedEarly) {
    lessons.push({
      concept: 'System Interdependence',
      lesson: 'Failures cascaded across systems. Mission design is a systems problem: fixing one subsystem in isolation is not enough.',
      learnHref: '#missions',
    });
  }
  if (lessons.length === 0) {
    lessons.push({
      concept: 'Mission Planning',
      lesson: 'Your balanced design matched capability to environment with margin to spare — the quiet formula behind most real mission successes.',
      learnHref: '#missions',
    });
  }
  return lessons.slice(0, 4);
}

function buildRecommendations(
  mission: MissionState,
  scenario: ScenarioType,
  systems: SystemStatus,
  f: ReturnType<typeof configurationFactors>
): string[] {
  const recs: string[] = [];
  if (mission.power && mission.destination) {
    const suit = DESTINATIONS[mission.destination].powerSuitability[mission.power];
    if (suit < 55) recs.push(`Try a power system better matched to ${DESTINATIONS[mission.destination].label} (current: ${POWER_SYSTEMS[mission.power].label}).`);
  }
  if (mission.communication && mission.destination && !COMMUNICATION_SYSTEMS[mission.communication].suitableDestinations.includes(mission.destination)) {
    recs.push('Upgrade the communication system for this distance — data return was your bottleneck.');
  }
  if (f.powerMargin < 20) recs.push('Trim instrument power draw or add power generation — the suite ran close to the limit.');
  if (systems.instruments < 60) recs.push('Consider instrument redundancy or fewer, hardier instruments.');
  if (scenario === 'smooth' || scenario === 'science-breakthrough') {
    recs.push('Try replaying with one different decision to see how sensitive the outcome was to your choices.');
    recs.push('Push further: same design, a more distant destination.');
  } else {
    recs.push('Open the What-If Lab to compare this design against alternatives before relaunching.');
  }
  return recs.slice(0, 4);
}

// Re-export for UI convenience.
export { FAILURE_POINT_CONFIG };
