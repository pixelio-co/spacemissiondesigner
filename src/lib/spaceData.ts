/**
 * SPACE DATA LAYER
 * ─────────────────────────────────────────────────────────────────────────────
 * A clean abstraction over real, publicly available space-agency data.
 *
 * DESIGN PRINCIPLES
 * 1. Every number carries its source. Nothing here is invented — static
 *    snapshots are taken from NASA / JPL public datasets and each dataset is
 *    registered in SPACE_DATA_SOURCES so the app can display provenance.
 * 2. Simple physics (light-time from distance + speed of light, solar
 *    illumination from the inverse-square law) is COMPUTED from verified
 *    data and labelled as such. Anything that is only a rough educational
 *    model is labelled "educational estimate".
 * 3. No live-API dependency. If live APIs are added later they plug into the
 *    same interfaces; the app works fully offline from these cached datasets.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Destination } from './missionData';

// ── Data source registry ─────────────────────────────────────────────────────

export interface SpaceDataSource {
  id: string;
  provider: string;      // e.g. "NASA"
  dataset: string;       // e.g. "Planetary Fact Sheet"
  sourceUrl: string;
  usedFor: string;       // what the app uses it for
  nature: 'static snapshot' | 'computed from verified data' | 'educational estimate';
}

export const SPACE_DATA_SOURCES: SpaceDataSource[] = [
  {
    id: 'nasa-planetary-factsheet',
    provider: 'NASA',
    dataset: 'Planetary Fact Sheet (NSSDCA)',
    sourceUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    usedFor:
      'Destination distances, orbital periods, gravity, temperature ranges, moon counts, and solar illumination baselines.',
    nature: 'static snapshot',
  },
  {
    id: 'nasa-moon-factsheet',
    provider: 'NASA',
    dataset: 'Moon Fact Sheet (NSSDCA)',
    sourceUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
    usedFor: 'Lunar distance from Earth, surface gravity, and lunar day/night temperatures.',
    nature: 'static snapshot',
  },
  {
    id: 'nasa-nea-asteroids',
    provider: 'NASA / JPL',
    dataset: 'Solar System Dynamics — Small-Body Database (Ceres, Bennu, Eros, Psyche)',
    sourceUrl: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html',
    usedFor: 'Asteroid destination reference facts (sizes, distances, example exploration missions).',
    nature: 'static snapshot',
  },
  {
    id: 'light-time-physics',
    provider: 'This project',
    dataset: 'One-way light-time computation (distance ÷ 299,792.458 km/s)',
    sourceUrl: 'https://science.nasa.gov/learn/speed-of-light/',
    usedFor: 'Communication-delay demonstrations during the mission simulation.',
    nature: 'computed from verified data',
  },
  {
    id: 'mission-history',
    provider: 'NASA / JPL mission archives',
    dataset: 'Public mission fact pages (Voyager, Cassini, Juno, Perseverance, OSIRIS-REx, Dawn, …)',
    sourceUrl: 'https://science.nasa.gov/missions/',
    usedFor: 'Real-mission comparisons that show how past missions solved the same design trade-offs.',
    nature: 'static snapshot',
  },
  {
    id: 'game-models',
    provider: 'This project',
    dataset: 'Simplified educational models (Mission DNA, science return, event engine)',
    sourceUrl: '',
    usedFor:
      'All scores, probabilities, and outcomes. Transparent teaching models — NOT engineering calculations.',
    nature: 'educational estimate',
  },
];

// ── Destination facts (NASA Planetary Fact Sheet snapshot) ───────────────────

export interface DestinationFacts {
  /** Mean distance from the Sun, in millions of km (Earth-orbit uses ~1 AU). */
  meanDistanceFromSunMkm: number;
  distanceFromSunAu: number;
  /** Distance range from Earth in millions of km (null for Earth orbit itself). */
  distanceFromEarthMkm: { min: number; max: number } | null;
  /** Surface gravity in m/s² (null for gas giants / orbit-only destinations). */
  surfaceGravityMs2: number | null;
  /** Mean surface or 1-bar-level temperature in °C. */
  meanTempC: number | null;
  /** Notable temperature extremes in °C. */
  tempExtremesC: string | null;
  /** Confirmed natural satellites (as of the 2024 fact sheet snapshot). */
  moons: number | null;
  /** Orbital period around the Sun in Earth days (365.2 for Earth). */
  orbitalPeriodDays: number | null;
  /** Rotation period in hours. */
  rotationPeriodHours: number | null;
  /** Sunlight received relative to Earth orbit (inverse-square law, 100% at 1 AU). */
  solarIlluminationPercentOfEarth: number;
  /** Short radiation / environment note. */
  radiationNote: string;
}

