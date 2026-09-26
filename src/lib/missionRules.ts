/**
 * MISSION RULES ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * A transparent educational rules system. Every dimension score is the sum of
 * named, human-readable "contributions" so the UI can always answer:
 *   "Why is this value what it is?" and "Why did it change?"
 *
 * These are teaching models, NOT engineering calculations. Mission DNA is a
 * profile of trade-offs — it is never presented as a winning score.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  MissionState,
  AnalysisScores,
  Instrument,
  Power,
  Propulsion,
  Communication,
  SpacecraftType,
  ScenarioType,
} from './missionData';
import {
  INSTRUMENTS,
  POWER_SYSTEMS,
  PROPULSION_SYSTEMS,
  COMMUNICATION_SYSTEMS,
  SPACECRAFT_TYPES,
  DESTINATIONS,
  OBJECTIVES,
  calculateMissionScores,
  getOverallScore,
} from './missionData';
import { DESTINATION_FACTS, TRAVEL_TIME_REFERENCE, REFERENCE_MISSIONS } from './spaceData';

// ── Shared types ─────────────────────────────────────────────────────────────

export interface DnaContribution {
  /** Stable label used both for display and for before/after diffing. */
  label: string;
  points: number;
}

export interface DnaDimension {
  key: DnaKey;
  label: string;
  short: string;              // axis label for compact display
  value: number;              // 0–100
  meaning: string;            // what the dimension measures
  explanation: string;        // why it has this value right now
  contributions: DnaContribution[];
}

export type DnaKey =
  | 'scientificValue'
  | 'scienceReturn'
  | 'powerEfficiency'
  | 'communicationReliability'
  | 'missionComplexity'
  | 'operationalRisk'
  | 'explorationCapability';

export const DNA_KEYS: DnaKey[] = [
  'scientificValue',
  'scienceReturn',
  'powerEfficiency',
  'communicationReliability',
  'missionComplexity',
  'operationalRisk',
  'explorationCapability',
];

