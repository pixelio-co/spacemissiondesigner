/**
 * simulationEngine.ts — The mission simulation model.
 *
 * A transparent, configuration-driven event model. Events are weighted by the
 * user's actual design (power, comms, propulsion, instruments, destination),
 * instruments gate which scientific observations are even possible, and
 * communication uses the real one-way light-time from spaceData.ts.
 *
 * This is an educational simulation: probabilities are heuristic and stated as
 * such in the UI. Nothing here claims to be a NASA engineering calculation.
 */

import type {
  MissionState,
  MissionResultData,
  AnalysisScores,
  Instrument,
} from './missionData';
import {
  DESTINATIONS,
  INSTRUMENTS,
  SPACECRAFT_TYPES,
  OBJECTIVES,
  calculateMissionScores,
  getOverallScore,
} from './missionData';
import { DESTINATION_FACTS, formatDelay } from './spaceData';

// ── Phases ───────────────────────────────────────────────────────────────────

export type SimPhase =
  | 'pre-launch' | 'launch' | 'cruise' | 'approach' | 'encounter'
  | 'science-operations' | 'data-collection' | 'data-transmission' | 'complete';

export interface PhaseMilestone {
  id: string;
  label: string;
  phase: SimPhase;
  /** Progress percentage at which this milestone fires. */
  at: number;
}

export const MISSION_PHASES: PhaseMilestone[] = [
  { id: 'launch', label: 'Launch', phase: 'launch', at: 3 },
  { id: 'cruise', label: 'Cruise', phase: 'cruise', at: 18 },
  { id: 'approach', label: 'Approach', phase: 'approach', at: 45 },
  { id: 'encounter', label: 'Orbit / Encounter', phase: 'encounter', at: 62 },
  { id: 'science', label: 'Science Operations', phase: 'science-operations', at: 74 },
  { id: 'collection', label: 'Data Collection', phase: 'data-collection', at: 86 },
  { id: 'transmission', label: 'Data Transmission', phase: 'data-transmission', at: 95 },
  { id: 'complete', label: 'Mission Complete', phase: 'complete', at: 100 },
];

// ── Log + systems types ──────────────────────────────────────────────────────

export type LogType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface LogEntry {
  id: string;
  missionTime: string;
  message: string;
  type: LogType;
  /** Marks key decision points for the replay comparison. */
  isDecision?: boolean;
}

let logCounter = 0;
export function makeLogId(): string {
  logCounter += 1;
  return `log-${Date.now().toString(36)}-${logCounter}`;
}

export interface SystemStatus {
  power: number;
  communication: number;
  propulsion: number;
  instruments: number;
  navigation: number;
  radiation: number;
}

// ── Science: instrument → discovery eligibility ──────────────────────────────

export interface ObservationDef {
  id: string;
  /** Instrument that enables this observation class. */
  instrument: Instrument;
  /** Destination categories where this observation makes sense (empty = anywhere). */
  validAt: string[];
  /** Excludes specific destinations. */
  invalidAt: string[];
  title: string;
  description: string;
  /** Base probability per eligible check (0–1). Tuned by system health + luck. */
  baseChance: number;
  isMajorFinding?: boolean;
}

