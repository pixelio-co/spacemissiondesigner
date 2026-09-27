/**
 * spaceData.ts — Real space data abstraction layer
 *
 * This module is the single place where externally-sourced space data enters
 * the application. It currently serves STATIC educational datasets compiled
 * from NASA's public Planetary Fact Sheets (NSSDCA) and NASA mission pages.
 *
 * DESIGN CONTRACT
 * ---------------
 * - Every value here is approximate and educational. It is NOT intended for
 *   navigation or engineering. The app must keep working fully offline —
 *   these datasets are bundled, cached constants, never live-only.
 * - A live API adapter (e.g. NASA APIs) could be added later by implementing
 *   the SpaceDataProvider interface below without touching app code.
 * - Every dataset is registered in DATA_SOURCES so the About page can show
 *   Source / Dataset / Used-for transparently.
 *
 * Primary sources (public, NASA):
 * - NASA Planetary Fact Sheet (NSSDCA): https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 * - NASA Solar System Exploration: https://science.nasa.gov/solar-system/
 * - NASA Deep Space Network: https://www.nasa.gov/dsn
 * - Individual NASA/JPL mission pages (Voyager, Cassini, Juno, Perseverance, …)
 */

// ── Provider abstraction ─────────────────────────────────────────────────────

export interface DestinationFacts {
  key: string;
  label: string;
  /** Average distance from the Sun, astronomical units (1 AU ≈ 149.6M km). */
  distanceFromSunAu: number | null;
  /** Average Earth–destination distance in millions of km (varies with orbits). */
  earthDistanceMillionKm: string;
  /** Equatorial (or surface) gravity, m/s². */
  gravityMs2: number | null;
  /** Mean surface or 1-bar temperature, °C (approximate). */
  meanTempC: number | null;
  tempRangeC: string | null;
  /** Solar irradiance at the body's average solar distance, W/m² (Earth = 1,361). */
  solarIrradianceWm2: number | null;
  orbitalPeriod: string;
  dayLength: string;
  moons: string;
  atmosphere: string;
  radiationNotes: string;
  /** Midpoint of the Earth–body one-way light-time range, seconds. */
  avgOneWayDelaySeconds: number;
  /** Short real-mission context line. */
  realMissionContext: string;
}

export interface SpaceDataProvider {
  getDestinationFacts(key: string): DestinationFacts | null;
  listDestinationKeys(): string[];
  getRealMissions(): RealMission[];
  getDataSources(): DataSource[];
}

// ── Light-time helpers (transparent, derived from distance ÷ c) ──────────────

export const LIGHT_SPEED_KM_S = 299_792.458;
/** Light travels 1 AU in ≈ 499.0 seconds (≈ 8.32 min). */
export const LIGHT_TIME_ONE_AU_S = 499.005;