/**
 * Illumination relative to Earth orbit: (1 AU / d_AU)² × 100.
 * Exported so the UI can explain WHY solar power fades with distance.
 */
export function solarIlluminationPercent(distanceAu: number): number {
  const value = 100 / (distanceAu * distanceAu);
  // Round to 1 decimal; >= 1% to whole numbers for readability.
  return value >= 1 ? Math.round(value * 10) / 10 : Math.round(value * 100) / 100;
}

export const DESTINATION_FACTS: Record<Destination, DestinationFacts> = {
  'earth-orbit': {
    meanDistanceFromSunMkm: 149.6,
    distanceFromSunAu: 1.0,
    distanceFromEarthMkm: null,
    surfaceGravityMs2: 9.8,
    meanTempC: 15,
    tempExtremesC: '−65 °C to +50 °C (LEO thermal cycling every orbit)',
    moons: null,
    orbitalPeriodDays: 365.2,
    rotationPeriodHours: 23.9,
    solarIlluminationPercentOfEarth: 100,
    radiationNote: 'Passes through South Atlantic Anomaly and outer Van Allen belt regions; shielding manageable.',
  },
  'moon': {
    meanDistanceFromSunMkm: 149.6,
    distanceFromSunAu: 1.0,
    distanceFromEarthMkm: { min: 0.356, max: 0.407 },
    surfaceGravityMs2: 1.6,
    meanTempC: -20,
    tempExtremesC: '−173 °C (night) to +127 °C (day) at the equator',
    moons: null,
    orbitalPeriodDays: 27.3, // around Earth
    rotationPeriodHours: 655.7,
    solarIlluminationPercentOfEarth: 100,
    radiationNote: 'No atmosphere or magnetic field — solar particle events reach the surface unfiltered.',
  },
  'mercury': {
    meanDistanceFromSunMkm: 57.9,
    distanceFromSunAu: 0.39,
    distanceFromEarthMkm: { min: 77, max: 222 },
    surfaceGravityMs2: 3.7,
    meanTempC: 167,
    tempExtremesC: '−180 °C (night) to +430 °C (day)',
    moons: 0,
    orbitalPeriodDays: 88,
    rotationPeriodHours: 1407.6,
    solarIlluminationPercentOfEarth: solarIlluminationPercent(0.39),
    radiationNote: 'No significant atmosphere; intense solar wind and radiation close to the Sun.',
  },
  'venus': {
    meanDistanceFromSunMkm: 108.2,
    distanceFromSunAu: 0.72,
    distanceFromEarthMkm: { min: 38, max: 261 },
    surfaceGravityMs2: 8.9,
    meanTempC: 464,
    tempExtremesC: '~464 °C day and night (thick atmosphere stores heat)',
    moons: 0,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5, // retrograde
    solarIlluminationPercentOfEarth: solarIlluminationPercent(0.72),
    radiationNote: 'Dense CO₂ clouds deflect most sunlight before it reaches the surface; upper atmosphere is highly reflective.',
  },
  'mars': {
    meanDistanceFromSunMkm: 228.0,
    distanceFromSunAu: 1.52,
    distanceFromEarthMkm: { min: 54.6, max: 401 },
    surfaceGravityMs2: 3.7,
    meanTempC: -65,
    tempExtremesC: '−153 °C (winter pole) to +20 °C (equator, noon)',
    moons: 2,
    orbitalPeriodDays: 687,
    rotationPeriodHours: 24.6,
    solarIlluminationPercentOfEarth: solarIlluminationPercent(1.52),
    radiationNote: 'Thin atmosphere provides almost no shielding — surface radiation is similar to low Earth orbit above the belts.',
  },
  'jupiter': {
    meanDistanceFromSunMkm: 778.5,
    distanceFromSunAu: 5.20,
    distanceFromEarthMkm: { min: 588, max: 968 },
    surfaceGravityMs2: 23.1,
    meanTempC: -110,
    tempExtremesC: 'Cloud-top temperature ~−145 °C',
    moons: 95,
    orbitalPeriodDays: 4331,
    rotationPeriodHours: 9.9,
    solarIlluminationPercentOfEarth: solarIlluminationPercent(5.2),
    radiationNote: 'The most severe planetary radiation belts in the solar system — Europa Clipper carries titanium-shielded electronics.',
  },
  'saturn': {
    meanDistanceFromSunMkm: 1432.0,
    distanceFromSunAu: 9.57,
    distanceFromEarthMkm: { min: 1200, max: 1660 },
    surfaceGravityMs2: 9.0,
    meanTempC: -140,
    tempExtremesC: 'Cloud-top temperature ~−178 °C',
    moons: 146,
    orbitalPeriodDays: 10747,
    rotationPeriodHours: 10.7,
    solarIlluminationPercentOfEarth: solarIlluminationPercent(9.57),
    radiationNote: 'Radiation belts are much milder than Jupiter\'s, but still require care near the rings.',
  },
  'uranus': {
    meanDistanceFromSunMkm: 2867.0,
    distanceFromSunAu: 19.17,
    distanceFromEarthMkm: { min: 2570, max: 3150 },
    surfaceGravityMs2: 8.7,
    meanTempC: -195,
    tempExtremesC: 'Cloud-top temperature ~−216 °C',
    moons: 28,
    orbitalPeriodDays: 30589,
    rotationPeriodHours: -17.2,
    solarIlluminationPercentOfEarth: solarIlluminationPercent(19.17),
    radiationNote: 'Magnetosphere is tilted 59° from the spin axis and tumbles — unpredictable charged-particle environment.',
  },
  'neptune': {
    meanDistanceFromSunMkm: 4515.0,
    distanceFromSunAu: 30.18,
    distanceFromEarthMkm: { min: 4300, max: 4700 },
    surfaceGravityMs2: 11.0,
    meanTempC: -200,
    tempExtremesC: 'Cloud-top temperature ~−214 °C',
    moons: 16,
    orbitalPeriodDays: 59800,
    rotationPeriodHours: 16.1,
    solarIlluminationPercentOfEarth: solarIlluminationPercent(30.18),
    radiationNote: 'Only visited once (Voyager 2, 1989). Solar illumination is ~0.11% of Earth\'s.',
  },
  'asteroid': {
    // Belt reference values; individual asteroids vary widely.
    meanDistanceFromSunMkm: 404, // ~2.7 AU, middle of the main belt (2.2–3.2 AU)
    distanceFromSunAu: 2.7,
    distanceFromEarthMkm: { min: 80, max: 500 },
    surfaceGravityMs2: null, // e.g. Bennu ~0.000006 m/s², Ceres 0.27 — varies by orders of magnitude
    meanTempC: -100,
    tempExtremesC: '−73 °C (main-belt average); NEAs can span far wider',
    moons: null,
    orbitalPeriodDays: 1680, // ~4.6 years at 2.7 AU
    rotationPeriodHours: null, // 2–30 h typical
    solarIlluminationPercentOfEarth: solarIlluminationPercent(2.7),
    radiationNote: 'No atmosphere or magnetosphere; full exposure to solar wind and cosmic rays.',
  },
};