export const OBSERVATIONS: ObservationDef[] = [
  {
    id: 'surface-imagery', instrument: 'camera', validAt: [], invalidAt: [],
    title: 'High-Resolution Surface Imaging', baseChance: 0.75,
    description: 'Detailed imagery of surface features, layering, and terrain morphology.',
  },
  {
    id: 'dynamic-imaging', instrument: 'camera', validAt: [], invalidAt: ['asteroid'],
    title: 'Dynamic Event Imaging', baseChance: 0.3,
    description: 'A changing feature captured over time — storms, plumes, or dust activity.',
    isMajorFinding: true,
  },
  {
    id: 'composition-scan', instrument: 'spectrometer', validAt: [], invalidAt: [],
    title: 'Mineral Composition Mapping', baseChance: 0.6,
    description: 'Spectral signatures reveal which minerals and ices make up the surface.',
  },
  {
    id: 'organic-signature', instrument: 'spectrometer', validAt: [], invalidAt: ['earth-orbit', 'moon'],
    title: 'Organic Molecule Signatures', baseChance: 0.22,
    description: 'Weak but intriguing carbon-bearing molecular bands detected in spectra.',
    isMajorFinding: true,
  },
  {
    id: 'subsurface-map', instrument: 'radar', validAt: [], invalidAt: [],
    title: 'Subsurface Structure Profile', baseChance: 0.5,
    description: 'Radar returns map layers beneath the surface — ice, voids, or sediments.',
  },
  {
    id: 'hidden-ocean', instrument: 'radar', validAt: ['jupiter', 'saturn'], invalidAt: [],
    title: 'Evidence of a Subsurface Ocean', baseChance: 0.18,
    description: 'Radar sounding consistent with a liquid water layer beneath an icy crust.',
    isMajorFinding: true,
  },
  {
    id: 'magnetic-field-map', instrument: 'magnetometer', validAt: [], invalidAt: [],
    title: 'Magnetic Field Characterization', baseChance: 0.65,
    description: 'Field strength and direction mapped across the approach and encounter.',
  },
  {
    id: 'magnetosphere-boundary', instrument: 'magnetometer', validAt: ['jupiter', 'saturn', 'mercury'], invalidAt: [],
    title: 'Magnetosphere Boundary Crossing', baseChance: 0.45,
    description: 'The bow shock and magnetopause crossing recorded in-situ.',
  },
  {
    id: 'thermal-map', instrument: 'thermal', validAt: [], invalidAt: [],
    title: 'Thermal Inertia Mapping', baseChance: 0.6,
    description: 'Day–night temperature tracking reveals surface material differences.',
  },
  {
    id: 'thermal-anomaly', instrument: 'thermal', validAt: ['mars', 'venus'], invalidAt: [],
    title: 'Thermal Anomaly Detected', baseChance: 0.2,
    description: 'A localized hot spot hints at geologic or volcanic activity.',
    isMajorFinding: true,
  },
  {
    id: 'atmospheric-profile', instrument: 'atmospheric', validAt: ['venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'earth-orbit'], invalidAt: [],
    title: 'Atmospheric Vertical Profile', baseChance: 0.65,
    description: 'Pressure, temperature, and composition layered through the atmosphere.',
  },
  {
    id: 'weather-pattern', instrument: 'atmospheric', validAt: ['mars', 'jupiter', 'saturn', 'venus'], invalidAt: [],
    title: 'Weather System Observed', baseChance: 0.35,
    description: 'Cloud structures and wind patterns tracked over several rotations.',
  },
  {
    id: 'radiation-belt-survey', instrument: 'radiation', validAt: [], invalidAt: [],
    title: 'Radiation Environment Survey', baseChance: 0.7,
    description: 'Particle flux measured through the approach — critical for future mission design.',
  },
  {
    id: 'radiation-storm', instrument: 'radiation', validAt: [], invalidAt: [],
    title: 'Solar Particle Event Recorded', baseChance: 0.25,
    description: 'A solar storm sweeps past the spacecraft — intense, time-critical data.',
    isMajorFinding: true,
  },
  {
    id: 'seismic-detection', instrument: 'seismometer', validAt: ['moon', 'mars', 'asteroid'], invalidAt: [],
    title: 'Seismic Activity Detected', baseChance: 0.3,
    description: 'Ground motion from internal or impact sources, revealing interior structure.',
    isMajorFinding: true,
  },
  {
    id: 'plasma-measurement', instrument: 'particle', validAt: [], invalidAt: [],
    title: 'Plasma Environment Measurement', baseChance: 0.6,
    description: 'Charged-particle populations measured near the target.',
  },
  {
    id: 'aurora-signature', instrument: 'particle', validAt: ['jupiter', 'saturn', 'uranus', 'neptune'], invalidAt: [],
    title: 'Auroral Emission Signature', baseChance: 0.3,
    description: 'Particle data consistent with auroral acceleration regions.',
    isMajorFinding: true,
  },
];

// ── Communication delay (real data, transparent) ──────────────────────────────

export interface CommDelayInfo {
  /** Human-readable one-way delay. */
  oneWayLabel: string;
  /** Seconds (may be fractional) for pacing the UI animation. */
  oneWaySeconds: number;
  source: string;
}

export function getCommDelay(destination: string | null): CommDelayInfo {
  if (!destination) {
    return { oneWayLabel: 'unknown', oneWaySeconds: 0, source: 'No destination selected' };
  }
  const facts = DESTINATION_FACTS[destination];
  if (facts) {
    return {
      oneWayLabel: formatDelay(facts.avgOneWayDelaySeconds),
      oneWaySeconds: facts.avgOneWayDelaySeconds,
      source: 'One-way light time from NASA planetary distance data (distance ÷ speed of light), rounded for display.',
    };
  }
  // Fallback to the existing hand-authored label in missionData.
  const dest = DESTINATIONS[destination as keyof typeof DESTINATIONS];
  return {
    oneWayLabel: dest?.communicationDelay ?? 'unknown',
    oneWaySeconds: 1,
    source: 'Educational estimate.',
  };
}

// ── Decision definitions (config-influenced) ─────────────────────────────────

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  consequence: string;
  /** SystemStatus deltas. */
  effect: Partial<SystemStatus>;
  /** Science consequences. */
  scienceDelta?: number;
  /** Autonomy behavior chosen — used by replay comparison. */
  autonomyBehavior?: 'continue-science' | 'safe-mode' | 'wait-comm';
  lesson: string;
}

