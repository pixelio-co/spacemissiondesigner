/**
 * SCIENCE ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Makes instrument choices genuinely matter. Discoveries are only generated
 * for observation types the selected instruments can actually detect, and
 * only in environments where those phenomena exist. Nothing is guaranteed:
 * eligibility is necessary but not sufficient — that is the point being
 * taught. Deterministic seeded rolls provide variation without chaos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { MissionState, Instrument, Destination } from './missionData';
import { INSTRUMENTS, DESTINATIONS } from './missionData';
import type { InstrumentFamily } from './missionRules';
import { INSTRUMENT_FAMILY } from './missionRules';
import type { SeededRandom } from './simulationEngine';

// ── Eligibility rules ────────────────────────────────────────────────────────

export interface DiscoveryType {
  id: string;
  label: string;                       // "Material composition analysis"
  family: InstrumentFamily;            // instrument family that can detect it
  /** Destinations where this phenomenon plausibly exists. */
  destinations: Destination[];
  /** Spacecraft that can perform it (None = any). */
  requiredSpacecraft?: ('orbiter' | 'lander' | 'rover' | 'flyby' | 'telescope' | 'cubesat')[];
  example: string;                     // real-mission example for education
}

export const DISCOVERY_TYPES: DiscoveryType[] = [
  {
    id: 'surface-imaging', label: 'Surface feature imaging', family: 'imaging',
    destinations: ['moon', 'mercury', 'venus', 'mars', 'asteroid', 'jupiter', 'saturn', 'uranus', 'neptune', 'earth-orbit'],
    example: 'Mars Reconnaissance Orbiter\u2019s HiRISE images resolve features smaller than a kitchen table.',
  },
  {
    id: 'atmospheric-imaging', label: 'Atmospheric storm & cloud imaging', family: 'imaging',
    destinations: ['venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'earth-orbit'],
    example: 'Juno\u2019s camera revealed cyclone clusters geometry-packed at Jupiter\u2019s poles.',
  },
  {
    id: 'mineral-composition', label: 'Mineral composition mapping', family: 'composition',
    destinations: ['moon', 'mercury', 'mars', 'asteroid', 'earth-orbit'],
    example: 'Mars mineral maps from CRISM revealed clay-rich ancient terrain where water once altered rock.',
  },
  {
    id: 'ice-composition', label: 'Ice & volatile detection', family: 'composition',
    destinations: ['moon', 'mercury', 'mars', 'asteroid', 'jupiter', 'saturn', 'uranus', 'neptune'],
    example: 'OSIRIS-REx confirmed hydrated minerals on Bennu before collecting its sample.',
  },
  {
    id: 'organic-screening', label: 'Organic molecule screening', family: 'composition',
    destinations: ['mars', 'asteroid', 'jupiter', 'saturn'],
    example: 'Perseverance\u2019s SHERLOC found diverse organic molecules in Jezero Crater rocks.',
  },
  {
    id: 'subsurface-layering', label: 'Subsurface layer mapping', family: 'subsurface',
    destinations: ['moon', 'mars', 'jupiter', 'asteroid'],
    example: 'MARSIS radar on Mars Express probed km-deep polar layered ice.',
  },
  {
    id: 'polar-ice', label: 'Polar ice deposit detection', family: 'subsurface',
    destinations: ['moon', 'mercury', 'mars'],
    example: 'Radar and neutron data show water ice inside permanently shadowed lunar craters.',
  },
  {
    id: 'magnetic-field-map', label: 'Magnetic field mapping', family: 'fields',
    destinations: ['mercury', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon', 'mars', 'earth-orbit'],
    example: 'MESSENGER proved Mercury still generates its own magnetic field.',
  },
  {
    id: 'ocean-induction', label: 'Subsurface ocean signature', family: 'fields',
    destinations: ['jupiter', 'saturn'],
    example: 'Galileo\u2019s magnetometer detected the induction signature of Europa\u2019s salty ocean.',
  },
  {
    id: 'thermal-hotspot', label: 'Thermal hotspot detection', family: 'thermal',
    destinations: ['moon', 'mars', 'jupiter', 'saturn', 'asteroid', 'venus'],
    example: 'Jupiter\u2019s moon Io is dotted with volcanic hotspots first mapped in infrared.',
  },
  {
    id: 'thermal-inertia', label: 'Surface thermal inertia mapping', family: 'thermal',
    destinations: ['moon', 'mercury', 'mars', 'asteroid'],
    example: 'Thermal inertia told Dawn\u2019s team where Ceres\u2019 surface was dusty versus rocky.',
  },
  {
    id: 'atmospheric-profile', label: 'Atmospheric structure profiling', family: 'environment',
    destinations: ['venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'earth-orbit'],
    example: 'InSight even used its weather sensor set to detect passing dust devils.',
  },
  {
    id: 'radiation-map', label: 'Radiation environment mapping', family: 'environment',
    destinations: ['earth-orbit', 'moon', 'mars', 'jupiter', 'saturn', 'asteroid', 'mercury', 'uranus', 'neptune'],
    example: 'Juno\u2019s particle instruments measured doses that shaped future Jupiter mission designs.',
  },
  {
    id: 'plasma-flows', label: 'Plasma & solar-wind flows', family: 'environment',
    destinations: ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'earth-orbit'],
    example: 'Voyager crossed the "heliospheric boundary" using particle instruments.',
  },
  {
    id: 'seismic-events', label: 'Seismic event detection', family: 'in-situ',
    destinations: ['moon', 'mars', 'venus'],
    requiredSpacecraft: ['lander', 'rover'],
    example: 'InSight recorded 1,300+ marsquakes and sized Mars\u2019 core.',
  },
  {
    id: 'regolith-mechanics', label: 'Regolith & surface mechanics', family: 'in-situ',
    destinations: ['moon', 'mars', 'asteroid'],
    requiredSpacecraft: ['lander', 'rover'],
    example: 'The Mars "mole" taught engineers how stubborn some regolith can be.',
  },
];

export interface DiscoveryEligibility {
  type: DiscoveryType;
  eligible: boolean;
  reason: string;
  /** Instruments that make this observation possible. */
  enablingInstruments: Instrument[];
}

export function evaluateDiscoveries(mission: MissionState): DiscoveryEligibility[] {
  const dest = mission.destination;
  if (!dest) return [];
  return DISCOVERY_TYPES.map(type => {
    const enabling = mission.instruments.filter(i => INSTRUMENT_FAMILY[i] === type.family);
    const envOk = type.destinations.includes(dest);
    const craftOk = !type.requiredSpacecraft || !mission.spacecraft || type.requiredSpacecraft.includes(mission.spacecraft);
    const eligible = enabling.length > 0 && envOk && craftOk;
    let reason: string;
    if (enabling.length === 0) {
      reason = `Requires an instrument from the "${type.family}" family — none selected.`;
    } else if (!envOk) {
      reason = `${DESTINATIONS[dest].label} does not offer this observation opportunity.`;
    } else if (!craftOk) {
      reason = `Needs surface contact (lander/rover) — ${mission.spacecraft ?? 'this spacecraft'} cannot deploy it.`;
    } else {
      reason = `Your ${enabling.map(i => INSTRUMENTS[i].label).join(' + ')} allow${enabling.length === 1 ? 's' : ''} this observation at ${DESTINATIONS[dest].label}.`;
    }
    return { type, eligible, reason, enablingInstruments: enabling };
  });
}

// ── Discovery generation during simulation ──────────────────────────────────

export interface ScienceDiscovery {
  id: string;
  discoveryId: string;
  label: string;
  instrumentLabel: string;
  detail: string;
  example: string;
  /** "major" for breakthrough-grade findings, else standard. */
  significance: 'standard' | 'major';
  time: string;
}

interface RollContext {
  rand: SeededRandom;
  /** 0–1 overall design fit. */
  designFit: number;
  /** Instruments health factor 0–1. */
  instrumentHealth: number;
  /** Elapsed mission progress 0–1. */
  progress: number;
}

/**
 * Roll for discoveries at several checkpoints during operations.
 * Higher design fit and healthy instruments raise (but never guarantee)
 * the chance for each eligible observation type.
 */
export function rollDiscoveries(mission: MissionState, ctx: RollContext): ScienceDiscovery[] {
  const findings: ScienceDiscovery[] = [];
  const dest = mission.destination;
  if (!dest || mission.instruments.length === 0) return findings;

  const eligibilities = evaluateDiscoveries(mission).filter(e => e.eligible);
  // Operational phase gates: early ops → mapping; later → deeper observations.
  eligibilities.forEach((elig, idx) => {
    const baseChance = 0.35 + ctx.designFit * 0.3 + ctx.instrumentHealth * 0.2;
    const chance = Math.min(baseChance, 0.85);
    if (ctx.rand.next() > chance) return;

    const type = elig.type;
    const inst = elig.enablingInstruments[0];
    const major = ctx.rand.next() < 0.22 + ctx.designFit * 0.1;
    findings.push({
      id: `disc-${idx}-${type.id}`,
      discoveryId: type.id,
      label: type.label,
      instrumentLabel: INSTRUMENTS[inst].label,
      detail: `${INSTRUMENTS[inst].label} data supports ${type.label.toLowerCase()} at ${DESTINATIONS[dest].label}.`,
      example: type.example,
      significance: major ? 'major' : 'standard',
      time: formatOpsTime(ctx.progress),
    });
  });

  return findings;
}

/** Mission-time formatting for log lines (simplified educational clock). */
export function formatOpsTime(progress: number): string {
  const opDay = Math.max(1, Math.round(progress * 180)); // up to ~180 ops days
  return `OPS+${opDay}d`;
}

// ── Science Return summary ──────────────────────────────────────────────────

export interface ScienceReturnSummary {
  observationsCompleted: number;
  instrumentsOperated: number;
  instrumentsAffected: number;
  majorFindings: number;
  dataCollectedGb: number;
  dataReturnedGb: number;
  objectivesCompletedPercent: number;
  /** Short "why" lines for each number. */
  explanations: {
    observations: string;
    instruments: string;
    findings: string;
    data: string;
    objectives: string;
  };
}

export function buildScienceReturn(
  mission: MissionState,
  discoveries: ScienceDiscovery[],
  opts: {
    instrumentHealth: number;      // 0–100
    communicationHealth: number;   // 0–100
    powerHealth: number;           // 0–100
    progress: number;              // 0–100
    dataStoredGb: number;
    dataReturnedGb: number;
    scenario: string;
  }
): ScienceReturnSummary {
  const dest = mission.destination;
  const eligible = dest ? evaluateDiscoveries(mission).filter(e => e.eligible) : [];
  const observationsCompleted = discoveries.length;
  const instrumentsOperated = new Set(discoveries.map(d => d.instrumentLabel)).size;
  const majorFindings = discoveries.filter(d => d.significance === 'major').length;

  // Objectives: each eligible observation type is a potential objective.
  const objectivesTotal = Math.max(eligible.length, mission.instruments.length > 0 ? 1 : 0);
  const objectivesCompletedPercent = objectivesTotal === 0
    ? 0
    : Math.round((Math.min(observationsCompleted, objectivesTotal) / objectivesTotal) * 100);

  const commFactor = opts.communicationHealth / 100;
  const powerFactor = opts.powerHealth / 100;
  const dataReturnedGb = Math.round(opts.dataStoredGb * Math.min(1, commFactor * 0.85 + 0.1));

  const explanations = {
    observations: `${observationsCompleted} of ${objectivesTotal} eligible observation types produced data, based on the instruments you selected and conditions during flight.`,
    instruments: `${instrumentsOperated} of ${mission.instruments.length} selected instruments successfully returned data${opts.instrumentHealth < 80 ? ' (some operated at reduced capacity)' : ''}.`,
    findings: `${majorFindings} finding${majorFindings === 1 ? '' : 's'} were flagged as scientifically significant — ${majorFindings > 0 ? 'planned instruments plus a rich environment occasionally produce standout results' : 'solid coverage, but no standout anomalies this mission'}.`,
    data: `${opts.dataStoredGb} GB collected; ${dataReturnedGb} GB returned to Earth — the communication link is the pipe that turns data into science.`,
    objectives: `Objectives are defined by the observation types your instruments made possible at ${dest ? DESTINATIONS[dest].label : 'the destination'}; ${objectivesCompletedPercent}% were achieved.`,
  };

  return {
    observationsCompleted,
    instrumentsOperated,
    instrumentsAffected: Math.max(0, mission.instruments.length - instrumentsOperated),
    majorFindings,
    dataCollectedGb: opts.dataStoredGb,
    dataReturnedGb,
    objectivesCompletedPercent,
    explanations,
  };
}

// ── Data storage accumulation (instruments generate data at different rates) ─

export const INSTRUMENT_DATA_RATE_GB_PER_OPS: Record<Instrument, number> = {
  camera: 4.2, spectrometer: 1.8, radar: 2.4, magnetometer: 0.3, thermal: 0.9,
  atmospheric: 1.1, radiation: 0.4, seismometer: 0.6, particle: 0.7,
};

export function projectDataVolume(mission: MissionState, opsFraction: number): number {
  const perOps = mission.instruments.reduce((s, i) => s + INSTRUMENT_DATA_RATE_GB_PER_OPS[i], 0);
  return Math.round(perOps * opsFraction * 10) / 10;
}