// ── Light-time (communication delay) ────────────────────────────────────────

const SPEED_OF_LIGHT_KM_S = 299792.458; // exact, by SI definition

export interface LightTimeResult {
  seconds: number;
  /** Round-trip seconds (command out + reply back). */
  roundTripSeconds: number;
  /** Human-readable one-way delay, e.g. "12 min 38 s". */
  formatted: string;
  /** True when the value is computed from verified distance data. */
  computedFromVerifiedData: boolean;
}

export function computeLightTime(distanceKm: number): LightTimeResult {
  const seconds = distanceKm / SPEED_OF_LIGHT_KM_S;
  const roundTripSeconds = seconds * 2;
  const formatted =
    seconds < 1
      ? `${(seconds * 1000).toFixed(0)} ms`
      : seconds < 60
        ? `${seconds.toFixed(1)} s`
        : seconds < 5400
          ? `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`
          : `${(seconds / 3600).toFixed(2)} h`;
  return {
    seconds,
    roundTripSeconds,
    formatted,
    computedFromVerifiedData: true,
  };
}

/** Representative Earth↔destination distance in km for the delay demo. */
export function representativeEarthDistanceKm(destination: Destination): number {
  const facts = DESTINATION_FACTS[destination];
  if (!facts.distanceFromEarthMkm) return 400; // LEO representative value
  // Use the mid-point of the documented range (geometric mean keeps order of magnitude honest).
  const { min, max } = facts.distanceFromEarthMkm;
  const midMkm = Math.sqrt(min * max);
  return midMkm * 1e6;
}