export interface DecisionDef {
  id: string;
  /** Which event category triggers this decision. */
  event: EventCategory;
  title: string;
  description: string;
  options: DecisionOption[];
}

export type EventCategory =
  | 'power' | 'comm' | 'instrument' | 'navigation' | 'radiation' | 'propulsion';

export interface MissionEventDef {
  id: string;
  category: EventCategory;
  title: string;
  log: string;
  logType: LogType;
  /** Configuration predicates that make this event possible. */
  requires: (mission: MissionState, scores: AnalysisScores) => boolean;
  /** Relative weight when several events are possible (higher = more likely). */
  weight: (mission: MissionState, scores: AnalysisScores) => number;
  /** Immediate system hit when the event fires. */
  impact: Partial<SystemStatus>;
  /** Decision offered (optional — some events resolve autonomously). */
  decision?: DecisionDef;
  /** Progress point where this event can fire. */
  firesAt: number;
}

const OUTERMOST = ['jupiter', 'saturn', 'uranus', 'neptune'];

export const MISSION_EVENTS: MissionEventDef[] = [
  {
    id: 'power-draw',
    category: 'power',
    title: 'POWER DEMAND SURGE',
    log: 'Power draw from active systems is exceeding generation capacity. Reserves decreasing.',
    logType: 'warning',
    requires: (m, s) => m.instruments.length > 0 && s.powerCompatibility < 75,
    weight: (m, s) => (m.instruments.length >= 4 ? 3 : 2) * (s.powerCompatibility < 45 ? 2 : 1),
    impact: { power: -22 },
    firesAt: 30,
    decision: {
      id: 'power-draw-d',
      event: 'power',
      title: 'POWER MANAGEMENT REQUIRED',
      description: 'The spacecraft cannot sustain all systems at current power levels. Mission planners must prioritize.',
      options: [
        {
          id: 'cycle-instruments', label: 'Cycle science instruments (run some at reduced duty)',
          description: 'Keeps all instruments alive but each observes less often.',
          consequence: 'Power stabilized. Instruments cycling — some observations will be missed.',
          effect: { power: 14, instruments: -12 },
          scienceDelta: -1,
          lesson: 'Power budgets force trade-offs: duty-cycling instruments protects the mission but reduces science throughput.',
        },
        {
          id: 'cut-heaters', label: 'Reduce heater power to minimum safe levels',
          description: 'Protects instrument power but systems run colder.',
          consequence: 'Power recovered for science. Thermal margin reduced.',
          effect: { power: 10, instruments: -4 },
          scienceDelta: 0,
          lesson: 'Thermal management and science compete for the same watts — a real constraint on every mission.',
        },
        {
          id: 'continue-anyway', label: 'Continue full operations and accept battery drain',
          description: 'Maximum science, highest risk.',
          consequence: 'Full science continues, but reserves keep falling. The spacecraft is now living on margin.',
          effect: { power: -14 },
          scienceDelta: 1,
          lesson: 'Living on the power margin risks cascading failures — mission planners usually protect the spacecraft first.',
        },
      ],
    },
  },
  {
    id: 'comm-dropout',
    category: 'comm',
    title: 'COMMUNICATION INTERRUPTION',
    log: 'Communication link with Earth interrupted. The spacecraft is on its own until the link is restored.',
    logType: 'warning',
    requires: (m, s) => s.communication < 92,
    weight: (m, s) => {
      let w = 2;
      if (s.communication < 45) w += 3;
      if (m.communication === 'low-gain') w += 2;
      const d = m.destination ? DESTINATIONS[m.destination].distanceCategory : 'near';
      if (d === 'outer' || d === 'deep') w += 2;
      return w;
    },
    impact: { communication: -35 },
    firesAt: 38,
    decision: {
      id: 'comm-dropout-d',
      event: 'comm',
      title: 'SIGNAL LOST — AUTONOMY REQUIRED',
      description: 'With Earth out of contact, the spacecraft must act on its pre-planned contingency behavior.',
      options: [
        {
          id: 'continue-science', label: 'CONTINUE PLANNED SCIENCE',
          description: 'The spacecraft keeps observing autonomously, storing data onboard.',
          consequence: 'Science continues. Data accumulates in onboard storage until the link returns.',
          effect: { instruments: 4, power: -8 },
          scienceDelta: 2,
          autonomyBehavior: 'continue-science',
          lesson: 'Autonomous science keeps discovering while Earth is out of reach — but onboard storage and power are finite.',
        },
        {
          id: 'safe-mode', label: 'SAFE MODE',
          description: 'Star-point the spacecraft, shut science off, protect resources.',
          consequence: 'Spacecraft protected. Science paused. Lowest risk posture.',
          effect: { power: 12, instruments: -18 },
          scienceDelta: -2,
          autonomyBehavior: 'safe-mode',
          lesson: 'Safe mode trades science time for survival — exactly what real spacecraft do when uncertain.',
        },
        {
          id: 'wait-comm', label: 'WAIT FOR COMMUNICATION',
          description: 'Hold current attitude and wait passively for the next contact window.',
          consequence: 'Conservative posture. Some observation opportunities may pass unused.',
          effect: { communication: 6, instruments: -6 },
          scienceDelta: -1,
          autonomyBehavior: 'wait-comm',
          lesson: 'Waiting is safe but costs opportunities — a classic mission-operations dilemma.',
        },
      ],
    },
  },
  {
    id: 'instrument-anomaly',
    category: 'instrument',
    title: 'INSTRUMENT ANOMALY',
    log: 'A scientific instrument reports an anomaly. Diagnostics in progress.',
    logType: 'danger',
    requires: (m) => m.instruments.length > 0,
    weight: (m) => 1 + m.instruments.length * 0.4,
    impact: { instruments: -25 },
    firesAt: 50,
    decision: {
      id: 'instrument-anomaly-d',
      event: 'instrument',
      title: 'INSTRUMENT RECOVERY OPTIONS',
      description: 'One instrument has stopped responding. Recovery attempts cost time and power.',
      options: [
        {
          id: 'restart', label: 'Attempt restart sequence',
          description: 'Power-cycle the instrument and re-run calibration.',
          consequence: 'Instrument partially recovered with reduced sensitivity.',
          effect: { instruments: 6, power: -6 },
          scienceDelta: 0,
          lesson: 'Real mission teams routinely recover instruments by power-cycling — at the cost of operational time.',
        },
        {
          id: 'redistribute', label: 'Reallocate its power to remaining instruments',
          description: 'Accept the loss; boost the healthy instruments.',
          consequence: 'Remaining instruments operate at enhanced capacity.',
          effect: { power: 4 },
          scienceDelta: -1,
          lesson: 'Missions often sacrifice a failed capability to strengthen the rest of the payload.',
        },
        {
          id: 'continue', label: 'Continue with remaining instruments',
          description: 'No recovery attempt; continue the observing plan.',
          consequence: 'Mission adapts. Some objectives will be modified.',
          effect: { instruments: -10 },
          scienceDelta: -1,
          lesson: 'Sometimes the best move is to protect the plan rather than chase a single failure.',
        },
      ],
    },
  },
  {
    id: 'trajectory-drift',
    category: 'navigation',
    title: 'TRAJECTORY DEVIATION',
    log: 'Trajectory tracking shows deviation from the planned course. A correction maneuver may be needed.',
    logType: 'warning',
    requires: (m, s) => s.propulsionSuitability < 85,
    weight: (m, s) => (s.propulsionSuitability < 40 ? 3 : 1),
    impact: { navigation: -28 },
    firesAt: 24,
    decision: {
      id: 'trajectory-d',
      event: 'navigation',
      title: 'COURSE CORRECTION DECISION',
      description: 'Flight dynamics offers correction options with different propellant costs.',
      options: [
        {
          id: 'full-burn', label: 'Execute full correction burn',
          description: 'Restore nominal trajectory; costs propellant.',
          consequence: 'Trajectory corrected. Propellant reserves reduced.',
          effect: { navigation: 22, propulsion: -15 },
          scienceDelta: 0,
          lesson: 'Propellant is survival: full corrections restore precision but spend reserves you may need later.',
        },
        {
          id: 'partial-burn', label: 'Execute partial correction',
          description: 'Split the difference; save propellant.',
          consequence: 'Partial correction. Approach will be adjusted.',
          effect: { navigation: 10, propulsion: -6 },
          scienceDelta: -1,
          lesson: 'Partial corrections trade precision for reserve — mission managers make this call constantly.',
        },
        {
          id: 'accept', label: 'Accept deviation and adapt the science plan',
          description: 'Save all propellant; adapt observations to the new geometry.',
          consequence: 'Destination still reachable. Some observation geometries change.',
          effect: { navigation: -8, instruments: 3 },
          scienceDelta: 0,
          lesson: 'Adapting the science plan to reality is a hallmark of successful mission operations.',
        },
      ],
    },
  },
  {
    id: 'radiation-belt',
    category: 'radiation',
    title: 'RADIATION ENVIRONMENT ELEVATED',
    log: 'Radiation levels rising. Electronics exposure increasing.',
    logType: 'danger',
    requires: (m, s) => {
      const dest = m.destination ? OUTERMOST.includes(m.destination) : false;
      return dest || s.destinationCompatibility < 50;
    },
    weight: (m) => (m.destination === 'jupiter' ? 4 : m.destination === 'saturn' ? 2 : 1),
    impact: { radiation: 45, power: -8 },
    firesAt: 42,
    decision: {
      id: 'radiation-d',
      event: 'radiation',
      title: 'RADIATION PROTOCOL DECISION',
      description: 'The spacecraft is entering a high-radiation zone. Electronics protection must be balanced against science time.',
      options: [
        {
          id: 'shield', label: 'Activate radiation shielding protocols',
          description: 'Power up protective modes; reduce exposure.',
          consequence: 'Systems protected. Power consumption increased.',
          effect: { radiation: -30, power: -12 },
          scienceDelta: 0,
          lesson: 'Radiation shielding costs power — Europa Clipper carries a dedicated titanium vault for exactly this reason.',
        },
        {
          id: 'pause-instruments', label: 'Pause instruments and ride it out',
          description: 'Safest for electronics; loses observation time.',
          consequence: 'Electronics protected. Science window reduced.',
          effect: { radiation: -18, instruments: -10 },
          scienceDelta: -1,
          lesson: 'Sometimes the best science decision is to stop observing — dead instruments discover nothing.',
        },
        {
          id: 'push-through', label: 'Push through and keep observing',
          description: 'Accept wear for unique radiation-zone science.',
          consequence: 'Maximum data collected. System wear increased.',
          effect: { radiation: 15, instruments: 6, power: -6 },
          scienceDelta: 2,
          lesson: 'High-risk observations can yield unique data — Juno survives Jupiter’s belts via heavily hardened electronics and a polar orbit.',
        },
      ],
    },
  },
  {
    id: 'propulsion-anomaly',
    category: 'propulsion',
    title: 'PROPULSION ANOMALY',
    log: 'Propulsion system readings are anomalous. Thrust performance below nominal.',
    logType: 'danger',
    requires: (m, s) => s.propulsionSuitability < 60,
    weight: () => 2,
    impact: { propulsion: -30 },
    firesAt: 33,
    decision: {
      id: 'propulsion-d',
      event: 'propulsion',
      title: 'PROPULSION SYSTEM RESPONSE',
      description: 'Thrust performance is degrading. Engineers propose three response paths.',
      options: [
        {
          id: 'diagnostic', label: 'Run diagnostics and recalibrate',
          description: 'Takes time; often fixes valve/thruster issues.',
          consequence: 'Propulsion partially restored. Mission time cost.',
          effect: { propulsion: 14, instruments: -4 },
          scienceDelta: -1,
          lesson: 'Diagnostics trade science time for system health — an evergreen mission-operations dilemma.',
        },
        {
          id: 'backup', label: 'Switch to backup thruster branch',
          description: 'Redundancy exists for this exact scenario.',
          consequence: 'Reduced thrust capability. Mission continues.',
          effect: { propulsion: 5, navigation: -5 },
          scienceDelta: 0,
          lesson: 'Redundant systems are why most anomalies are not fatal — good designs assume failures will happen.',
        },
        {
          id: 'continue', label: 'Continue on current trajectory',
          description: 'Save propellant; accept reduced maneuverability.',
          consequence: 'No correction burns available for the rest of cruise.',
          effect: { propulsion: -8 },
          scienceDelta: 0,
          lesson: 'Choosing not to act is also a decision — and it closes doors later.',
        },
      ],
    },
  },
];

