/**
 * missionDNA.ts — Mission DNA system
 *
 * A transparent, educational model that summarizes the user's mission
 * configuration across six dimensions. Every dimension is derived from
 * explainable rules (see RULES below) — nothing is an arbitrary point award.
 *
 * IMPORTANT: This is an educational model, not a professional engineering
 * calculation. Every value must be traceable to a rule the UI can show.
 */

import type { MissionState, AnalysisScores } from './missionData';
import {
  INSTRUMENTS,
  POWER_SYSTEMS,
  PROPULSION_SYSTEMS,
  COMMUNICATION_SYSTEMS,
  DESTINATIONS,
  SPACECRAFT_TYPES,
} from './missionData';
import { DESTINATION_FACTS } from './spaceData';

export interface DNADimension {
  key: string;
  label: string;
  /** 0–100 */
  value: number;
  /** One short line: why is this value what it is. */
  explanation: string;
  /** What raising/lowering it would do. */
  hint: string;
}

export interface MissionDNA {
  dimensions: DNADimension[];
  /** Short advisor lines derived from the rules (no AI, no NASA claim). */
  advisorNotes: string[];
}

// ── Transparent rules ────────────────────────────────────────────────────────

export const DNA_RULES: Record<
  string,
  { label: string; meaning: string; rule: string }