export function formatDelay(seconds: number): string {
  if (seconds < 0.5) return '< 0.5 s';
  if (seconds < 90) return `≈ ${seconds.toFixed(1).replace(/\.0$/, '')} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `≈ ${m} min ${s} s` : `≈ ${m} min`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 90) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

// ── Static dataset: destination facts ────────────────────────────────────────
// Values from NASA Planetary Fact Sheet (approximate averages; educational use).

export const DESTINATION_FACTS: Record<string, DestinationFacts> = {
  'earth-orbit': {
    key: 'earth-orbit',
    label: 'Earth Orbit',
    distanceFromSunAu: 1.0,
    earthDistanceMillionKm: '0.4–36 thousand km (altitude)',
    gravityMs2: 9.8,
    meanTempC: 15,
    tempRangeC: 'varies by orbit & eclipse',
    solarIrradianceWm2: 1361,
    orbitalPeriod: '≈ 90 min (LEO) – 24 h (GEO)',
    dayLength: '90 min to 24 h (orbital)',
    moons: '— (orbiting Earth)',
    atmosphere: 'Outer trace atmosphere in LEO; drag degrades low orbits over time',
    radiationNotes: 'South Atlantic Anomaly & Van Allen belts raise radiation for some orbits',
    avgOneWayDelaySeconds: 0.1,
    realMissionContext: 'Hundreds of Earth-observation spacecraft operate here, e.g. NASA’s Landsat and Terra missions.',
  },
  'moon': {
    key: 'moon',
    label: 'The Moon',
    distanceFromSunAu: 1.0,
    earthDistanceMillionKm: '0.384 million km',
    gravityMs2: 1.62,
    meanTempC: -23,
    tempRangeC: '−173 °C to +127 °C (equatorial surface)',
    solarIrradianceWm2: 1361,
    orbitalPeriod: '27.3 days around Earth',
    dayLength: '≈ 29.5 Earth days (synchronous rotation)',
    moons: '— (Earth’s natural satellite)',
    atmosphere: 'Essentially none (exosphere) — extreme day/night temperature swings',
    radiationNotes: 'No magnetic shielding; exposed to galactic cosmic rays and solar particle events',
    avgOneWayDelaySeconds: 1.3,
    realMissionContext: 'NASA’s Artemis campaign and the Apollo missions 1968–1972 explored the Moon; LRO still maps it today.',
  },
  'mercury': {
    key: 'mercury',
    label: 'Mercury',
    distanceFromSunAu: 0.387,
    earthDistanceMillionKm: '77–222 million km',
    gravityMs2: 3.7,
    meanTempC: 167,
    tempRangeC: '−180 °C to +430 °C',
    solarIrradianceWm2: 9088,
    orbitalPeriod: '88 days',
    dayLength: '≈ 176 Earth days (solar day)',
    moons: '0',
    atmosphere: 'Almost none (thin exosphere)',
    radiationNotes: 'Intense solar radiation and heat near the Sun; weak magnetosphere',
    avgOneWayDelaySeconds: 510,
    realMissionContext: 'NASA’s MESSENGER orbited Mercury 2011–2015 behind a ceramic sunshade; ESA/JAXA’s BepiColombo arrives in 2026.',
  },
  'venus': {
    key: 'venus',
    label: 'Venus',
    distanceFromSunAu: 0.723,
    earthDistanceMillionKm: '38–261 million km',
    gravityMs2: 8.9,
    meanTempC: 464,
    tempRangeC: '≈ 464 °C surface (hot enough to melt lead)',
    solarIrradianceWm2: 2601,
    orbitalPeriod: '225 days',
    dayLength: '≈ 117 Earth days (solar day; retrograde rotation)',
    moons: '0',
    atmosphere: '96% CO₂ at 92 bar surface pressure; sulfuric-acid clouds',
    radiationNotes: 'Dense atmosphere shields the surface but challenges balloons/entry systems',
    avgOneWayDelaySeconds: 480,
    realMissionContext: 'NASA’s Magellan mapped 98% of Venus with radar (1990–1994); DAVINCI and VERITAS are planned.',
  },
  'mars': {
    key: 'mars',
    label: 'Mars',
    distanceFromSunAu: 1.524,
    earthDistanceMillionKm: '54.6–401 million km',
    gravityMs2: 3.71,
    meanTempC: -65,
    tempRangeC: '−153 °C to +20 °C',
    solarIrradianceWm2: 586,
    orbitalPeriod: '687 days',
    dayLength: '24 h 37 min (a “sol”)',
    moons: '2 (Phobos, Deimos)',
    atmosphere: 'Thin CO₂ (≈ 0.6% of Earth’s pressure); planet-wide dust storms occur',
    radiationNotes: 'No global magnetic field; surface radiation ≈ 50–100× Earth surface levels',
    avgOneWayDelaySeconds: 750,
    realMissionContext: 'NASA’s Perseverance rover and Ingenuity helicopter operate on Mars today; a fleet of orbiters relays data.',
  },
  'jupiter': {
    key: 'jupiter',
    label: 'Jupiter',
    distanceFromSunAu: 5.203,
    earthDistanceMillionKm: '588–968 million km',
    gravityMs2: 23.1,
    meanTempC: -110,
    tempRangeC: '≈ −110 °C at 1-bar cloud level',
    solarIrradianceWm2: 50.3,
    orbitalPeriod: '11.9 years',
    dayLength: '≈ 10 h (fastest planet rotation)',
    moons: '95 confirmed (NASA, 2023)',
    atmosphere: 'Hydrogen/helium; no solid surface; violent storms (Great Red Spot)',
    radiationNotes: 'The most severe planetary radiation belts in the solar system — electronics need heavy shielding',
    avgOneWayDelaySeconds: 2580,
    realMissionContext: 'NASA’s Juno has orbited Jupiter since 2016 on solar power — the farthest solar-powered spacecraft at the time. Europa Clipper arrives in 2030.',
  },
  'saturn': {
    key: 'saturn',
    label: 'Saturn',
    distanceFromSunAu: 9.537,
    earthDistanceMillionKm: '1.2–1.7 billion km',
    gravityMs2: 9.0,
    meanTempC: -140,
    tempRangeC: '≈ −140 °C at 1-bar cloud level',
    solarIrradianceWm2: 15.0,
    orbitalPeriod: '29.4 years',
    dayLength: '≈ 10.7 h',
    moons: '146 confirmed (NASA, 2023)',
    atmosphere: 'Hydrogen/helium with ammonia haze; spectacular ring system',
    radiationNotes: 'Moderate radiation belts; Titan has a thick nitrogen atmosphere, Enceladus vents water plumes',
    avgOneWayDelaySeconds: 4560,
    realMissionContext: 'NASA/ESA/ASI’s Cassini–Huygens orbited Saturn 2004–2017 on nuclear (RTG) power and landed on Titan.',
  },
  'uranus': {
    key: 'uranus',
    label: 'Uranus',
    distanceFromSunAu: 19.19,
    earthDistanceMillionKm: '2.6–3.2 billion km',
    gravityMs2: 8.7,
    meanTempC: -195,
    tempRangeC: '≈ −195 °C at 1-bar level (coldest planetary atmosphere measured)',
    solarIrradianceWm2: 3.7,
    orbitalPeriod: '84 years',
    dayLength: '≈ 17 h (retrograde; axis tilted 98°)',
    moons: '28 (NASA, 2023)',
    atmosphere: 'Hydrogen/helium/methane ice giant; extreme axial tilt gives 21-year seasons',
    radiationNotes: 'Unusual off-axis magnetosphere; only visited once (Voyager 2, 1986)',
    avgOneWayDelaySeconds: 10140,
    realMissionContext: 'Voyager 2 is the only spacecraft to visit Uranus (1986). A dedicated flagship mission is a top science priority.',
  },
  'neptune': {
    key: 'neptune',
    label: 'Neptune',
    distanceFromSunAu: 30.07,
    earthDistanceMillionKm: '4.3–4.7 billion km',
    gravityMs2: 11.0,
    meanTempC: -200,
    tempRangeC: '≈ −200 °C at 1-bar level',
    solarIrradianceWm2: 1.5,
    orbitalPeriod: '164.8 years',
    dayLength: '≈ 16 h',
    moons: '16 (NASA, 2023)',
    atmosphere: 'Ice giant with the fastest winds measured in the solar system (≈ 2,000 km/h)',
    radiationNotes: 'Deep-space radiation environment; Voyager 2 flew past in 1989',
    avgOneWayDelaySeconds: 15600,
    realMissionContext: 'Voyager 2’s 1989 flyby is our only close-up visit. Neptune receives ~0.1% of the sunlight Earth gets.',
  },
  'asteroid': {
    key: 'asteroid',
    label: 'Asteroid',
    distanceFromSunAu: 2.7,
    earthDistanceMillionKm: '150–500 million km (main belt typical)',
    gravityMs2: 0.28,
    meanTempC: -105,
    tempRangeC: 'varies; ≈ −105 °C at main-belt distance (Ceres)',
    solarIrradianceWm2: 187,
    orbitalPeriod: '3–6 years (main belt)',
    dayLength: 'Hours (fast rotators) to days',
    moons: 'Some asteroids have small moons (e.g. Dactyl around Ida)',
    atmosphere: 'None; microgravity with irregular gravity fields',
    radiationNotes: 'No shielding; long exposure to cosmic rays and solar particles',
    avgOneWayDelaySeconds: 1080,
    realMissionContext: 'NASA’s OSIRIS-REx returned samples from asteroid Bennu in 2023; Dawn used ion propulsion to orbit Vesta and Ceres.',
  },
};

// ── Static dataset: real missions (educational comparisons) ──────────────────

export interface RealMission {
  name: string;
  agency: string;
  years: string;
  target: string;
  craftType: string;
  power: 'Solar' | 'RPS / RTG' | 'Solar + battery' | 'Fuel cells';
  propulsion: string;
  highlight: string;
}

export const REAL_MISSIONS: RealMission[] = [
  {
    name: 'Voyager 1 & 2', agency: 'NASA', years: '1977–', target: 'Outer planets → interstellar space',
    craftType: 'Flyby', power: 'RPS / RTG', propulsion: 'Chemical + gravity assists',
    highlight: 'Used planet alignment for a “Grand Tour”; still returning data over 24 billion km away.',
  },
  {
    name: 'Cassini–Huygens', agency: 'NASA/ESA/ASI', years: '1997–2017', target: 'Saturn & Titan',
    craftType: 'Orbiter + lander', power: 'RPS / RTG', propulsion: 'Chemical',
    highlight: '13 years at Saturn; Huygens landed on Titan. Solar power is not viable that far out.',
  },
  {
    name: 'Juno', agency: 'NASA', years: '2011–', target: 'Jupiter',
    craftType: 'Orbiter', power: 'Solar', propulsion: 'Chemical',
    highlight: 'First solar-powered mission to Jupiter — needs arrays the size of a basketball court to collect 4% of Earth-level sunlight.',
  },
  {
    name: 'Perseverance', agency: 'NASA', years: '2020–', target: 'Mars (Jezero Crater)',
    craftType: 'Rover', power: 'RPS / RTG', propulsion: 'Chemical (cruise + sky crane)',
    highlight: 'Nuclear power lets it survive dust storms and long nights; first to make oxygen on another planet (MOXIE).',
  },
  {
    name: 'New Horizons', agency: 'NASA', years: '2006–', target: 'Pluto & Kuiper Belt',
    craftType: 'Flyby', power: 'RPS / RTG', propulsion: 'Chemical',
    highlight: 'Fastest launch ever; a flyby architecture was the only affordable way to reach Pluto.',
  },
  {
    name: 'OSIRIS-REx', agency: 'NASA', years: '2016–2023', target: 'Asteroid Bennu',
    craftType: 'Sample-return', power: 'Solar', propulsion: 'Chemical',
    highlight: 'Touched an asteroid and delivered 121.6 g of pristine samples to Earth.',
  },
  {
    name: 'Dawn', agency: 'NASA', years: '2007–2018', target: 'Vesta & Ceres',
    craftType: 'Orbiter', power: 'Solar', propulsion: 'Ion (xenon)',
    highlight: 'First spacecraft to orbit two extraterrestrial bodies — made possible by ion propulsion efficiency.',
  },
  {
    name: 'MESSENGER', agency: 'NASA', years: '2004–2015', target: 'Mercury',
    craftType: 'Orbiter', power: 'Solar', propulsion: 'Chemical + gravity assists',
    highlight: 'Needed six gravity assists and a ceramic sunshade to survive near the Sun.',
  },
  {
    name: 'InSight', agency: 'NASA', years: '2018–2022', target: 'Mars surface',
    craftType: 'Lander', power: 'Solar + battery', propulsion: 'Chemical',
    highlight: 'Its seismometer detected over 1,300 marsquakes — exactly what a seismometer instrument is for.',
  },
  {
    name: 'MarCO A/B', agency: 'NASA', years: '2018', target: 'Mars flyby',
    craftType: 'CubeSat', power: 'Solar', propulsion: 'Cold-gas + ion experiment',
    highlight: 'First CubeSats to deep space; relayed InSight’s landing telemetry in real time.',
  },
  {
    name: 'Parker Solar Probe', agency: 'NASA', years: '2018–', target: 'Sun’s corona',
    craftType: 'Flyby', power: 'Solar + battery', propulsion: 'Chemical + Venus gravity assists',
    highlight: 'Fastest human-made object; its cooled solar panels work within 6.9 million km of the Sun.',
  },
  {
    name: 'Europa Clipper', agency: 'NASA', years: '2024–', target: 'Jupiter’s moon Europa',
    craftType: 'Orbiter', power: 'Solar', propulsion: 'Chemical + gravity assists',
    highlight: 'Huge solar arrays and a metal “radiation vault” protect its ice-penetrating radar and other instruments.',
  },
  {
    name: 'James Webb Space Telescope', agency: 'NASA/ESA/CSA', years: '2021–', target: 'Sun–Earth L2',
    craftType: 'Space telescope', power: 'Solar + battery', propulsion: 'Chemical (station-keeping)',
    highlight: 'Observes infrared from a stable point 1.5 million km away behind a tennis-court-sized sunshield.',
  },
  {
    name: 'Hubble Space Telescope', agency: 'NASA/ESA', years: '1990–', target: 'Earth orbit',
    craftType: 'Space telescope', power: 'Solar', propulsion: 'Chemical / reboosts',
    highlight: 'Low Earth orbit gave astronauts the chance to repair and upgrade it five times.',
  },
];

// ── Data source registry (shown in About → Data Sources) ─────────────────────

export interface DataSource {
  id: string;
  organization: string;
  dataset: string;
  url: string;
  usedFor: string;
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'nssdc-factsheet',
    organization: 'NASA (NSSDCA)',
    dataset: 'Planetary Fact Sheet',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    usedFor: 'Destination information — distances, gravity, temperatures, moons, orbital periods.',
  },
  {
    id: 'solar-system-exploration',
    organization: 'NASA',
    dataset: 'Solar System Exploration pages',
    url: 'https://science.nasa.gov/solar-system/',
    usedFor: 'Destination environments and mission context descriptions.',
  },
  {
    id: 'dsn',
    organization: 'NASA / JPL',
    dataset: 'Deep Space Network overview',
    url: 'https://www.nasa.gov/general/deep-space-network/',
    usedFor: 'Communication delay concepts and deep-space communication context.',
  },
  {
    id: 'mission-pages',
    organization: 'NASA / JPL (and partners)',
    dataset: 'Individual mission pages — Voyager, Cassini, Juno, Perseverance, OSIRIS-REx, Dawn, MESSENGER, MarCO, Parker Solar Probe, Europa Clipper, JWST, Hubble',
    url: 'https://science.nasa.gov/missions/',
    usedFor: 'Educational comparisons between your design and real mission architectures.',
  },
  {
    id: 'nssd-chronology',
    organization: 'NASA (NSSDCA)',
    dataset: 'Master Catalog / mission chronology',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/',
    usedFor: 'Mission years and highlights used in the Learn page examples.',
  },
];

export const DATA_NOTE =
  'Values shown from these datasets are approximate averages compiled for education. ' +
  'Distances between planets change constantly as both planets orbit, so ranges — not exact figures — are shown. ' +
  'Communication delays in the simulation are one-way light-time estimates (distance ÷ speed of light), not exact real-time values.';

export const DISCLAIMER =
  'This is an independent educational project inspired by real space mission concepts. ' +
  'It is not an official NASA website, application, or engineering tool.';

// ── Default provider: fully offline static data ──────────────────────────────

class StaticSpaceDataProvider implements SpaceDataProvider {
  getDestinationFacts(key: string): DestinationFacts | null {
    return DESTINATION_FACTS[key] ?? null;
  }
  listDestinationKeys(): string[] {
    return Object.keys(DESTINATION_FACTS);
  }
  getRealMissions(): RealMission[] {
    return REAL_MISSIONS;
  }
  getDataSources(): DataSource[] {
    return DATA_SOURCES;
  }
}

let provider: SpaceDataProvider = new StaticSpaceDataProvider();

/** Swap in a custom (e.g. live-API-backed) provider without touching app code. */
export function setSpaceDataProvider(p: SpaceDataProvider): void {
  provider = p;
}

export function getSpaceDataProvider(): SpaceDataProvider {
  return provider;
}

export function getDestinationFacts(key: string | null | undefined): DestinationFacts | null {
  if (!key) return null;
  return provider.getDestinationFacts(key);
}

/** Relative sunlight strength vs Earth (Earth = 1). Educational approximation. */
export function relativeSunlight(key: string): number | null {
  const f = DESTINATION_FACTS[key];
  if (!f || !f.solarIrradianceWm2) return null;
  return f.solarIrradianceWm2 / 1361;
}