// ── Science execution ────────────────────────────────────────────────────────

export interface ObservationResult {
  def: ObservationDef;
  completed: boolean;
}

export interface ScienceStats {
  observationsCompleted: number;
  instrumentsOperated: number;
  majorFindings: number;
  dataReturned: string;
  objectivesCompletedPercent: number;
}

/** Run science checks for every eligible instrument/observation pair. */
export function runScienceChecks(
  mission: MissionState,
  systems: SystemStatus,
  /** 0–2 modifier from player decisions (e.g. continuing science during comm loss). */
  decisionModifier: number,
  rng: () => number = Math.random,
): { results: ObservationResult[]; stats: ScienceStats } {
  const dest = mission.destination;
  const results: ObservationResult[] = [];

  if (!dest) {
    return {
      results,
      stats: { observationsCompleted: 0, instrumentsOperated: 0, majorFindings: 0, dataReturned: '0 GB', objectivesCompletedPercent: 0 },
    };
  }

  const instrumentHealth = systems.instruments / 100;
  const powered = Math.min(systems.power / 100, 1);

  for (const inst of mission.instruments) {
    const eligible = OBSERVATIONS.filter(o =>
      o.instrument === inst &&
      (o.validAt.length === 0 || o.validAt.includes(dest)) &&
      !o.invalidAt.includes(dest)
    );
    for (const obs of eligible) {
      const chance = Math.min(
        obs.baseChance * (0.55 + 0.45 * instrumentHealth) * (0.7 + 0.3 * powered) * (1 + decisionModifier * 0.15),
        0.95,
      );
      const completed = rng() < chance;
      results.push({ def: obs, completed });
    }
  }

  const completedResults = results.filter(r => r.completed);
  const majorFindings = completedResults.filter(r => r.def.isMajorFinding).length;
  const instrumentsOperated = new Set(completedResults.map(r => r.def.instrument)).size;

  // Data returned: scaled by communication capability.
  const commHealth = systems.communication / 100;
  const distCat = DESTINATIONS[dest].distanceCategory;
  const dataRate = { 'low-gain': 0.3, 'high-gain': 0.75, 'deep-space': 1 }[mission.communication ?? 'low-gain'];
  const distFactor = { near: 1, inner: 0.9, outer: 0.7, deep: 0.55 }[distCat] ?? 0.7;
  const totalGB = Math.round(completedResults.length * 4.2 * dataRate * distFactor * (0.5 + commHealth / 2) * 10) / 10;

  // Objectives completed: instruments operated vs available + major bonus.
  const coverage = mission.instruments.length ? instrumentsOperated / mission.instruments.length : 0;
  const objectivesPercent = Math.round(Math.min(coverage * 82 + majorFindings * 9, 100));

  return {
    results,
    stats: {
      observationsCompleted: completedResults.length,
      instrumentsOperated,
      majorFindings,
      dataReturned: `${totalGB} GB`,
      objectivesCompletedPercent: objectivesPercent,
    },
  };
}