export interface CommDelayInfo {
  label: string;                 // e.g. "Mars (representative distance)"
  representativeDistanceKm: number;
  distanceNote: string;
  lightTime: LightTimeResult;
}

export function getCommDelayInfo(destination: Destination): CommDelayInfo {
  const facts = DESTINATION_FACTS[destination];
  const representativeDistanceKm = representativeEarthDistanceKm(destination);
  const range = facts.distanceFromEarthMkm;
  const distanceNote = range
    ? `Real distance varies ${range.min}–${range.max} million km as both planets orbit.`
    : destination === 'moon'
      ? 'Mean Earth–Moon distance 384,400 km (varies 356,500–406,700 km).'
      : 'Low Earth orbit representative altitude ~400 km.';
  return {
    label: destination,
    representativeDistanceKm,
    distanceNote,
    lightTime: computeLightTime(representativeDistanceKm),
  };
}

// ── Solar-system scale (visualization + education) ──────────────────────────

export interface PlanetScalePoint {
  destination: Destination;
  label: string;
  au: number;
  /** Diameter for rendering (log-scaled visual size — NOT to physical scale). */
  visualSize: number;
  color: string;
}

/** Visual orbit radii use a log scale so all planets fit on one diagram. */
export const SOLAR_SYSTEM_SCALE: PlanetScalePoint[] = (
  [
    ['mercury', 'Mercury', '#78716c'],
    ['venus', 'Venus', '#d97706'],
    ['earth-orbit', 'Earth', '#3b82f6'],
    ['mars', 'Mars', '#ef4444'],
    ['asteroid', 'Asteroid belt', '#a78bfa'],
    ['jupiter', 'Jupiter', '#f97316'],
    ['saturn', 'Saturn', '#eab308'],
    ['uranus', 'Uranus', '#06b6d4'],
    ['neptune', 'Neptune', '#6366f1'],
  ] as [Destination, string, string][]
).map(([destination, label, color]) => ({
  destination,
  label,
  color,
  au: DESTINATION_FACTS[destination].distanceFromSunAu,
  visualSize: destination === 'asteroid' ? 2.5 : Math.max(3, Math.min(11, 3 + Math.log10(DESTINATION_FACTS[destination].distanceFromSunAu * 2) * 2.2)),
}));

// ── Asteroid reference data ─────────────────────────────────────────────────

export interface AsteroidFact {
  id: string;
  name: string;
  class: string;
  meanDiameterKm: number;
  au: number;
  note: string;
  visitedBy: string;
}

export const ASTEROID_REFERENCE: AsteroidFact[] = [
  {
    id: 'ceres',
    name: '1 Ceres',
    class: 'Main-belt dwarf planet',
    meanDiameterKm: 940,
    au: 2.77,
    note: 'Largest object in the main belt; likely water-rich.',
    visitedBy: 'Dawn (orbited 2015–2018, ion propulsion + solar power)',
  },
  {
    id: 'bennu',
    name: '101955 Bennu',
    class: 'Near-Earth asteroid (b-type)',
    meanDiameterKm: 0.49,
    au: 1.13,
    note: 'Sample returned to Earth by OSIRIS-REx in September 2023.',
    visitedBy: 'OSIRIS-REx (sample return, 2016–2023)',
  },
  {
    id: 'eros',
    name: '433 Eros',
    class: 'Near-Earth asteroid (S-type)',
    meanDiameterKm: 16.8,
    au: 1.46,
    note: 'First asteroid orbited by a spacecraft, and first asteroid landed on.',
    visitedBy: 'NEAR Shoemaker (2000–2001)',
  },
  {
    id: 'psyche',
    name: '16 Psyche',
    class: 'Main-belt metal-rich asteroid',
    meanDiameterKm: 220,
    au: 2.92,
    note: 'Possible exposed planetary core material — NASA Psyche mission arrives 2029.',
    visitedBy: 'Psyche (en route, ion propulsion + solar power)',
  },
];

// ── Real mission reference data (educational comparisons) ───────────────────