> = {
  scientificValue: {
    label: 'Scientific Value',
    meaning: 'How much high-quality data this configuration could produce.',
    rule: 'Each instrument adds measurable capability (specialized instruments count more). A narrow one-instrument mission scores lower; a focused 3–4 instrument suite scores well; over-stuffing instruments raises complexity without raising capability much.',
  },
  powerEfficiency: {
    label: 'Power Efficiency',
    meaning: 'How well the chosen power system matches the destination and the instruments’ demand.',
    rule: 'Base = destination suitability (real distance-from-Sun logic: solar weakens with distance). Subtract demand pressure when instrument power draw is high relative to the system’s output class.',
  },
  communication: {
    label: 'Communication Reliability',
    meaning: 'How reliably the spacecraft can send commands and return data.',
    rule: 'Base = antenna class vs destination distance (real light-time context). Low-gain antennas cannot serve inner-system targets; high-gain weakens at outer planets; deep-space systems stay strong but cost mass/power.',
  },
  complexity: {
    label: 'Mission Complexity',
    meaning: 'How many things can go wrong. Not a “bad” number — ambitious missions have high complexity by definition.',
    rule: 'More instruments, farther destinations, and multi-mode spacecraft (rover/lander) all add complexity. Complexity is neutral: it flags what could challenge the mission.',
  },
  scienceReturn: {
    label: 'Science Return',
    meaning: 'How much of the collected science actually gets home.',
    rule: 'Depends on instrument coverage, data-rate class of the communication system, and destination distance. A great instrument suite with a weak antenna returns less of its science.',
  },
  risk: {
    label: 'Operational Risk',
    meaning: 'Likelihood the mission meets trouble in flight.',
    rule: 'Drives from hard mismatch penalties: wrong spacecraft for destination, unsuitable power, unsuitable propulsion, weak comms, plus destination hazards (radiation belts, dust, atmosphere).',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const OUTER = ['jupiter', 'saturn', 'uranus', 'neptune'];

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Instrument "specialization" weight for scientific value — transparent table. */
const INSTRUMENT_SCIENCE_WEIGHT: Record<string, number> = {
  camera: 8,
  spectrometer: 12,
  radar: 10,
  magnetometer: 9,
  thermal: 9,
  atmospheric: 10,
  radiation: 8,
  seismometer: 11,
  particle: 8,
};

// ── Core computation ─────────────────────────────────────────────────────────

export function computeMissionDNA(mission: MissionState, scores?: AnalysisScores): MissionDNA {
  const {
    objective, destination, spacecraft, instruments, propulsion, power, communication,
  } = mission;

  const dest = destination ? DESTINATIONS[destination] : null;
  const sc = spacecraft ? SPACECRAFT_TYPES[spacecraft] : null;
  const facts = destination ? DESTINATION_FACTS[destination] : null;

  // ── Scientific Value ──
  let sciVal = 0;
  let sciValExpl = 'Select instruments to give your mission scientific capability.';
  if (instruments.length > 0) {
    const specialized = instruments.reduce(
      (sum, i) => sum + (INSTRUMENT_SCIENCE_WEIGHT[i] ?? 8), 0
    );
    const count = instruments.length;
    // Diminishing returns beyond 5 instruments — focus beats stuffing.
    const diminishing = count <= 5 ? 1 : Math.max(0.55, 1 - (count - 5) * 0.09);
    sciVal = Math.min(specialized * 1.15 * diminishing, 96);
    sciValExpl = `${count} instrument${count > 1 ? 's' : ''} (specialization sum ${specialized}) with diminishing returns above five instruments.`;
    if (count > 5) {
      sciValExpl += ' You have more than five — capability is no longer growing proportionally.';
    }
  }
  if (objective === 'search-for-life' && instruments.includes('spectrometer')) {
    sciVal = Math.min(sciVal + 4, 98);
    sciValExpl += ' A spectrometer directly serves a life-detection objective.';
  }

  // ── Power Efficiency ──
  let powerEff = 50;
  let powerExpl = 'Choose a destination and a power system to see the power rule apply.';
  if (power && destination) {
    const base = dest!.powerSuitability[power];
    const totalDraw = instruments.reduce((s, i) => s + INSTRUMENTS[i].power, 0);
    const demand = totalDraw > 60 ? Math.min((totalDraw - 60) / 2, 25) : 0;
    powerEff = clamp100(base - demand);
    powerExpl = `Destination suitability ${base}%`;
    if (demand > 0) {
      powerExpl += `, minus ${Math.round(demand)}% pressure from ${totalDraw} W of instrument demand`;
    } else {
      powerExpl += ' with comfortable headroom for your instrument power draw';
    }
    if (facts && power === 'solar' && facts.solarIrradianceWm2 !== null && facts.solarIrradianceWm2 < 200) {
      powerExpl += ` (sunlight at ${dest!.label} is only ≈ ${Math.round((facts.solarIrradianceWm2 / 1361) * 100)}% of Earth’s)`;
    }
  }

  // ── Communication Reliability ──
  let comm = 50;
  let commExpl = 'Choose a communication system to apply the antenna-range rule.';
  if (communication && destination) {
    const distCat = dest!.distanceCategory;
    const table: Record<string, Record<string, number>> = {
      'low-gain': { near: 90, inner: 30, outer: 6, deep: 2 },
      'high-gain': { near: 95, inner: 90, outer: 55, deep: 25 },
      'deep-space': { near: 85, inner: 95, outer: 95, deep: 95 },
    };
    comm = table[communication][distCat] ?? 50;
    commExpl = `${COMMUNICATION_SYSTEMS[communication].label} vs a ${distCat}-distance target`;
    if (communication === 'low-gain' && distCat !== 'near') {
      commExpl += ' — an omnidirectional antenna loses signal strength with the square of distance.';
    }
    if (communication === 'high-gain' && ['outer', 'deep'].includes(distCat)) {
      commExpl += ' — pointing precision and signal strength become the limiting factor.';
    }
    if (communication === 'deep-space') {
      commExpl += ' — redundant DSN-class systems hold up at any distance.';
    }
  }

  // ── Mission Complexity ──
  let complexity = 0;
  let complexityExpl = 'Complexity builds as you add instruments, distance, and multi-mode operations.';
  if (destination) {
    const distScore = { near: 20, inner: 40, outer: 70, deep: 90 }[dest!.distanceCategory] ?? 50;
    complexity = distScore;
    complexityExpl = `${dest!.label} is a ${dest!.distanceCategory}-distance destination (base ${distScore})`;
    if (instruments.length) {
      complexity += instruments.length * 6;
      complexityExpl += ` + ${instruments.length * 6} for ${instruments.length} instruments`;
    }
    if (spacecraft === 'rover' || spacecraft === 'lander') {
      complexity += 12;
      complexityExpl += ' + 12 for surface operations';
    }
    if (propulsion === 'ion') {
      complexity += 4;
      complexityExpl += ' + 4 for low-thrust trajectory management';
    }
    complexity = clamp100(complexity);
  }

  // ── Science Return ──
  let sciReturn = 0;
  let sciReturnExpl = 'Science return needs instruments, a communication system, and a destination.';
  if (instruments.length && communication && destination) {
    const dataRateFactor = { 'low-gain': 0.35, 'high-gain': 0.8, 'deep-space': 1 }[communication];
    const distPenalty = { near: 0, inner: 8, outer: 18, deep: 28 }[dest!.distanceCategory] ?? 10;
    const raw = clamp100(sciVal * dataRateFactor - distPenalty);
    sciReturn = raw;
    sciReturnExpl =
      `${Math.round(dataRateFactor * 100)}% of instrument capability converts to returned data at ${communication.replace('-', ' ')} data rates, minus a ${distPenalty}-point distance penalty for ${dest!.label}.`;
    if (communication === 'low-gain') {
      sciReturnExpl += ' Most raw instrument data cannot fit through a low-gain downlink.';
    }
  }

  // ── Operational Risk ──
  let risk = 8;
  const riskFactors: string[] = [];
  if (spacecraft && destination) {
    const suitable = sc!.suitableDestinations.includes(destination);
    if (!suitable) {
      risk += 28;
      riskFactors.push(`${sc!.label} is not designed for ${dest!.label} (+28)`);
    } else if (dest!.distanceCategory === 'outer' || dest!.distanceCategory === 'deep') {
      risk += 6;
      riskFactors.push(`long-duration cruise to ${dest!.label} (+6)`);
    }
  }
  if (power && destination && dest!.powerSuitability[power] < 45) {
    risk += 24;
    riskFactors.push(`${POWER_SYSTEMS[power].label} is poorly suited to ${dest!.label} (+24)`);
  }
  if (propulsion && destination) {
    const distCat = dest!.distanceCategory;
    const propTable: Record<string, Record<string, number>> = {
      chemical: { near: 4, inner: 8, outer: 22, deep: 34 },
      ion: { near: 16, inner: 8, outer: 4, deep: 6 },
      electric: { near: 10, inner: 8, outer: 12, deep: 14 },
      'solar-sail': { near: 4, inner: 12, outer: 34, deep: 42 },
    };
    const pen = (propTable[propulsion] as Record<string, number>)[distCat] ?? 10;
    if (pen >= 22) {
      risk += pen;
      riskFactors.push(`${PROPULSION_SYSTEMS[propulsion].label} struggles to reach ${dest!.label} (+${pen})`);
    } else {
      risk += Math.round(pen / 3);
      riskFactors.push(`${PROPULSION_SYSTEMS[propulsion].label} adds small inherent risk (+${Math.round(pen / 3)})`);
    }
  }
  if (communication && destination) {
    const distCat = dest!.distanceCategory;
    if (communication === 'low-gain' && distCat !== 'near') {
      risk += 18;
      riskFactors.push('low-gain antenna cannot serve this range (+18)');
    }
    if (communication === 'high-gain' && ['outer', 'deep'].includes(distCat)) {
      risk += 12;
      riskFactors.push('high-gain link is marginal at this range (+12)');
    }
  }
  if (destination && ['jupiter', 'saturn'].includes(destination)) {
    risk += 10;
    riskFactors.push('intense radiation environment (+10)');
  }
  if (destination === 'mars' && power === 'solar') {
    risk += 8;
    riskFactors.push('dust storms can block solar panels (+8)');
  }
  if (destination === 'venus' && spacecraft === 'lander') {
    risk += 16;
    riskFactors.push('Venus surface pressure/heat defeats most landers (+16)');
  }
  const riskExpl = riskFactors.length
    ? `Risk = 8 base + ${riskFactors.join(', ')}.`
    : 'No major configuration mismatches detected — baseline operational risk only.';
  risk = clamp100(risk);

  const dimensions: DNADimension[] = [
    { key: 'scientificValue', label: DNA_RULES.scientificValue.label, value: clamp100(sciVal), explanation: sciValExpl, hint: 'Add or specialize instruments to raise this.' },
    { key: 'powerEfficiency', label: DNA_RULES.powerEfficiency.label, value: powerEff, explanation: powerExpl, hint: 'Match the power system to the destination’s real sunlight level.' },
    { key: 'communication', label: DNA_RULES.communication.label, value: comm, explanation: commExpl, hint: 'Antenna range must cover the light-time to your destination.' },
    { key: 'complexity', label: DNA_RULES.complexity.label, value: complexity, explanation: complexityExpl, hint: 'Complexity is not bad — it flags how much can challenge the mission.' },
    { key: 'scienceReturn', label: DNA_RULES.scienceReturn.label, value: clamp100(sciReturn), explanation: sciReturnExpl, hint: 'A stronger antenna converts more instrument capability into delivered data.' },
    { key: 'risk', label: DNA_RULES.risk.label, value: risk, explanation: riskExpl, hint: 'Fix hard mismatches (spacecraft/power/propulsion vs destination) to lower risk.' },
  ];

  // ── Advisor notes (transparent rules, not AI, not NASA) ──
  const advisorNotes: string[] = [];
  if (mission.power && mission.destination && dest!.powerSuitability[mission.power] < 45) {
    advisorNotes.push(
      `Your mission has high power risk: ${POWER_SYSTEMS[mission.power].label} is poorly suited to ${dest!.label}. ` +
      (mission.power === 'solar'
        ? 'Solar output falls with the square of distance from the Sun.'
        : 'Consider a system matched to this destination’s conditions.')
    );
  }
  if (mission.communication === 'low-gain' && dest && dest.distanceCategory !== 'near') {
    advisorNotes.push('Your communication choice limits science return: a low-gain antenna cannot push meaningful science data beyond near-Earth ranges.');
  }
  if (instruments.length >= 6) {
    advisorNotes.push(`Your mission currently has high scientific potential but increased power and mass complexity because ${instruments.length} instruments are active.`);
  }
  if (spacecraft && destination && !sc!.suitableDestinations.includes(destination)) {
    advisorNotes.push(`${sc!.label} is not designed to operate at ${dest!.label} — consider a different spacecraft or destination pairing.`);
  }
  if (propulsion === 'chemical' && dest && ['outer', 'deep'].includes(dest.distanceCategory)) {
    advisorNotes.push('Chemical propulsion runs out of delta-v for outer-planet transfers — real missions use gravity assists or electric propulsion for these distances.');
  }
  if (advisorNotes.length === 0 && instruments.length > 0 && destination && power && communication && propulsion) {
    advisorNotes.push('Your configuration is internally consistent — every system matches your destination’s real conditions. Trade-offs remain between capability and complexity.');
  }

  return { dimensions, advisorNotes };
}

// ── What-If comparison helpers ───────────────────────────────────────────────

export interface DNAComparison {
  key: string;
  label: string;
  current: number;
  alternative: number;
  delta: number;
}

export function compareDNA(a: MissionDNA, b: MissionDNA): DNAComparison[] {
  return a.dimensions.map((dim) => {
    const alt = b.dimensions.find(d => d.key === dim.key);
    return {
      key: dim.key,
      label: dim.label,
      current: dim.value,
      alternative: alt?.value ?? 0,
      delta: (alt?.value ?? 0) - dim.value,
    };
  });
}