// ── Final outcome ────────────────────────────────────────────────────────────

export interface MissionOutcome {
  category: 'successful' | 'successful-with-challenges' | 'partially-successful' | 'ended-early' | 'extraordinary';
  label: string;
  subtitle: string;
}

export function computeMissionOutcome(
  mission: MissionState,
  systems: SystemStatus,
  science: ScienceStats,
  eventsFired: number,
): MissionOutcome {
  const scores = calculateMissionScores(mission);
  const overall = getOverallScore(scores);
  const health = (systems.power + systems.communication + systems.propulsion + systems.instruments) / 4;
  const sci = science.objectivesCompletedPercent;

  // Extraordinary result: exceptional design + major findings + healthy craft.
  if (sci >= 70 && science.majorFindings >= 2 && health >= 65 && overall >= 65) {
    return {
      category: 'extraordinary',
      label: 'EXTRAORDINARY SCIENTIFIC RESULT',
      subtitle: 'Your mission returned findings that will reshape how we understand this destination.',
    };
  }
  if (health < 25 || sci <= 5) {
    return {
      category: 'ended-early',
      label: 'MISSION ENDED EARLY',
      subtitle: 'Critical system degradation forced the mission to end before its objectives could be met.',
    };
  }
  if (health >= 70 && sci >= 55 && eventsFired <= 2) {
    return {
      category: 'successful',
      label: 'MISSION SUCCESSFUL',
      subtitle: 'Your configuration handled its destination well and completed its science plan.',
    };
  }
  if (health >= 45 && sci >= 35) {
    return {
      category: 'successful-with-challenges',
      label: 'SUCCESSFUL — WITH CHALLENGES',
      subtitle: 'The mission overcame meaningful challenges and still achieved its primary objectives.',
    };
  }
  return {
    category: 'partially-successful',
    label: 'PARTIALLY SUCCESSFUL',
    subtitle: 'The mission reached its destination but completed only part of its science plan.',
  };
}