export interface ReferenceMission {
  id: string;
  name: string;
  agency: string;
  launchYear: number;
  destinationLabel: string;
  destinations: Destination[];
  spacecraftKind: string;
  power: string;
  propulsion: string;
  /** What this real mission teaches the player. */
  lesson: string;
}

export const REFERENCE_MISSIONS: ReferenceMission[] = [
  {
    id: 'voyager2',
    name: 'Voyager 2',
    agency: 'NASA',
    launchYear: 1977,
    destinationLabel: 'All four giant planets',
    destinations: ['jupiter', 'saturn', 'uranus', 'neptune'],
    spacecraftKind: 'Flyby probe',
    power: 'Radioisotope (RTG)',
    propulsion: 'Chemical + gravity assists',
    lesson: 'Only spacecraft to visit Uranus and Neptune. Its RTG power still works — 47+ years after launch, far beyond any solar array.',
  },
  {
    id: 'cassini',
    name: 'Cassini–Huygens',
    agency: 'NASA / ESA / ASI',
    launchYear: 1997,
    destinationLabel: 'Saturn & Titan',
    destinations: ['saturn'],
    spacecraftKind: 'Orbiter + lander',
    power: 'Radioisotope (RTG)',
    propulsion: 'Chemical + gravity assists',
    lesson: '13 years in Saturn orbit. Showed how an orbiter and a lander combine for surface science — and why deep-space power demands nuclear sources.',
  },
  {
    id: 'juno',
    name: 'Juno',
    agency: 'NASA',
    launchYear: 2011,
    destinationLabel: 'Jupiter',
    destinations: ['jupiter'],
    spacecraftKind: 'Orbiter',
    power: 'Solar (largest arrays flown to Jupiter)',
    propulsion: 'Chemical',
    lesson: 'Proved solar power CAN reach Jupiter — but needed three 30-ft panels and a carefully designed orbit that keeps them in sunlight.',
  },
  {
    id: 'perseverance',
    name: 'Perseverance',
    agency: 'NASA',
    launchYear: 2020,
    destinationLabel: 'Mars (Jezero Crater)',
    destinations: ['mars'],
    spacecraftKind: 'Rover',
    power: 'Radioisotope (MMRTG)',
    propulsion: 'Chemical cruise stage',
    lesson: 'Drives itself between commands because Mars delay makes joystick control impossible — the core reason for spacecraft autonomy.',
  },
  {
    id: 'osiris-rex',
    name: 'OSIRIS-REx',
    agency: 'NASA',
    launchYear: 2016,
    destinationLabel: 'Asteroid Bennu',
    destinations: ['asteroid'],
    spacecraftKind: 'Sample-return probe',
    power: 'Solar',
    propulsion: 'Chemical',
    lesson: 'Tagged a 490-m asteroid and returned 121.6 g of samples — asteroid missions need precision, not raw thrust.',
  },
  {
    id: 'dawn',
    name: 'Dawn',
    agency: 'NASA',
    launchYear: 2007,
    destinationLabel: 'Vesta & Ceres',
    destinations: ['asteroid'],
    spacecraftKind: 'Orbiter',
    power: 'Solar',
    propulsion: 'Ion',
    lesson: 'First spacecraft to orbit two worlds beyond Earth. Its ion drive ran for years on sunlight alone.',
  },
  {
    id: 'new-horizons',
    name: 'New Horizons',
    agency: 'NASA',
    launchYear: 2006,
    destinationLabel: 'Pluto & Kuiper Belt',
    destinations: ['neptune'],
    spacecraftKind: 'Flyby probe',
    power: 'Radioisotope (RTG)',
    propulsion: 'Chemical + Jupiter gravity assist',
    lesson: 'Fastest launch ever (16 km/s). Data downlink from Pluto took months because of the 4.5-hour signal delay and tiny data rates.',
  },
  {
    id: 'europa-clipper',
    name: 'Europa Clipper',
    agency: 'NASA',
    launchYear: 2024,
    destinationLabel: 'Jupiter / Europa',
    destinations: ['jupiter'],
    spacecraftKind: 'Orbiter',
    power: 'Solar (again — at Jupiter)',
    propulsion: 'Chemical + gravity assists',
    lesson: 'Carries vault-like shielding for Europa\'s radiation — a live example of designing instruments around environment risk.',
  },
  {
    id: 'insight',
    name: 'InSight',
    agency: 'NASA',
    launchYear: 2018,
    destinationLabel: 'Mars surface',
    destinations: ['mars'],
    spacecraftKind: 'Lander',
    power: 'Solar',
    propulsion: 'Chemical',
    lesson: 'Its seismometer listened for marsquakes for four years. Dust eventually cut solar power — power budgets decide mission lifetimes.',
  },
  {
    id: 'marco',
    name: 'MarCO (A & B)',
    agency: 'NASA',
    launchYear: 2018,
    destinationLabel: 'Mars (relay flyby)',
    destinations: ['mars'],
    spacecraftKind: 'CubeSat',
    power: 'Solar',
    propulsion: 'Cold-gas chemical',
    lesson: 'First CubeSats in deep space — tiny missions can help big ones, but only carry minimal instruments.',
  },
  {
    id: 'bepicolombo',
    name: 'BepiColombo',
    agency: 'ESA / JAXA',
    launchYear: 2018,
    destinationLabel: 'Mercury',
    destinations: ['mercury'],
    spacecraftKind: 'Orbiter (two orbiters)',
    power: 'Solar',
    propulsion: 'Ion + gravity assists',
    lesson: 'Mercury is HARD to reach — falling toward the Sun costs more energy than falling away. Nine flybys before orbit insertion.',
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope',
    agency: 'NASA / ESA / CSA',
    launchYear: 2021,
    destinationLabel: 'Sun–Earth L2 (1.5M km)',
    destinations: ['earth-orbit'],
    spacecraftKind: 'Space telescope',
    power: 'Solar (at L2)',
    propulsion: 'Chemical (station-keeping)',
    lesson: 'Chose the L2 point for an unobstructed cold view — destination selection is itself a science trade-off.',
  },
];