export interface MissionDna {
  dimensions: DnaDimension[];
  /** Dated one-line description of the mission personality. */
  profileSummary: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

function listJoin(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const DEST_GROUP: Record<string, string> = {
  near: 'near-Earth',
  inner: 'inner solar system',
  outer: 'outer solar system',
  deep: 'deep space',
};

/** Rough instrument families — used for diversity, science return, and discovery eligibility. */
export type InstrumentFamily =
  | 'imaging' | 'composition' | 'subsurface' | 'fields'
  | 'thermal' | 'environment' | 'in-situ';

export const INSTRUMENT_FAMILY: Record<Instrument, InstrumentFamily> = {
  camera: 'imaging',
  spectrometer: 'composition',
  radar: 'subsurface',
  magnetometer: 'fields',
  thermal: 'thermal',
  atmospheric: 'environment',
  radiation: 'environment',
  seismometer: 'in-situ',
  particle: 'environment',
};

export const FAMILY_DISCOVERY: Record<InstrumentFamily, string> = {
  imaging: 'surface and atmospheric imaging discoveries',
  composition: 'material and composition discoveries',
  subsurface: 'subsurface and structural discoveries',
  fields: 'magnetic-field discoveries',
  thermal: 'thermal-pattern discoveries',
  environment: 'atmospheric, radiation and particle discoveries',
  'in-situ': 'seismic discoveries',
};

function totalInstrumentMass(mission: MissionState): number {
  return mission.instruments.reduce((s, i) => s + INSTRUMENTS[i].mass, 0);
}

function totalInstrumentPower(mission: MissionState): number {
  return mission.instruments.reduce((s, i) => s + INSTRUMENTS[i].power, 0);
}

// ── Mission DNA ──────────────────────────────────────────────────────────────

function dim(
  key: DnaKey,
  label: string,
  short: string,
  meaning: string,
  contributions: DnaContribution[]
): DnaDimension {
  const value = clamp(Math.round(contributions.reduce((s, c) => s + c.points, 0)));
  return {
    key,
    label,
    short,
    meaning,
    value,
    contributions: contributions.filter(c => c.points !== 0),
    explanation: '',
  };
}

export function computeMissionDna(mission: MissionState): MissionDna {
  const scores = calculateMissionScores(mission);
  const dest = mission.destination ? DESTINATIONS[mission.destination] : null;
  const destFacts = mission.destination ? DESTINATION_FACTS[mission.destination] : null;
  const sc = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;
  const families = new Set(mission.instruments.map(i => INSTRUMENT_FAMILY[i]));
  const obj = mission.objective ? OBJECTIVES[mission.objective] : null;

  // ── Scientific Value ──────────────────────────────────────────────────
  const svContribs: DnaContribution[] = [];
  const instCount = mission.instruments.length;
  if (instCount > 0) {
    svContribs.push({
      label: `${instCount} instrument${instCount > 1 ? 's' : ''} selected (+14 each, up to 70)`,
      points: Math.min(instCount * 14, 70),
    });
  }
  if (families.size > 1) {
    svContribs.push({
      label: `${families.size} different instrument families — complementary observations (+6 per extra family, up to 15)`,
      points: Math.min((families.size - 1) * 6, 15),
    });
  }
  if (obj && ['search-for-life', 'planetary-exploration', 'asteroid-exploration', 'climate-research'].includes(mission.objective!) && instCount > 0) {
    svContribs.push({
      label: `${obj.label} objective aligns with your instrument suite (+10)`,
      points: 10,
    });
  }
  const scientificValue = dim(
    'scientificValue', 'Scientific Value', 'Sci-Value',
    'How much scientific capability your instrument suite could deliver for your objective.',
    svContribs
  );

  // ── Science Return (data actually deliverable) ────────────────────────
  const srContribs: DnaContribution[] = [];
  if (instCount > 0) {
    srContribs.push({
      label: `${instCount} instrument${instCount > 1 ? 's' : ''} generating data (+10 each, up to 50)`,
      points: Math.min(instCount * 10, 50),
    });
  }
  if (mission.communication) {
    srContribs.push({
      label: `${COMMUNICATION_SYSTEMS[mission.communication].label} data-return capability (${Math.round(scores.communication * 0.5)})`,
      points: round1(scores.communication * 0.5),
    });
  }
  if (mission.spacecraft === 'cubesat' && instCount > 1) {
    srContribs.push({
      label: `CubeSat storage limits with ${instCount} instruments (−12)`,
      points: -12,
    });
  }
  if (mission.spacecraft === 'flyby') {
    srContribs.push({
      label: 'Flyby observation window is short — limited repeat observations (−8)',
      points: -8,
    });
  }
  if (mission.spacecraft === 'lander' || mission.spacecraft === 'rover') {
    srContribs.push({
      label: 'Surface operations allow long, repeated measurement campaigns (+6)',
      points: 6,
    });
  }
  const scienceReturn = dim(
    'scienceReturn', 'Science Return', 'Sci-Return',
    'How much of the collected science can realistically be completed and returned to Earth.',
    srContribs
  );

  // ── Power Efficiency ──────────────────────────────────────────────────
  const peContribs: DnaContribution[] = [];
  if (mission.power && mission.destination) {
    const suit = dest!.powerSuitability[mission.power];
    const psys = POWER_SYSTEMS[mission.power];
    peContribs.push({
      label: `${psys.label} at ${dest!.label} (${Math.round(suit * 0.8)})`,
      points: Math.round(suit * 0.8),
    });
    if (mission.power === 'solar' && destFacts && destFacts.solarIlluminationPercentOfEarth < 10) {
      peContribs.push({
        label: `Sunlight at ${dest!.label} is only ${destFacts.solarIlluminationPercentOfEarth}% of Earth's (inverse-square law) (−20)`,
        points: -20,
      });
    }
    const draw = totalInstrumentPower(mission);
    const output = psys.powerOutput;
    if (draw > output * 0.8) {
      peContribs.push({
        label: `Instruments draw ${draw} W of ${output} W available (−15)`,
        points: -15,
      });
    } else if (draw > output * 0.5) {
      peContribs.push({
        label: `Instruments draw ${draw} W of ${output} W available (−7)`,
        points: -7,
      });
    }
    if (mission.power === 'hybrid') {
      peContribs.push({
        label: 'Hybrid system handles eclipses and night operations (+8), at a mass cost',
        points: 8,
      });
    }
  }
  const powerEfficiency = dim(
    'powerEfficiency', 'Power Efficiency', 'Power',
    'How well your power system matches the destination and your instruments\u2019 demand.',
    peContribs
  );

  // ── Communication Reliability ─────────────────────────────────────────
  const crContribs: DnaContribution[] = [];
  if (mission.communication && mission.destination) {
    crContribs.push({
      label: `${COMMUNICATION_SYSTEMS[mission.communication].label} at ${DEST_GROUP[dest!.distanceCategory]} range (${Math.round(scores.communication * 0.9)})`,
      points: round1(scores.communication * 0.9),
    });
    if (scores.communication >= 85 && ['outer', 'deep'].includes(dest!.distanceCategory)) {
      crContribs.push({
        label: 'Reliable deep-space contact enables steady data return (+10)',
        points: 10,
      });
    }
    if (mission.communication === 'low-gain' && instCount > 3) {
      crContribs.push({
        label: `Low-gain bandwidth cannot carry ${instCount} instruments\u2019 data (−10)`,
        points: -10,
      });
    }
  }
  const communicationReliability = dim(
    'communicationReliability', 'Communication Reliability', 'Comms',
    'How dependably the spacecraft can send commands home and science data back.',
    crContribs
  );

  // ── Mission Complexity ────────────────────────────────────────────────
  const mcContribs: DnaContribution[] = [];
  if (instCount > 0) {
    mcContribs.push({
      label: `${instCount} instrument${instCount > 1 ? 's' : ''} to build, test and operate (+8 each)`,
      points: instCount * 8,
    });
  }
  if (dest) {
    const distScore = { near: 20, inner: 40, outer: 70, deep: 90 }[dest.distanceCategory] ?? 50;
    mcContribs.push({
      label: `${dest.label} is a ${DEST_GROUP[dest.distanceCategory]} target (+${distScore})`,
      points: distScore,
    });
  }
  if (mission.spacecraft === 'rover') {
    mcContribs.push({ label: 'Rovers add mobility, autonomy and landing complexity (+15)', points: 15 });
  } else if (mission.spacecraft === 'lander') {
    mcContribs.push({ label: 'Landing on a surface adds descent and touchdown risk (+10)', points: 10 });
  }
  if (mission.power === 'hybrid') {
    mcContribs.push({ label: 'Hybrid power adds a second power chain to manage (+5)', points: 5 });
  }
  const missionComplexity = dim(
    'missionComplexity', 'Mission Complexity', 'Complexity',
    'How many interacting systems the mission must manage. High complexity is not bad — it means more capability and more things to balance.',
    mcContribs
  );

  // ── Operational Risk ──────────────────────────────────────────────────
  const orContribs: DnaContribution[] = [];
  const riskFactors: string[] = [];
  if (mission.destination) {
    const suitability = Math.round(
      (scores.payloadBalance + scores.powerCompatibility + scores.propulsionSuitability +
        scores.communication + scores.destinationCompatibility) / 5
    );
    orContribs.push({
      label: `Baseline from system-destination fit (${Math.round((100 - suitability) * 0.7)})`,
      points: Math.round((100 - suitability) * 0.7),
    });
    if (scores.powerCompatibility < 40) {
      riskFactors.push(`${POWER_SYSTEMS[mission.power!].label} is a weak match for ${dest!.label}`);
    }
    if (scores.communication < 40) {
      riskFactors.push(`${COMMUNICATION_SYSTEMS[mission.communication!].label} struggles at this range`);
    }
    if (scores.destinationCompatibility < 50) {
      riskFactors.push(`${sc?.label ?? 'Spacecraft'} is not designed for ${dest!.label}`);
    }
    const tm = totalInstrumentMass(mission);
    if (sc && tm > sc.payloadCapacity) {
      riskFactors.push(`Payload ${tm} kg exceeds ${sc.label} capacity (${sc.payloadCapacity} kg)`);
    }
    if (['jupiter', 'saturn'].includes(mission.destination)) {
      orContribs.push({ label: 'Radiation environment around giant planets (+8)', points: 8 });
      riskFactors.push('Intense radiation belts around the giant planet');
    }
    if (mission.power === 'solar' && mission.destination === 'mars') {
      orContribs.push({ label: 'Mars dust storms can block solar panels (+5)', points: 5 });
      riskFactors.push('Mars dust storms can cut solar output for weeks');
    }
  }
  riskFactors.forEach(f => orContribs.push({ label: `${f} (risk factor, +0 tracking)`, points: 0 }));
  const operationalRisk = dim(
    'operationalRisk', 'Operational Risk', 'Risk',
    'How likely mission events are to threaten objectives. Lower is safer; some risk is unavoidable and even informative.',
    orContribs
  );

  // ── Exploration Capability ────────────────────────────────────────────
  const ecContribs: DnaContribution[] = [];
  if (mission.spacecraft) {
    const reach: Record<SpacecraftType, number> = {
      orbiter: 70, lander: 62, rover: 75, flyby: 42, telescope: 55, cubesat: 32,
    };
    ecContribs.push({
      label: `${sc!.label} vantage point (${reach[mission.spacecraft]})`,
      points: reach[mission.spacecraft],
    });
  }
  if (mission.instruments.includes('radar')) {
    ecContribs.push({ label: 'Radar sees below the surface (+8)', points: 8 });
  }
  if (mission.instruments.includes('seismometer') && ['lander', 'rover'].includes(mission.spacecraft ?? '')) {
    ecContribs.push({ label: 'Seismometer needs surface contact — your spacecraft provides it (+6)', points: 6 });
  }
  if (mission.instruments.includes('seismometer') && mission.spacecraft && ['orbiter', 'flyby', 'telescope', 'cubesat'].includes(mission.spacecraft)) {
    ecContribs.push({ label: 'Seismometer needs surface contact — an orbiting or flying spacecraft cannot deploy it (−10)', points: -10 });
  }
  if (mission.destination) {
    ecContribs.push({
      label: `Destination accessibility for this spacecraft (${Math.round(scores.destinationCompatibility * 0.2)})`,
      points: round1(scores.destinationCompatibility * 0.2),
    });
  }
  const explorationCapability = dim(
    'explorationCapability', 'Exploration Capability', 'Exploration',
    'How much of the destination your mission can actually reach, see and study.',
    ecContribs
  );

  // ── Explanations ──────────────────────────────────────────────────────
  scientificValue.explanation = buildScientificValueExplanation(mission, families, obj);
  scienceReturn.explanation = buildScienceReturnExplanation(mission, instCount);
  powerEfficiency.explanation = buildPowerExplanation(mission, destFacts);
  communicationReliability.explanation = buildCommExplanation(mission);
  missionComplexity.explanation = buildComplexityExplanation(mission, instCount);
  operationalRisk.explanation = riskFactors.length > 0
    ? `Risk factors in your current design: ${listJoin(riskFactors)}.`
    : mission.destination
      ? 'No major risk factors detected — your systems are well matched to the destination. Real missions still carry residual risk.'
      : 'Select a destination to evaluate risk.';
  explorationCapability.explanation = buildExplorationExplanation(mission);

  const dimensions = [
    scientificValue, scienceReturn, powerEfficiency, communicationReliability,
    missionComplexity, operationalRisk, explorationCapability,
  ];

  const profileSummary = buildProfileSummary(dimensions, mission);

  return { dimensions, profileSummary };
}

function buildScientificValueExplanation(
  mission: MissionState,
  families: Set<InstrumentFamily>,
  obj: ReturnType<typeof Object.values> extends never ? never : (typeof OBJECTIVES)[keyof typeof OBJECTIVES] | null
): string {
  const parts: string[] = [];
  if (mission.instruments.length === 0) {
    return 'No instruments selected yet — a mission without instruments cannot do science. Each instrument you add increases potential science return because it can observe something the others cannot.';
  }
  const famList = Array.from(families).map(f => FAMILY_DISCOVERY[f].replace(' discoveries', ''));
  parts.push(`Your instrument suite covers ${listJoin(famList)} — more families means complementary observations.`);
  if (obj) {
    parts.push(`For a ${obj.label.toLowerCase()} objective, ${mission.instruments.length >= 3 ? 'this suite gives multiple independent lines of evidence, which is how real missions strengthen scientific claims.' : 'adding another complementary instrument would strengthen the evidence.'}`);
  }
  return parts.join(' ');
}

function buildScienceReturnExplanation(mission: MissionState, instCount: number): string {
  const parts: string[] = [];
  if (instCount === 0) return 'No instruments means no science data to return.';
  parts.push(`${instCount} instrument${instCount > 1 ? 's are' : ' is'} generating data, but data is only "returned" if the communication link can carry it home.`);
  if (mission.communication === 'low-gain' && instCount > 2) {
    parts.push('Your low-gain antenna is the bottleneck here — it cannot move much data per pass.');
  } else if (mission.communication === 'deep-space' || mission.communication === 'high-gain') {
    parts.push('Your antenna can keep up with the instruments\u2019 data volume at this destination.');
  }
  if (mission.spacecraft === 'cubesat' && instCount > 1) {
    parts.push('A CubeSat has very limited onboard storage, so multiple instruments compete for space.');
  }
  return parts.join(' ');
}

function buildPowerExplanation(mission: MissionState, destFacts: (typeof DESTINATION_FACTS)[keyof typeof DESTINATION_FACTS] | null): string {
  if (!mission.power) return 'Choose a power system to see how it interacts with your destination and instruments.';
  const psys = POWER_SYSTEMS[mission.power];
  const draw = totalInstrumentPower(mission);
  const parts: string[] = [`${psys.label} provides up to ${psys.powerOutput} W; your instruments draw ${draw} W.`];
  if (destFacts && mission.power === 'solar') {
    parts.push(`At your destination, sunlight provides about ${destFacts.solarIlluminationPercentOfEarth}% of what it does at Earth (inverse-square law) — that is why solar suitability falls with distance.`);
  }
  if (destFacts && mission.power === 'rps') {
    parts.push('An RPS makes its own heat from radioactive decay, so its output barely changes with distance from the Sun.');
  }
  if (draw > psys.powerOutput * 0.8) {
    parts.push('Your instruments demand most of the available power, so some cannot run simultaneously — expect power-management decisions during flight.');
  }
  return parts.join(' ');
}

function buildCommExplanation(mission: MissionState): string {
  if (!mission.communication) return 'Choose a communication system to see how distance and bandwidth interact.';
  const c = COMMUNICATION_SYSTEMS[mission.communication];
  if (!mission.destination) return `${c.label}: ${c.description}`;
  const facts = DESTINATION_FACTS[mission.destination];
  const parts: string[] = [];
  if (facts.solarIlluminationPercentOfEarth < 5 || ['outer', 'deep'].includes(DESTINATIONS[mission.destination].distanceCategory)) {
    parts.push(`Signals take many minutes to hours to reach ${DESTINATIONS[mission.destination].label} — a directional, powerful antenna is essential.`);
  } else {
    parts.push(`At ${DESTINATIONS[mission.destination].label} the delay is short, but data volume still depends on antenna type.`);
  }
  parts.push(`${c.label} ${scoresCompatible(mission) ? 'matches' : 'is a limiting factor for'} this destination.`);
  return parts.join(' ');
}

function scoresCompatible(mission: MissionState): boolean {
  if (!mission.communication || !mission.destination) return true;
  const c = COMMUNICATION_SYSTEMS[mission.communication];
  return c.suitableDestinations.includes(mission.destination);
}

function buildComplexityExplanation(mission: MissionState, instCount: number): string {
  const parts: string[] = [];
  if (instCount > 3) parts.push(`${instCount} instruments must all be built, tested, powered and operated — complexity grows with every addition.`);
  if (mission.destination && ['outer', 'deep'].includes(DESTINATIONS[mission.destination].distanceCategory)) {
    parts.push('Your distant destination adds navigation, timing and autonomy challenges.');
  }
  if (parts.length === 0) parts.push('Your current design is relatively simple — fewer interacting systems means fewer failure points, but also less capability.');
  return parts.join(' ');
}

function buildExplorationExplanation(mission: MissionState): string {
  const parts: string[] = [];
  if (mission.spacecraft) {
    const sc = SPACECRAFT_TYPES[mission.spacecraft];
    parts.push(`${sc.label}: ${sc.description}`);
  }
  if (mission.destination && mission.spacecraft && !scSuitable(mission)) {
    parts.push(`Note: ${SPACECRAFT_TYPES[mission.spacecraft].label} is not typically used for ${DESTINATIONS[mission.destination].label} — real missions pair spacecraft types with destinations carefully.`);
  }
  return parts.join(' ');
}

function scSuitable(mission: MissionState): boolean {
  return mission.spacecraft != null && mission.destination != null &&
    SPACECRAFT_TYPES[mission.spacecraft].suitableDestinations.includes(mission.destination);
}

function buildProfileSummary(dimensions: DnaDimension[], mission: MissionState): string {
  const get = (k: DnaKey) => dimensions.find(d => d.key === k)?.value ?? 0;
  const sci = get('scientificValue');
  const risk = get('operationalRisk');
  const complexity = get('missionComplexity');
  const destLabel = mission.destination ? DESTINATIONS[mission.destination].label : 'an undecided destination';
  if (sci >= 70 && risk >= 55) return `An ambitious science mission to ${destLabel} — high capability that must be balanced against meaningful risk.`;
  if (sci >= 70) return `A science-forward mission to ${destLabel} with a well-managed risk profile.`;
  if (sci <= 30 && complexity <= 35) return `A lean, low-complexity mission to ${destLabel} — safe, but limited scientific reach.`;
  return `A balanced mission design for ${destLabel} with moderate scientific reach and manageable risk.`;
}

// ── DNA diffing (the "why did this change?" engine) ─────────────────────────

export interface DnaDelta {
  key: DnaKey;
  label: string;
  before: number;
  after: number;
  delta: number;
  /** Human-readable reasons, each tied to a rule that fired differently. */
  reasons: string[];
}

export function compareDna(before: MissionState, after: MissionState): DnaDelta[] {
  const dnaBefore = computeMissionDna(before);
  const dnaAfter = computeMissionDna(after);
  return DNA_KEYS.map(key => {
    const dBefore = dnaBefore.dimensions.find(d => d.key === key)!;
    const dAfter = dnaAfter.dimensions.find(d => d.key === key)!;
    const beforeMap = new Map(dBefore.contributions.map(c => [c.label, c.points]));
    const afterMap = new Map(dAfter.contributions.map(c => [c.label, c.points]));
    const labels = new Set([...beforeMap.keys(), ...afterMap.keys()]);
    const reasons: string[] = [];
    labels.forEach(label => {
      const b = beforeMap.get(label) ?? 0;
      const a = afterMap.get(label) ?? 0;
      if (Math.abs(a - b) < 0.5) return;
      if (b === 0 && a > 0) reasons.push(`${label.replace(/\s*\([^)]*\)\s*$/, '')} → ${a > 0 ? '+' : ''}${round1(a)}`);
      else if (a === 0 && b > 0) reasons.push(`${label.replace(/\s*\([^)]*\)\s*$/, '')} → ${b > 0 ? '+' : ''}${round1(b)} before, now gone`);
      else reasons.push(`${label.replace(/\s*\([^)]*\)\s*$/, '')}: ${b > 0 ? '+' : ''}${round1(b)} → ${a > 0 ? '+' : ''}${round1(a)}`);
    });
    return {
      key,
      label: dBefore.label,
      before: dBefore.value,
      after: dAfter.value,
      delta: dAfter.value - dBefore.value,
      reasons,
    };
  });
}

// ── Deterministic scenario outlook (no randomness) ──────────────────────────

export interface ScenarioOutlook {
  probabilities: { scenario: ScenarioType; label: string; percent: number }[];
  mostLikely: ScenarioType;
}

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  smooth: 'Smooth mission',
  'power-challenge': 'Power challenge',
  'comm-interrupted': 'Communication interruption',
  'instrument-failure': 'Instrument anomaly',
  'navigation-challenge': 'Navigation challenge',
  'radiation-challenge': 'Radiation challenge',
  'propulsion-problem': 'Propulsion problem',
  'science-breakthrough': 'Science breakthrough',
  'partial-success': 'Constrained operations',
  'mission-failure': 'Mission-ending failure',
};

/**
 * Transparent, deterministic likelihood model derived from the design scores.
 * Used by the What-If Lab to compare potential outcomes — explicitly a
 * teaching model, not a Monte-Carlo engineering estimate.
 */
export function scenarioOutlook(mission: MissionState): ScenarioOutlook {
  const scores = calculateMissionScores(mission);
  const overall = getOverallScore(scores);
  const w: Record<ScenarioType, number> = {
    smooth: overall >= 70 ? 40 : 8,
    'science-breakthrough': scores.scientificValue > 75 && overall > 65 ? 22 : 5,
    'power-challenge': scores.powerCompatibility < 45 ? 48 : 8,
    'comm-interrupted': scores.communication < 45 ? 44 : 8,
    'navigation-challenge': scores.propulsionSuitability < 45 ? 42 : 8,
    'radiation-challenge': scores.destinationCompatibility < 50 || ['jupiter', 'saturn'].includes(mission.destination ?? '') ? 36 : 7,
    'instrument-failure': mission.instruments.length >= 5 ? 26 : 9,
    'propulsion-problem': mission.propulsion === 'chemical' && ['uranus', 'neptune'].includes(mission.destination ?? '') ? 38 : 6,
    'partial-success': overall >= 45 && overall < 70 ? 30 : 12,
    'mission-failure': overall < 30 ? 75 : (Object.values(scores).filter(v => v < 35).length * 9) + (overall < 45 ? 18 : 0),
  };
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const probabilities = (Object.entries(w) as [ScenarioType, number][])
    .map(([scenario, weight]) => ({
      scenario,
      label: SCENARIO_LABELS[scenario],
      percent: Math.round((weight / total) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);
  return { probabilities, mostLikely: probabilities[0].scenario };
}

// ── What-If Lab ──────────────────────────────────────────────────────────────

export type WhatIfCategory = 'power' | 'propulsion' | 'communication' | 'instruments';

export interface WhatIfVariant {
  id: string;
  category: WhatIfCategory;
  label: string;          // "Solar Panels → Hybrid"
  description: string;    // why a designer would try this
  apply: (m: MissionState) => MissionState;
}

export function generateWhatIfVariants(mission: MissionState): WhatIfVariant[] {
  const variants: WhatIfVariant[] = [];

  (Object.keys(POWER_SYSTEMS) as Power[]).forEach(p => {
    if (p === mission.power) return;
    variants.push({
      id: `power-${p}`,
      category: 'power',
      label: `${mission.power ? POWER_SYSTEMS[mission.power].label : 'No power'} → ${POWER_SYSTEMS[p].label}`,
      description: `Test how ${POWER_SYSTEMS[p].label.toLowerCase()} changes your mission's power, risk and complexity.`,
      apply: m => ({ ...m, power: p }),
    });
  });

  (Object.keys(PROPULSION_SYSTEMS) as Propulsion[]).forEach(p => {
    if (p === mission.propulsion) return;
    variants.push({
      id: `propulsion-${p}`,
      category: 'propulsion',
      label: `${mission.propulsion ? PROPULSION_SYSTEMS[mission.propulsion].label : 'No propulsion'} → ${PROPULSION_SYSTEMS[p].label}`,
      description: `Test how ${PROPULSION_SYSTEMS[p].label.toLowerCase()} changes reach, maneuvering and suitability.`,
      apply: m => ({ ...m, propulsion: p }),
    });
  });

  (Object.keys(COMMUNICATION_SYSTEMS) as Communication[]).forEach(c => {
    if (c === mission.communication) return;
    variants.push({
      id: `comm-${c}`,
      category: 'communication',
      label: `${mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].label : 'No comm'} → ${COMMUNICATION_SYSTEMS[c].label}`,
      description: `Test how ${COMMUNICATION_SYSTEMS[c].label.toLowerCase()} changes data return and reliability.`,
      apply: m => ({ ...m, communication: c }),
    });
  });

  (Object.keys(INSTRUMENTS) as Instrument[]).forEach(i => {
    const adding = !mission.instruments.includes(i);
    variants.push({
      id: `instrument-${adding ? 'add' : 'remove'}-${i}`,
      category: 'instruments',
      label: `${adding ? 'Add' : 'Remove'} ${INSTRUMENTS[i].label}`,
      description: adding
        ? `See what ${INSTRUMENTS[i].label.toLowerCase()} would add — and what it would cost in mass and power.`
        : `See what your mission would lose without ${INSTRUMENTS[i].label.toLowerCase()}.`,
      apply: m => ({
        ...m,
        instruments: adding ? [...m.instruments, i] : m.instruments.filter(x => x !== i),
      }),
    });
  });

  return variants;
}

export interface WhatIfComparison {
  variant: WhatIfVariant;
  dnaDeltas: DnaDelta[];
  suitability: {
    label: string;
    before: number;
    after: number;
  }[];
  outlook: {
    before: ScenarioOutlook;
    after: ScenarioOutlook;
  };
  /** True trade-off framing: gains AND losses, never "better". */
  gains: string[];
  losses: string[];
}

export function compareWhatIf(mission: MissionState, variant: WhatIfVariant): WhatIfComparison {
  const after = variant.apply(mission);
  const dnaDeltas = compareDna(mission, after);
  const scoresBefore = calculateMissionScores(mission);
  const scoresAfter = calculateMissionScores(after);
  const overallBefore = getOverallScore(scoresBefore);
  const overallAfter = getOverallScore(scoresAfter);

  const suitability = [
    { label: 'Overall design fit', before: overallBefore, after: overallAfter },
    { label: 'Power compatibility', before: scoresBefore.powerCompatibility, after: scoresAfter.powerCompatibility },
    { label: 'Science capability', before: scoresBefore.scientificValue, after: scoresAfter.scientificValue },
    { label: 'Communication', before: scoresBefore.communication, after: scoresAfter.communication },
    { label: 'Propulsion suitability', before: scoresBefore.propulsionSuitability, after: scoresAfter.propulsionSuitability },
  ];

  const gains: string[] = [];
  const losses: string[] = [];
  dnaDeltas.forEach(d => {
    if (d.delta === 0) return;
    const dir = d.delta > 0 ? 'increases' : 'decreases';
    const text = `${d.label} ${dir} ${Math.abs(d.delta)} points`;
    if (d.key === 'operationalRisk') {
      // For risk, an increase is a loss and a decrease is a gain.
      (d.delta > 0 ? losses : gains).push(text);
    } else {
      (d.delta > 0 ? gains : losses).push(text);
    }
    d.reasons.slice(0, 2).forEach(r => {
      const isPositive = /→ \+/.test(r) && d.delta > 0;
      const bucket = d.key === 'operationalRisk' ? (d.delta > 0 ? losses : gains) : (d.delta > 0 ? gains : losses);
      bucket.push(`· ${r}`);
      void isPositive;
    });
  });

  return { variant, dnaDeltas, suitability, outlook: { before: scenarioOutlook(mission), after: scenarioOutlook(after) }, gains, losses };
}

// ── Mission Advisor (transparent rule-based recommendations) ────────────────

export interface AdvisorInsight {
  id: string;
  severity: 'critical' | 'caution' | 'good' | 'info';
  title: string;
  detail: string;
  rule: string; // name of the transparent rule that produced this
  realMissionExample?: string;
}

export function getAdvisorInsights(mission: MissionState): AdvisorInsight[] {
  const insights: AdvisorInsight[] = [];
  if (!mission.destination) return insights;
  const dest = DESTINATIONS[mission.destination];
  const facts = DESTINATION_FACTS[mission.destination];

  // Solar power at distant destinations — cite real missions.
  if (mission.power === 'solar' && dest.distanceCategory === 'outer' && mission.destination !== 'jupiter') {
    insights.push({
      id: 'adv-solar-outer',
      severity: 'critical',
      title: `Solar panels produce ~${facts.solarIlluminationPercentOfEarth}% of Earth's sunlight at ${dest.label}`,
      detail: `Photovoltaic output follows the inverse-square law. At ${dest.label} (${facts.distanceFromSunAu} AU), panels would need to be enormous. Consider an RPS — that is why Voyager 2 and Cassini used radioisotope power.`,
      rule: 'Solar illumination rule: power drops with the square of distance from the Sun.',
      realMissionExample: 'Voyager 2 (1977) and Cassini (1997) both chose radioisotope power for the outer solar system.',
    });
  } else if (mission.power === 'solar' && mission.destination === 'jupiter') {
    insights.push({
      id: 'adv-solar-jupiter',
      severity: 'caution',
      title: 'Solar power at Jupiter is possible but demanding',
      detail: `Sunlight at Jupiter is ~${facts.solarIlluminationPercentOfEarth}% of Earth's. It works only with very large arrays and a power-frugal design.`,
      rule: 'Solar illumination rule: power drops with the square of distance from the Sun.',
      realMissionExample: 'Juno (2011) flew three school-bus-sized panels to make solar work at Jupiter.',
    });
  } else if (mission.power === 'rps' && ['near', 'inner'].includes(dest.distanceCategory) && mission.destination !== 'moon') {
    insights.push({
      id: 'adv-rps-inner',
      severity: 'info',
      title: 'An RPS works anywhere — but inner-system missions usually choose solar',
      detail: 'Solar is simpler and cheaper where sunlight is strong. RPS is typically reserved for distant or eclipse-heavy missions.',
      rule: 'Power-destination matching rule.',
      realMissionExample: 'Mars rovers like Curiosity use small RPS units; inner-system orbiters usually fly solar.',
    });
  }

  // Communication reach.
  if (mission.communication && mission.destination) {
    const c = COMMUNICATION_SYSTEMS[mission.communication];
    const suitable = c.suitableDestinations.includes(mission.destination);
    if (!suitable) {
      insights.push({
        id: 'adv-comm-range',
        severity: ['low-gain'].includes(mission.communication) ? 'critical' : 'caution',
        title: `${c.label} is beyond its design range for ${dest.label}`,
        detail: `${c.maxRange}. Beyond that, the signal becomes too weak for reliable data return — you saw this in the delay model for ${dest.label} (${dest.communicationDelay} one-way).`,
        rule: 'Antenna range rule: each system has a maximum reliable distance.',
        realMissionExample: mission.destination === 'mars'
          ? 'Mars orbiters relay through the Deep Space Network with high-gain antennas.'
          : 'Deep-space missions rely on the NASA Deep Space Network\u2019s largest dishes.',
      });
    }
  }

  // Payload overload.
  if (mission.spacecraft) {
    const sc = SPACECRAFT_TYPES[mission.spacecraft];
    const tm = totalInstrumentMass(mission);
    if (tm > sc.payloadCapacity) {
      insights.push({
        id: 'adv-payload',
        severity: 'critical',
        title: `Payload (${tm} kg) exceeds ${sc.label} capacity (${sc.payloadCapacity} kg)`,
        detail: 'Every kilogram of instrument mass must be launched, powered and pointed. Overloading forces cuts somewhere else — usually propellant or power.',
        rule: 'Mass budget rule: payload + propellant + bus must fit the launch vehicle.',
      });
    } else if (mission.instruments.length > sc.maxInstruments) {
      insights.push({
        id: 'adv-inst-count',
        severity: 'caution',
        title: `${mission.instruments.length} instruments exceed ${sc.label}\u2019s practical limit (${sc.maxInstruments})`,
        detail: 'More instruments mean more simultaneous power draws, more data to store, and more pointing conflicts.',
        rule: 'Instrument complement rule: spacecraft can only operate so many instruments at once.',
      });
    }
  }

  // Propulsion distance matching.
  if (mission.propulsion && mission.destination) {
    const t = TRAVEL_TIME_REFERENCE[mission.destination];
    if (mission.propulsion === 'chemical' && ['outer', 'deep'].includes(dest.distanceCategory)) {
      insights.push({
        id: 'adv-prop-chemical',
        severity: 'caution',
        title: 'Chemical propulsion limits deep-space reach',
        detail: `Chemical fuel burns quickly and runs out; ${t.typicalCruise} trips to ${dest.label} need efficient propulsion. Ion drives trade thrust for 10× efficiency.`,
        rule: 'Delta-v budget rule: total velocity change available must cover the journey.',
        realMissionExample: 'Dawn used ion propulsion to orbit two different asteroids — impossible on chemical fuel alone.',
      });
    }
    if (mission.propulsion === 'solar-sail' && ['outer', 'deep'].includes(dest.distanceCategory)) {
      insights.push({
        id: 'adv-sail-outer',
        severity: 'caution',
        title: 'Solar sails weaken with distance',
        detail: `Photon pressure falls off with the same inverse-square law as sunlight. At ${dest.label} (~${facts.solarIlluminationPercentOfEarth}% of Earth sunlight) a sail would barely accelerate.`,
        rule: 'Solar-pressure rule: sails need strong sunlight.',
      });
    }
    if (mission.propulsion === 'ion' && ['near', 'inner'].includes(dest.distanceCategory) && mission.destination !== 'asteroid') {
      insights.push({
        id: 'adv-ion-inner',
        severity: 'info',
        title: 'Ion propulsion needs lots of electrical power',
        detail: 'The efficiency is excellent, but ion drives are power-hungry — make sure your power system can feed the drive plus your instruments.',
        rule: 'Power-coupling rule: electric propulsion draws on the same power budget as science.',
        realMissionExample: 'Dawn\u2019s ion drive ran on three large solar arrays.',
      });
    }
  }

  // Positive feedback when things match.
  if (mission.power === 'rps' && ['saturn', 'uranus', 'neptune', 'jupiter'].includes(mission.destination)) {
    const ref = REFERENCE_MISSIONS.find(m => m.destinations.includes(mission.destination!) && m.power.includes('Radioisotope'));
    insights.push({
      id: 'adv-good-rps',
      severity: 'good',
      title: `RPS power matches ${dest.label}`,
      detail: 'Radioisotope power works at any distance and keeps producing through long eclipses — a strong choice here.',
      rule: 'Power-destination matching rule.',
      realMissionExample: ref ? `${ref.name} used ${ref.power.toLowerCase()} for ${ref.destinationLabel.toLowerCase()}.` : undefined,
    });
  }
  if (mission.spacecraft === 'rover' && mission.destination === 'mars') {
    insights.push({
      id: 'adv-good-rover',
      severity: 'good',
      title: 'A rover is a strong match for Mars surface science',
      detail: 'Mobile labs can sample multiple terrains — this is why NASA keeps sending rovers there.',
      rule: 'Spacecraft-destination matching rule.',
      realMissionExample: 'Perseverance (2020) explores Jezero Crater autonomously between commands.',
    });
  }

  // Autonomy nudge for distant destinations.
  if (dest.distanceCategory === 'outer' || dest.distanceCategory === 'deep') {
    insights.push({
      id: 'adv-autonomy',
      severity: 'info',
      title: `Signals to ${dest.label} take ${dest.communicationDelay} one-way`,
      detail: 'At this distance, ground control cannot react in real time. Your spacecraft will need autonomous behaviors during communication gaps — you will exercise these during flight.',
      rule: 'Light-time rule: one-way delay = distance ÷ 299,792 km/s.',
      realMissionExample: 'Perseverance drives itself for weeks between command uploads because of Mars\u2019 3–22 minute delay.',
    });
  }

  return insights.slice(0, 6);
}

// ── Failure Investigator ─────────────────────────────────────────────────────

export interface FailureInvestigation {
  whatHappened: string;
  whyItHappened: string;
  systemsInvolved: string[];
  alternatives: { action: string; likelyEffect: string }[];
  lesson: string;
}

const SCENARIO_CAUSE: Record<ScenarioType, {
  event: string;
  cause: string;
  systems: string[];
  alternatives: { action: string; likelyEffect: string }[];
  lesson: string;
}> = {
  'power-challenge': {
    event: 'Power generation fell below the level needed to run all active systems simultaneously.',
    cause: 'The combination of destination conditions and the chosen power system could not cover the total instrument demand.',
    systems: ['Power system', 'Scientific instruments', 'Battery/energy storage'],
    alternatives: [
      { action: 'Duty-cycle instruments (run some only during key windows)', likelyEffect: 'Lower average power draw; science spread over more time.' },
      { action: 'Choose a power system matched to the destination\u2019s sunlight', likelyEffect: 'Higher generation margin throughout the mission.' },
      { action: 'Carry fewer instruments', likelyEffect: 'Smaller power draw and lower complexity, at the cost of scientific breadth.' },
    ],
    lesson: 'Mission planners must balance science operations against available spacecraft resources — a power budget is a science budget.',
  },
  'comm-interrupted': {
    event: 'The communication link with Earth was interrupted during a critical phase.',
    cause: 'Antenna capability was marginal for the distance, and spacecraft pointing or occlusion broke an already-thin link.',
    systems: ['Communication system', 'Attitude control', 'Onboard data storage'],
    alternatives: [
      { action: 'Carry a higher-capability antenna', likelyEffect: 'More link margin, but more mass and power.' },
      { action: 'Pre-plan autonomous science for blackout periods', likelyEffect: 'Data keeps accumulating while out of contact.' },
      { action: 'Increase onboard storage', likelyEffect: 'Data survives interruptions; playback takes longer.' },
    ],
    lesson: 'Communication is a resource like power: distant missions must plan for blackouts and design autonomy around them.',
  },
  'instrument-failure': {
    event: 'One scientific instrument stopped responding during operations.',
    cause: 'Instrument complexity and environmental stress exceeded what the design margin could absorb.',
    systems: ['Affected instrument', 'Instrument power/driver electronics'],
    alternatives: [
      { action: 'Add redundancy to critical instruments', likelyEffect: 'Survives single failures, at higher mass and cost.' },
      { action: 'Reduce instrument count', likelyEffect: 'More margin per instrument; less science breadth.' },
      { action: 'Cross-calibrate with remaining instruments', likelyEffect: 'Partial recovery of the lost measurement type.' },
    ],
    lesson: 'Redundancy, margin and graceful degradation are how real missions keep doing science after failures.',
  },
  'navigation-challenge': {
    event: 'The spacecraft deviated from its planned trajectory and needed correction maneuvers.',
    cause: 'The propulsion system\u2019s authority was limited relative to the navigation demands of this destination.',
    systems: ['Propulsion system', 'Navigation', 'Propellant supply'],
    alternatives: [
      { action: 'Match propulsion to destination distance', likelyEffect: 'More delta-v margin for corrections.' },
      { action: 'Plan more frequent small corrections', likelyEffect: 'Uses propellant steadily; keeps trajectory tight.' },
    ],
    lesson: 'Propellant is a finite resource; navigation accuracy and propulsion capability must be designed together.',
  },
  'radiation-challenge': {
    event: 'Elevated radiation degraded electronics during the encounter.',
    cause: 'The destination\u2019s radiation environment was harsher than the shielding and orbit design assumed.',
    systems: ['Avionics', 'Scientific instruments', 'Radiation shielding'],
    alternatives: [
      { action: 'Shield critical electronics', likelyEffect: 'Survival in belts, at a mass cost (Europa Clipper carries a titanium vault).' },
      { action: 'Design a radiation-friendly orbit', likelyEffect: 'Fewer belt crossings; fewer high-dose windows.' },
      { action: 'Choose rad-hardened parts', likelyEffect: 'Slower but tougher electronics.' },
    ],
    lesson: 'Environment is a design input: missions to Jupiter must budget for radiation the way others budget for power.',
  },
  'propulsion-problem': {
    event: 'The propulsion system underperformed during critical maneuvers.',
    cause: 'The propulsion technology was pushed beyond its efficient envelope for this mission profile.',
    systems: ['Propulsion system', 'Propellant supply', 'Thermal control'],
    alternatives: [
      { action: 'Choose a propulsion type suited to the journey length', likelyEffect: 'Operations stay inside the efficient envelope.' },
      { action: 'Reserve propellant margin', likelyEffect: 'Absorbs anomalies without ending the mission.' },
    ],
    lesson: 'Every propulsion technology has an envelope where it shines; missions fail when designs lean on the edges of that envelope.',
  },
  'partial-success': {
    event: 'Operational constraints forced the mission to reprioritize objectives.',
    cause: 'Several subsystems ran close to their limits at once, leaving no margin for the original plan.',
    systems: ['Multiple subsystems'],
    alternatives: [
      { action: 'Increase margins in the tightest subsystem', likelyEffect: 'Room to absorb surprises without dropping objectives.' },
      { action: 'Phase science over a longer period', likelyEffect: 'Lower peak demand; slower return.' },
    ],
    lesson: 'Margins are the quiet hero of mission design — systems sized exactly to the plan leave nothing for reality.',
  },
  'mission-failure': {
    event: 'Multiple systems degraded past the point where mission objectives were achievable.',
    cause: 'Several design mismatches compounded: the mission lacked margin in more than one critical subsystem.',
    systems: ['Power system', 'Propulsion system', 'Communication system', 'Instruments'],
    alternatives: [
      { action: 'Re-balance the design around the destination\u2019s environment', likelyEffect: 'Each subsystem sized for real conditions instead of best case.' },
      { action: 'Reduce scope (fewer instruments, nearer destination)', likelyEffect: 'A smaller mission that actually arrives beats a grand one that does not.' },
    ],
    lesson: 'Mission design is a system problem: fixing one subsystem is not enough when the mismatches interact.',
  },
  'smooth': {
    event: 'No mission-ending failure occurred — the design held up.',
    cause: 'Subsystem capabilities matched destination conditions with adequate margin.',
    systems: [],
    alternatives: [],
    lesson: 'When capability matches environment with margin, missions succeed. That matching is the core of mission design.',
  },
  'science-breakthrough': {
    event: 'No failure occurred — instruments returned an unexpected high-value observation.',
    cause: 'A well-matched instrument suite operating in a rich environment.',
    systems: [],
    alternatives: [],
    lesson: 'Preparedness meets opportunity: capable instruments in the right environment occasionally rewrite textbooks.',
  },
};

export function buildFailureInvestigation(
  mission: MissionState,
  scenario: ScenarioType
): FailureInvestigation {
  const base = SCENARIO_CAUSE[scenario];
  const destLabel = mission.destination ? DESTINATIONS[mission.destination].label : 'the destination';
  const psys = mission.power ? POWER_SYSTEMS[mission.power].label : 'the power system';
  const draw = totalInstrumentPower(mission);

  // Make the cause config-aware rather than generic.
  let cause = base.cause;
  if (scenario === 'power-challenge') {
    const parts: string[] = [];
    if (mission.power === 'solar' && DESTINATION_FACTS[mission.destination!]?.solarIlluminationPercentOfEarth < 15) {
      parts.push(`${psys} receive only ~${DESTINATION_FACTS[mission.destination!].solarIlluminationPercentOfEarth}% of Earth's sunlight at ${destLabel}`);
    }
    if (draw > 45) parts.push(`the instrument suite draws ${draw} W`);
    if (parts.length > 0) cause = `High demand met limited supply: ${listJoin(parts)}.`;
  }
  if (scenario === 'comm-interrupted' && mission.communication) {
    cause = `${COMMUNICATION_SYSTEMS[mission.communication].label} ${COMMUNICATION_SYSTEMS[mission.communication].suitableDestinations.includes(mission.destination!) ? 'had thin margin' : 'is stretched beyond its range'} for ${destLabel} (${DESTINATIONS[mission.destination!].communicationDelay} one-way).`;
  }

  return {
    whatHappened: base.event,
    whyItHappened: cause,
    systemsInvolved: base.systems,
    alternatives: base.alternatives,
    lesson: base.lesson,
  };
}

// ── Educational copy for designer stages ─────────────────────────────────────

export interface OptionEducation {
  whatItDoes: string;
  whyItMatters: string;
  tradeOff: string;
}

export const POWER_EDUCATION: Record<Power, OptionEducation> = {
  solar: {
    whatItDoes: 'Converts sunlight directly into electricity with photovoltaic panels.',
    whyItMatters: 'Solar output depends on distance from the Sun: at 5.2 AU (Jupiter) sunlight is only ~3.7% of Earth\u2019s; at 30 AU (Neptune) about 0.11%.',
    tradeOff: 'Clean and well-proven near the Sun, but the same panels that power a Mars orbiter would be nearly useless at Saturn.',
  },
  rps: {
    whatItDoes: 'Converts heat from decaying plutonium-238 into electricity — sunlight not required.',
    whyItMatters: 'Output barely changes with distance or illumination, which is why every outer-planet mission so far has used one.',
    tradeOff: 'Reliable anywhere, but limited total wattage, special handling, and a finite fuel life (decades, not forever).',
  },
  hybrid: {
    whatItDoes: 'Combines solar panels with batteries (or a small RPS) so the spacecraft can ride through eclipses and nights.',
    whyItMatters: 'Destinations like the Moon have 14-day nights; hybrids keep heaters and communication alive through them.',
    tradeOff: 'You carry two power chains: more mass, more cost, more failure points — but far fewer dark surprises.',
  },
};

export const PROPULSION_EDUCATION: Record<Propulsion, OptionEducation> = {
  chemical: {
    whatItDoes: 'Burns propellant for strong, short burns — launch, big maneuvers, orbit insertion.',
    whyItMatters: 'High thrust is the only way to slow down quickly at a destination (orbital insertion).',
    tradeOff: 'Fuel-hungry: chemical missions must reach their destination before the tank runs dry. Deep space favors efficiency over thrust.',
  },
  ion: {
    whatItDoes: 'Accelerates xenon ions with electricity for tiny but extremely efficient thrust, running for months.',
    whyItMatters: 'Roughly ten times the fuel efficiency of chemical engines — this is how one spacecraft (Dawn) orbited two different asteroids.',
    tradeOff: 'Needs substantial electrical power and patience: acceleration is gentle, so trips are planned years in advance.',
  },
  electric: {
    whatItDoes: 'A broader family of electric thrusters (hall-effect, electrothermal) with flexible thrust levels.',
    whyItMatters: 'Balances efficiency with more maneuver authority than pure ion — good for station-keeping and transfers.',
    tradeOff: 'Performance depends on available power; a weak power system throttles the drive exactly when you need it.',
  },
  'solar-sail': {
    whatItDoes: 'Pushes against sunlight itself: photons reflecting off a large mirror-film sail.',
    whyItMatters: 'No propellant at all — acceleration never runs out as long as the Sun shines.',
    tradeOff: 'Force is tiny and fades with the inverse-square law; sails shine in the inner solar system and struggle beyond Jupiter.',
  },
};

export const COMMUNICATION_EDUCATION: Record<Communication, OptionEducation> = {
  'low-gain': {
    whatItDoes: 'An omnidirectional antenna that sends a weak signal in every direction.',
    whyItMatters: 'It works regardless of spacecraft pointing — a dependable emergency link.',
    tradeOff: 'Bandwidth is tiny: fine for health data near Earth, hopeless for streaming science from Mars or beyond.',
  },
  'high-gain': {
    whatItDoes: 'A directional dish concentrates the signal into a tight beam pointed at Earth.',
    whyItMatters: 'Focusing multiplies effective power — this is how missions return megabits per second across interplanetary space.',
    tradeOff: 'The dish must point precisely at Earth, competing with instruments for spacecraft pointing time.',
  },
  'deep-space': {
    whatItDoes: 'A high-power, redundant transceiver system designed around NASA\u2019s Deep Space Network.',
    whyItMatters: 'Reliable contact across billions of kilometers, with redundant paths for critical commands.',
    tradeOff: 'Heavy and power-hungry; even it cannot beat the speed of light — delay is set by distance alone.',
  },
};

export const SPACECRAFT_EDUCATION: Record<SpacecraftType, OptionEducation> = {
  orbiter: {
    whatItDoes: 'Inserts into orbit and studies the destination repeatedly from above.',
    whyItMatters: 'Repeat passes map whole worlds, watch changes over time, and relay for surface assets.',
    tradeOff: 'Orbit insertion costs large amounts of propellant; distance from the surface limits fine detail.',
  },
  lander: {
    whatItDoes: 'Descends to the surface and studies one site in place.',
    whyItMatters: 'Surface contact enables seismology, drilling, and lab-grade chemistry no orbiter can do.',
    tradeOff: 'Fixed location: one site must represent a whole world. Landing hardware eats mass and risk budget.',
  },
  rover: {
    whatItDoes: 'A mobile laboratory that drives between sites on the surface.',
    whyItMatters: 'Mobility turns one landing into a survey — rovers follow the science when it surprises them.',
    tradeOff: 'Slow, and every kilometer adds operational complexity; needs autonomy when Earth is too far to drive it live.',
  },
  flyby: {
    whatItDoes: 'Sweeps past the target at high speed, observing during closest approach.',
    whyItMatters: 'Cheapest way to reach distant targets — every outer planet\u2019s first close-up came from a flyby.',
    tradeOff: 'One pass, no second chances: instruments get hours, not years, and data volume is limited.',
  },
  telescope: {
    whatItDoes: 'Observes distant cosmic objects from a quiet vantage point in space.',
    whyItMatters: 'Above the atmosphere, telescopes see wavelengths and detail ground instruments never can.',
    tradeOff: 'Blind to everything nearby: superb at the universe, useless for close-up planetary survey work.',
  },
  cubesat: {
    whatItDoes: 'A standardized small satellite — cheap, fast to build, increasingly capable.',
    whyItMatters: 'Democratizes access to space and can fly as a scout or relay alongside bigger missions.',
    tradeOff: 'Tiny power, storage and antenna budgets: usually one instrument, one job.',
  },
};

export const INSTRUMENT_EDUCATION: Record<Instrument, OptionEducation> = {
  camera: {
    whatItDoes: 'Captures high-resolution images of surfaces, clouds, and phenomena.',
    whyItMatters: 'Imaging is how most discoveries start: geology, weather, and unexpected features are seen first, then explained.',
    tradeOff: 'Generates enormous data volumes that must fit through your communication link.',
  },
  spectrometer: {
    whatItDoes: 'Splits light (or particles) into spectra to identify chemical composition.',
    whyItMatters: 'Composition answers "what is it made of?" — minerals, ices, organics, atmospheric gases.',
    tradeOff: 'Needs light or particles to work with: a spectrometer sees composition, not structure.',
  },
  radar: {
    whatItDoes: 'Bounces radio waves off or through surfaces to map structure hidden below.',
    whyItMatters: 'Radar found ice deposits in Mercury\u2019s polar craters and is central to Europa\u2019s subsurface ocean search.',
    tradeOff: 'Power-hungry and heavy — often the largest single power draw in a suite.',
  },
  magnetometer: {
    whatItDoes: 'Measures magnetic field strength and direction along the trajectory.',
    whyItMatters: 'Magnetic fields reveal planetary interiors, oceans under ice, and how solar wind interacts with worlds.',
    tradeOff: 'Must sit far from the spacecraft\u2019s own magnetic noise — usually on a boom, which adds mechanical complexity.',
  },
  thermal: {
    whatItDoes: 'Measures infrared heat radiation to map temperature patterns.',
    whyItMatters: 'Thermal maps expose volcanic hotspots, ice stability, and how surfaces store heat.',
    tradeOff: 'Instruments themselves must be kept very cold, which consumes cooling power.',
  },
  atmospheric: {
    whatItDoes: 'Profiles pressure, temperature, composition and winds of atmospheres.',
    whyItMatters: 'Atmospheres drive weather, climate and habitability — and complicate landings.',
    tradeOff: 'Most valuable for worlds with atmospheres; of limited use at airless targets.',
  },
  radiation: {
    whatItDoes: 'Counts and characterizes energetic particles in the environment.',
    whyItMatters: 'Radiation data protects both electronics and future astronauts, and maps magnetospheres.',
    tradeOff: 'The detector studies the very environment that threatens it — heavy shielding competes with sensitivity.',
  },
  seismometer: {
    whatItDoes: 'Listens for ground motion from quakes and impacts.',
    whyItMatters: 'Seismic waves are X-rays for planets: InSight used them to measure Mars\u2019 core and crust.',
    tradeOff: 'Requires direct surface contact and quiet conditions — useless from orbit.',
  },
  particle: {
    whatItDoes: 'Identifies charged and neutral particles: plasma, solar wind, dust impacts.',
    whyItMatters: 'Particle detectors revealed the solar wind and mapped Jupiter\u2019s lethal plasma environment.',
    tradeOff: 'Measurements are point-in-time along the flight path — building a picture requires patience.',
  },
};

export function getDesignSummary(mission: MissionState) {
  const scores = calculateMissionScores(mission);
  const overall = getOverallScore(scores);
  const outlook = scenarioOutlook(mission);
  return { scores, overall, outlook };
}