// ── Failure investigation ────────────────────────────────────────────────────

export interface InvestigationNode {
  cause: string;
  contributingFactors: string[];
  systemsInvolved: string[];
  whatCouldHaveBeenDone: string[];
  educationalLesson: string;
}

export function buildInvestigation(
  outcome: MissionOutcome,
  systems: SystemStatus,
  eventsFired: { category: EventCategory; title: string }[],
  decisions: string[],
): InvestigationNode | null {
  if (outcome.category === 'successful' || outcome.category === 'extraordinary') return null;

  const causes: string[] = [];
  const factors: string[] = [];
  const involved: string[] = [];
  const fixes: string[] = [];

  if (systems.power < 50) {
    involved.push('Power system');
    causes.push('Power reserves fell below the level needed to keep all systems alive.');
    factors.push('High combined demand from active instruments and systems.');
    factors.push('Power-generation capability mismatched with destination conditions.');
    fixes.push('Match the power system to the destination (solar output falls with the square of distance from the Sun).');
    fixes.push('Carry fewer instruments, or plan duty-cycling into the observing plan.');
  }
  if (systems.communication < 50) {
    involved.push('Communication system');
    causes.push('Communication capability was insufficient for reliable contact at this distance.');
    factors.push('Antenna class vs destination range mismatch.');
    fixes.push('Choose an antenna class rated for the destination’s light-time and data volume.');
  }
  if (systems.instruments < 45) {
    involved.push('Science instruments');
    causes.push('Instrument capability degraded before the science plan could be completed.');
    factors.push('Operating many instruments simultaneously increased wear and demand.');
    fixes.push('Prioritize a focused instrument suite sized to the spacecraft’s real capacity.');
  }
  if (systems.propulsion < 45 || systems.navigation < 45) {
    involved.push('Propulsion / navigation');
    causes.push('Propulsion performance could not support the maneuvers this mission required.');
    factors.push('Propulsion system mismatched with the destination distance.');
    fixes.push('Select propulsion suited to the distance: chemical for near targets, ion/electric for deep space.');
  }
  if (decisions.some(d => d.toLowerCase().includes('continue'))) {
    factors.push('Operations continued at full pace through system stress.');
    fixes.push('Earlier resource conservation (safe mode or duty-cycling) would have preserved margin.');
  }
  if (involved.length === 0) {
    involved.push('Overall mission margins');
    causes.push('The configuration left too little margin to absorb normal mission challenges.');
    fixes.push('Add margin in one system (power, comms, or propulsion) rather than maximizing every capability at once.');
  }

  return {
    cause: causes[0] ?? 'System degradation exceeded mission margins.',
    contributingFactors: factors,
    systemsInvolved: involved,
    whatCouldHaveBeenDone: fixes.slice(0, 3),
    educationalLesson:
      'Mission planners must balance science ambition against spacecraft resources. Failures are usually systemic — a configuration that leaves no margin for the unexpected, not a single bad decision.',
  };
}