// ── Travel-time reference table (educational, from real mission records) ────

export interface TravelTimeReference {
  destination: Destination;
  /** Typical real-world cruise time. */
  typicalCruise: string;
  example: string;
  note: string;
}

export const TRAVEL_TIME_REFERENCE: Record<Destination, TravelTimeReference> = {
  'earth-orbit': {
    destination: 'earth-orbit',
    typicalCruise: 'Minutes',
    example: 'Launch to LEO takes ~8–10 minutes',
    note: 'Getting to orbit at all costs most of a mission\'s energy budget.',
  },
  'moon': {
    destination: 'moon',
    typicalCruise: 'Days',
    example: 'Apollo missions took ~3 days',
    note: 'Short cruise, but every kilogram of landing gear must be carried.',
  },
  'mercury': {
    destination: 'mercury',
    typicalCruise: '~7 years',
    example: 'BepiColombo launched 2018, arrives 2026',
    note: 'Counter-intuitive: diving sunward needs many braking flybys.',
  },
  'venus': {
    destination: 'venus',
    typicalCruise: 'Months',
    example: 'Akatsuki took ~7 months (then needed a 5-year retry)',
    note: 'Short transfer windows every ~19 months.',
  },
  'mars': {
    destination: 'mars',
    typicalCruise: '6–9 months',
    example: 'Perseverance: ~7 months (Jul 2020 → Feb 2021)',
    note: 'Windows open every ~26 months when orbits align.',
  },
  'jupiter': {
    destination: 'jupiter',
    typicalCruise: '5–6 years',
    example: 'Juno: ~5 years; Europa Clipper: ~5.5 years',
    note: 'Gravity assists shave years off the trip.',
  },
  'saturn': {
    destination: 'saturn',
    typicalCruise: '~7 years',
    example: 'Cassini: 1997 → 2004',
    note: 'Long cruise favors long-lived, reliable power systems.',
  },
  'uranus': {
    destination: 'uranus',
    typicalCruise: '9+ years',
    example: 'Voyager 2: 9.5 years (using a rare planetary alignment)',
    note: 'Launch windows that good recur roughly every 175 years.',
  },
  'neptune': {
    destination: 'neptune',
    typicalCruise: '12+ years',
    example: 'Voyager 2: 12 years (1989 flyby)',
    note: 'Requires spacecraft designed to last decades.',
  },
  'asteroid': {
    destination: 'asteroid',
    typicalCruise: '1–4 years',
    example: 'OSIRIS-REx: ~2 years to Bennu',
    note: 'Depends entirely on which asteroid — targets range from months to years away.',
  },
};