// ── Lessons for the result screen ────────────────────────────────────────────

export function buildLessons(
  mission: MissionState,
  systems: SystemStatus,
  science: ScienceStats,
  decisions: string[],
): MissionResultData['lessons'] {
  const lessons: MissionResultData['lessons'] = [];
  const dest = mission.destination;
  const facts = dest ? DESTINATION_FACTS[dest] : null;

  if (decisions.some(d => d.toLowerCase().includes('safe mode'))) {
    lessons.push({
      concept: 'Autonomy & Safe Mode',
      lesson: 'When Earth was out of contact, choosing safe mode protected the spacecraft at the cost of science time. Real spacecraft do the same — survival first, science second.',
      learnHref: '/learn#autonomy',
    });
  }
  if (decisions.some(d => d.toLowerCase().includes('continue planned science'))) {
    lessons.push({
      concept: 'Autonomous Science',
      lesson: 'Continuing science while out of contact is a calculated risk that real missions take — data accumulates onboard, and the payoff can be significant if the spacecraft stays healthy.',
      learnHref: '/learn#autonomy',
    });
  }
  if (systems.power < 60) {
    lessons.push({
      concept: 'Power Systems',
      lesson: facts
        ? `Power management shaped this mission. At ${facts.label}, sunlight is about ${Math.round(((facts.solarIrradianceWm2 ?? 1361) / 1361) * 100)}% of Earth levels (NASA planetary data) — that is why power-system choice matters.`
        : 'Power management shaped this mission: every instrument and heater draws from the same finite supply.',
      learnHref: '/learn#power',
    });
  }
  if (systems.communication < 60) {
    lessons.push({
      concept: 'Communication',
      lesson: 'You experienced why deep-space communication is hard: signal strength falls with the square of distance, and light-time makes real-time control impossible.',
      learnHref: '/learn#communication',
    });
  }
  if (science.observationsCompleted > 0) {
    const insts = mission.instruments.map(i => INSTRUMENTS[i].label.toLowerCase());
    lessons.push({
      concept: 'Instruments Drive Discovery',
      lesson: `Your ${mission.instruments.length}-instrument suite (${insts.slice(0, 3).join(', ')}${insts.length > 3 ? '…' : ''}) enabled ${science.observationsCompleted} observations including ${science.majorFindings} major finding${science.majorFindings === 1 ? '' : 's'}. Discovery follows capability.`,
      learnHref: '/learn#instruments',
    });
  }
  if (dest && facts) {
    lessons.push({
      concept: 'Destination Conditions',
      lesson: `${facts.label}: ${facts.realMissionContext}`,
      learnHref: '/learn#destinations',
    });
  }
  if (lessons.length === 0) {
    lessons.push({
      concept: 'Mission Planning',
      lesson: 'A well-matched configuration handles normal challenges gracefully. Mission success comes from systems that fit the destination, not from any single hero component.',
      learnHref: '/learn#missions',
    });
  }
  return lessons.slice(0, 4);
}

// ── Event selection ──────────────────────────────────────────────────────────

/**
 * Pick which events can fire at a given progress point. Returns event defs
 * eligible now, weighted by configuration (transparent: shown in UI on request).
 */
export function selectEligibleEvents(
  mission: MissionState,
  scores: AnalysisScores,
  progress: number,
  alreadyFired: Set<string>,
): MissionEventDef[] {
  return MISSION_EVENTS.filter(ev => {
    if (alreadyFired.has(ev.id)) return false;
    if (progress < ev.firesAt) return false;
    if (progress > ev.firesAt + 25) return false; // event window
    return ev.requires(mission, scores);
  });
}

/** Weighted random pick from eligible events (returns null when none). */
export function pickEvent(
  eligible: MissionEventDef[],
  mission: MissionState,
  scores: AnalysisScores,
  rng: () => number = Math.random,
): MissionEventDef | null {
  if (eligible.length === 0) return null;
  const weights = eligible.map(ev => Math.max(0.1, ev.weight(mission, scores)));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

// ── Config summary for dashboards ────────────────────────────────────────────

export function configSummary(mission: MissionState): {
  label: string;
  detail: string;
}[] {
  const dest = mission.destination ? DESTINATIONS[mission.destination] : null;
  const facts = dest ? DESTINATION_FACTS[mission.destination!] : null;
  const delay = getCommDelay(mission.destination);
  return [
    {
      label: 'Destination',
      detail: dest ? `${dest.label} — ${facts?.earthDistanceMillionKm ?? dest.distanceKm}` : '—',
    },
    {
      label: 'Spacecraft',
      detail: mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft].label : '—',
    },
    {
      label: 'Objective',
      detail: mission.objective ? OBJECTIVES[mission.objective].label : '—',
    },
    {
      label: 'Comm delay (one-way)',
      detail: `${delay.oneWayLabel} — light-time estimate`,
    },
  ];
}
