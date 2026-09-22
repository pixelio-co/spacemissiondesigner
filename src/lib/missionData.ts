export type MissionObjective =
  | 'planetary-exploration' |'lunar-exploration' |'asteroid-exploration' |'earth-observation' |'climate-research' |'space-weather' |'search-for-life' |'astrophysics' |'technology-demo';

export type Destination =
  | 'earth-orbit' |'moon' |'mercury' |'venus' |'mars' |'jupiter' |'saturn' |'uranus' |'neptune' |'asteroid';

export type SpacecraftType =
  | 'orbiter' |'lander' |'rover' |'flyby' |'telescope' |'cubesat';

export type Instrument =
  | 'camera' |'spectrometer' |'radar' |'magnetometer' |'thermal' |'atmospheric' |'radiation' |'seismometer' |'particle';

export type Propulsion = 'chemical' | 'ion' | 'electric' | 'solar-sail';
export type Power = 'solar' | 'rps' | 'hybrid';
export type Communication = 'low-gain' | 'high-gain' | 'deep-space';

export interface MissionState {
  missionName: string;
  objective: MissionObjective | null;
  destination: Destination | null;
  spacecraft: SpacecraftType | null;
  instruments: Instrument[];
  propulsion: Propulsion | null;
  power: Power | null;
  communication: Communication | null;
  currentStage: number;
  completedStages: number[];
}

export interface AnalysisScores {
  scientificValue: number;
  payloadBalance: number;
  powerCompatibility: number;
  propulsionSuitability: number;
  communication: number;
  destinationCompatibility: number;
  missionComplexity: number;
}

export const MISSION_STAGES = [
  { id: 0, label: 'Mission', key: 'missionName' },
  { id: 1, label: 'Objective', key: 'objective' },
  { id: 2, label: 'Destination', key: 'destination' },
  { id: 3, label: 'Spacecraft', key: 'spacecraft' },
  { id: 4, label: 'Instruments', key: 'instruments' },
  { id: 5, label: 'Propulsion', key: 'propulsion' },
  { id: 6, label: 'Power', key: 'power' },
  { id: 7, label: 'Comms', key: 'communication' },
  { id: 8, label: 'Review', key: 'review' },
  { id: 9, label: 'Launch', key: 'launch' },
];

export const OBJECTIVES: Record<MissionObjective, {
  label: string;
  icon: string;
  description: string;
  scientificPurpose: string;
}> = {
  'planetary-exploration': {
    label: 'Planetary Exploration',
    icon: '🪐',
    description: 'Study planetary surfaces, atmospheres, and geological features.',
    scientificPurpose: 'Understand planetary formation and evolution across our solar system.',
  },
  'lunar-exploration': {
    label: 'Lunar Exploration',
    icon: '🌕',
    description: 'Investigate the Moon\'s surface, geology, and resources.',
    scientificPurpose: 'Prepare for future human exploration and understand Earth-Moon history.',
  },
  'asteroid-exploration': {
    label: 'Asteroid Exploration',
    icon: '☄️',
    description: 'Characterize near-Earth or main belt asteroids.',
    scientificPurpose: 'Study primitive solar system materials and planetary defense.',
  },
  'earth-observation': {
    label: 'Earth Observation',
    icon: '🌍',
    description: 'Monitor Earth\'s surface, oceans, and atmosphere from orbit.',
    scientificPurpose: 'Track environmental change and support climate science.',
  },
  'climate-research': {
    label: 'Climate Research',
    icon: '🌡️',
    description: 'Study climate systems, greenhouse gases, and atmospheric dynamics.',
    scientificPurpose: 'Improve climate models and understand global change.',
  },
  'space-weather': {
    label: 'Space Weather',
    icon: '☀️',
    description: 'Monitor solar activity and its effects on the space environment.',
    scientificPurpose: 'Protect spacecraft and infrastructure from solar events.',
  },
  'search-for-life': {
    label: 'Search for Life',
    icon: '🔭',
    description: 'Search for biosignatures and habitable conditions.',
    scientificPurpose: 'Answer the question: are we alone in the universe?',
  },
  'astrophysics': {
    label: 'Astrophysics',
    icon: '✨',
    description: 'Study stars, galaxies, and fundamental physics.',
    scientificPurpose: 'Understand the origin and structure of the universe.',
  },
  'technology-demo': {
    label: 'Technology Demo',
    icon: '⚙️',
    description: 'Test new spacecraft technologies in space.',
    scientificPurpose: 'Enable future missions with proven advanced technologies.',
  },
};

export const DESTINATIONS: Record<Destination, {
  label: string;
  icon: string;
  distanceCategory: 'near' | 'inner' | 'outer' | 'deep';
  distanceKm: string;
  environment: string;
  opportunities: string[];
  challenges: string[];
  communicationDelay: string;
  powerSuitability: { solar: number; rps: number; hybrid: number };
  color: string;
}> = {
  'earth-orbit': {
    label: 'Earth Orbit',
    icon: '🌍',
    distanceCategory: 'near',
    distanceKm: '400–36,000 km',
    environment: 'Low radiation, moderate temperature variation, frequent Earth occultation',
    opportunities: ['Continuous Earth observation', 'Easy communication', 'Regular resupply possible'],
    challenges: ['Atmospheric drag at low altitudes', 'Radiation belts', 'Orbital debris'],
    communicationDelay: '< 0.1 seconds',
    powerSuitability: { solar: 95, rps: 40, hybrid: 80 },
    color: '#3b82f6',
  },
  'moon': {
    label: 'Moon',
    icon: '🌕',
    distanceCategory: 'near',
    distanceKm: '~384,400 km',
    environment: 'No atmosphere, extreme temperature swings, micrometeorite exposure',
    opportunities: ['Geological surveys', 'Ice detection at poles', 'Lunar resource assessment'],
    challenges: ['14-day lunar night (no solar power)', 'Extreme temperatures (-173°C to +127°C)', 'Dust contamination'],
    communicationDelay: '~1.3 seconds',
    powerSuitability: { solar: 70, rps: 85, hybrid: 90 },
    color: '#94a3b8',
  },
  'mercury': {
    label: 'Mercury',
    icon: '⚫',
    distanceCategory: 'inner',
    distanceKm: '77–222 million km',
    environment: 'Extreme heat near Sun, intense radiation, no significant atmosphere',
    opportunities: ['Magnetic field study', 'Polar ice deposits', 'Solar proximity science'],
    challenges: ['Intense solar radiation', 'Orbital insertion difficulty', 'Extreme temperatures'],
    communicationDelay: '4–13 minutes',
    powerSuitability: { solar: 80, rps: 75, hybrid: 85 },
    color: '#78716c',
  },
  'venus': {
    label: 'Venus',
    icon: '🟡',
    distanceCategory: 'inner',
    distanceKm: '38–261 million km',
    environment: 'Dense CO₂ atmosphere, 465°C surface, crushing pressure',
    opportunities: ['Atmospheric chemistry', 'Greenhouse effect study', 'Volcanic activity'],
    challenges: ['Extreme surface pressure (90 atm)', 'Corrosive atmosphere', 'Communication through dense clouds'],
    communicationDelay: '2–14 minutes',
    powerSuitability: { solar: 60, rps: 80, hybrid: 75 },
    color: '#d97706',
  },
  'mars': {
    label: 'Mars',
    icon: '🔴',
    distanceCategory: 'inner',
    distanceKm: '54–401 million km',
    environment: 'Thin CO₂ atmosphere, dust storms, temperature -87°C to +20°C',
    opportunities: ['Habitability research', 'Water ice', 'Geological history', 'Future human exploration'],
    challenges: ['Dust storms can block solar panels', 'Communication blackout periods', 'Thin atmosphere for EDL'],
    communicationDelay: '3–22 minutes',
    powerSuitability: { solar: 65, rps: 85, hybrid: 80 },
    color: '#ef4444',
  },
  'jupiter': {
    label: 'Jupiter',
    icon: '🟠',
    distanceCategory: 'outer',
    distanceKm: '588–968 million km',
    environment: 'Intense radiation belts, powerful magnetic field, gas giant',
    opportunities: ['Moon habitability (Europa)', 'Atmospheric dynamics', 'Magnetosphere study'],
    challenges: ['Intense radiation (fatal to electronics without shielding)', 'Vast distance', 'No solid surface'],
    communicationDelay: '33–53 minutes',
    powerSuitability: { solar: 25, rps: 95, hybrid: 70 },
    color: '#f97316',
  },
  'saturn': {
    label: 'Saturn',
    icon: '🪐',
    distanceCategory: 'outer',
    distanceKm: '1.2–1.7 billion km',
    environment: 'Moderate radiation, ring system, diverse moon system including Titan',
    opportunities: ['Ring system study', 'Titan atmosphere', 'Enceladus water plumes'],
    challenges: ['Very long travel time', 'Extremely weak solar power', 'Complex ring navigation'],
    communicationDelay: '68–84 minutes',
    powerSuitability: { solar: 10, rps: 95, hybrid: 55 },
    color: '#eab308',
  },
  'uranus': {
    label: 'Uranus',
    icon: '🔵',
    distanceCategory: 'deep',
    distanceKm: '2.6–3.2 billion km',
    environment: 'Ice giant, unusual axial tilt, faint ring system, very cold',
    opportunities: ['Ice giant comparison', 'Magnetic field anomalies', 'Moon system exploration'],
    challenges: ['Extreme distance', 'No solar power viable', 'Very long mission duration'],
    communicationDelay: '143–195 minutes',
    powerSuitability: { solar: 3, rps: 98, hybrid: 40 },
    color: '#06b6d4',
  },
  'neptune': {
    label: 'Neptune',
    icon: '🔵',
    distanceCategory: 'deep',
    distanceKm: '4.3–4.7 billion km',
    environment: 'Farthest planet, supersonic winds, Triton (retrograde moon), very cold',
    opportunities: ['Farthest planet study', 'Triton geology', 'Ice giant science'],
    challenges: ['Longest travel time of any planet', 'Minimal solar power', 'Communication delays over 4 hours'],
    communicationDelay: '240–280 minutes',
    powerSuitability: { solar: 1, rps: 99, hybrid: 30 },
    color: '#6366f1',
  },
  'asteroid': {
    label: 'Asteroid',
    icon: '☄️',
    distanceCategory: 'inner',
    distanceKm: 'Varies: 150–500 million km',
    environment: 'Microgravity, no atmosphere, irregular shape, variable rotation',
    opportunities: ['Primitive solar system material', 'Resource assessment', 'Planetary defense data'],
    challenges: ['Low gravity makes landing difficult', 'Irregular shape complicates navigation', 'Variable surface conditions'],
    communicationDelay: '8–28 minutes',
    powerSuitability: { solar: 70, rps: 75, hybrid: 85 },
    color: '#a78bfa',
  },
};

export const SPACECRAFT_TYPES: Record<SpacecraftType, {
  label: string;
  icon: string;
  description: string;
  maxInstruments: number;
  massCategory: 'small' | 'medium' | 'large';
  payloadCapacity: number;
  suitableDestinations: Destination[];
  svgPath: string;
}> = {
  'orbiter': {
    label: 'Orbiter',
    icon: '🛸',
    description: 'Enters orbit around the destination for sustained study from above.',
    maxInstruments: 7,
    massCategory: 'large',
    payloadCapacity: 500,
    suitableDestinations: ['moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'asteroid', 'earth-orbit'],
    svgPath: 'M50,30 L70,50 L50,70 L30,50 Z M20,50 L80,50 M10,30 L30,50 M10,70 L30,50 M90,30 L70,50 M90,70 L70,50',
  },
  'lander': {
    label: 'Lander',
    icon: '🚀',
    description: 'Descends to the surface for in-situ science at a fixed location.',
    maxInstruments: 5,
    massCategory: 'large',
    payloadCapacity: 300,
    suitableDestinations: ['moon', 'mars', 'asteroid', 'venus'],
    svgPath: 'M50,20 L65,50 L75,80 L50,75 L25,80 L35,50 Z M35,80 L35,90 M65,80 L65,90 M25,80 L15,90 M75,80 L85,90',
  },
  'rover': {
    label: 'Rover',
    icon: '🤖',
    description: 'Mobile surface laboratory that traverses terrain to collect samples.',
    maxInstruments: 6,
    massCategory: 'large',
    payloadCapacity: 400,
    suitableDestinations: ['moon', 'mars', 'asteroid'],
    svgPath: 'M20,50 L80,50 L80,65 L20,65 Z M30,65 L30,80 L20,80 M50,65 L50,80 M70,65 L70,80 L80,80 M30,50 L30,30 L70,30 L70,50',
  },
  'flyby': {
    label: 'Flyby Probe',
    icon: '🛩️',
    description: 'Passes near the target at high speed, collecting data during closest approach.',
    maxInstruments: 4,
    massCategory: 'medium',
    payloadCapacity: 200,
    suitableDestinations: ['mercury', 'venus', 'jupiter', 'saturn', 'uranus', 'neptune', 'asteroid'],
    svgPath: 'M10,50 L90,50 L70,40 L90,50 L70,60 M50,50 L50,30 M50,50 L50,70',
  },
  'telescope': {
    label: 'Space Telescope',
    icon: '🔭',
    description: 'Observes distant objects from a stable orbital vantage point.',
    maxInstruments: 5,
    massCategory: 'large',
    payloadCapacity: 600,
    suitableDestinations: ['earth-orbit'],
    svgPath: 'M20,40 L80,40 L80,60 L20,60 Z M5,50 L20,50 M80,50 L95,50 M50,20 L50,40 M50,60 L50,80',
  },
  'cubesat': {
    label: 'CubeSat',
    icon: '📦',
    description: 'Small, low-cost satellite built to standardized dimensions.',
    maxInstruments: 2,
    massCategory: 'small',
    payloadCapacity: 50,
    suitableDestinations: ['earth-orbit', 'moon', 'mars'],
    svgPath: 'M30,30 L70,30 L70,70 L30,70 Z M30,30 L20,20 L60,20 L70,30 M70,30 L80,20 L60,20 M70,70 L80,80 L40,80 L30,70',
  },
};

export const INSTRUMENTS: Record<Instrument, {
  label: string;
  icon: string;
  description: string;
  scientificPurpose: string;
  mass: number;
  power: number;
}> = {
  'camera': {
    label: 'High-Resolution Camera',
    icon: '📷',
    description: 'Captures detailed images of surfaces, atmospheres, and phenomena.',
    scientificPurpose: 'Geological mapping, surface feature identification, atmospheric imaging.',
    mass: 12,
    power: 15,
  },
  'spectrometer': {
    label: 'Spectrometer',
    icon: '🌈',
    description: 'Analyzes light to determine chemical composition.',
    scientificPurpose: 'Identify minerals, atmospheric gases, and organic compounds.',
    mass: 8,
    power: 10,
  },
  'radar': {
    label: 'Radar',
    icon: '📡',
    description: 'Penetrates surfaces with radio waves to reveal subsurface structure.',
    scientificPurpose: 'Detect subsurface ice, map terrain through clouds or dust.',
    mass: 25,
    power: 40,
  },
  'magnetometer': {
    label: 'Magnetometer',
    icon: '🧲',
    description: 'Measures magnetic field strength and direction.',
    scientificPurpose: 'Study planetary interiors, magnetic environments, and solar wind.',
    mass: 4,
    power: 5,
  },
  'thermal': {
    label: 'Thermal Sensor',
    icon: '🌡️',
    description: 'Measures surface and atmospheric temperature variations.',
    scientificPurpose: 'Map heat distribution, study thermal inertia, detect volcanic activity.',
    mass: 6,
    power: 8,
  },
  'atmospheric': {
    label: 'Atmospheric Sensor',
    icon: '💨',
    description: 'Measures pressure, composition, and dynamics of atmospheres.',
    scientificPurpose: 'Characterize atmospheric layers, weather patterns, and chemical cycles.',
    mass: 10,
    power: 12,
  },
  'radiation': {
    label: 'Radiation Detector',
    icon: '☢️',
    description: 'Measures particle radiation and high-energy environments.',
    scientificPurpose: 'Characterize radiation belts, solar particle events, and habitability.',
    mass: 5,
    power: 6,
  },
  'seismometer': {
    label: 'Seismometer',
    icon: '📈',
    description: 'Detects ground vibrations and seismic activity.',
    scientificPurpose: 'Study planetary interiors through seismic waves, detect impacts.',
    mass: 15,
    power: 10,
  },
  'particle': {
    label: 'Particle Detector',
    icon: '⚛️',
    description: 'Identifies and measures charged and neutral particles.',
    scientificPurpose: 'Study solar wind, plasma environments, and magnetospheric dynamics.',
    mass: 7,
    power: 9,
  },
};

export const PROPULSION_SYSTEMS: Record<Propulsion, {
  label: string;
  icon: string;
  description: string;
  howItWorks: string;
  advantages: string[];
  limitations: string[];
  suitableMissions: string[];
  thrustLevel: number;
  efficiency: number;
}> = {
  'chemical': {
    label: 'Chemical Propulsion',
    icon: '🔥',
    description: 'Burns propellant to produce thrust — the most proven space propulsion method.',
    howItWorks: 'Chemical reactions between fuel and oxidizer release energy, expelling exhaust gases at high velocity.',
    advantages: ['High thrust for rapid maneuvers', 'Proven technology', 'Good for orbital insertion'],
    limitations: ['Low fuel efficiency (Isp)', 'Heavy propellant mass', 'Limited total delta-v'],
    suitableMissions: ['Inner solar system', 'Lunar missions', 'Short-duration missions'],
    thrustLevel: 90,
    efficiency: 45,
  },
  'ion': {
    label: 'Ion Propulsion',
    icon: '⚡',
    description: 'Accelerates ions electrically for highly efficient, continuous low thrust.',
    howItWorks: 'Xenon gas is ionized and accelerated through electric fields, producing very efficient exhaust.',
    advantages: ['Very high fuel efficiency (10x chemical)', 'Long operational life', 'Excellent for deep space'],
    limitations: ['Very low thrust (takes months/years)', 'Requires substantial electrical power', 'Cannot do rapid maneuvers'],
    suitableMissions: ['Asteroid missions', 'Deep space', 'Long-duration missions'],
    thrustLevel: 20,
    efficiency: 90,
  },
  'electric': {
    label: 'Electric Propulsion',
    icon: '🌀',
    description: 'Uses electrical power to accelerate propellant — broader category than ion drives.',
    howItWorks: 'Electromagnetic or electrothermal processes heat and accelerate propellant, offering flexibility.',
    advantages: ['Good efficiency', 'Flexible thrust levels', 'Suitable for various mission types'],
    limitations: ['Power-dependent performance', 'Moderate thrust', 'Complex systems'],
    suitableMissions: ['Orbital maintenance', 'Interplanetary transfers', 'Station-keeping'],
    thrustLevel: 35,
    efficiency: 75,
  },
  'solar-sail': {
    label: 'Solar Sail',
    icon: '🌬️',
    description: 'Uses radiation pressure from sunlight on a large reflective sail for propulsion.',
    howItWorks: 'Photons from the Sun exert a tiny but continuous pressure on a large reflective sail, gradually accelerating the spacecraft.',
    advantages: ['No propellant needed', 'Continuous acceleration', 'Ideal for inner solar system'],
    limitations: ['Weakens with distance from Sun', 'Very low thrust', 'Limited control authority'],
    suitableMissions: ['Near-Sun missions', 'Technology demonstration', 'Earth orbit'],
    thrustLevel: 5,
    efficiency: 100,
  },
};

export const POWER_SYSTEMS: Record<Power, {
  label: string;
  icon: string;
  description: string;
  advantages: string[];
  limitations: string[];
  suitableDestinations: string[];
  powerOutput: number;
}> = {
  'solar': {
    label: 'Solar Panels',
    icon: '☀️',
    description: 'Convert sunlight into electricity using photovoltaic cells.',
    advantages: ['Clean, renewable', 'Well-understood technology', 'Scalable'],
    limitations: ['Power decreases with distance from Sun', 'Ineffective beyond Mars orbit', 'Blocked by dust/eclipse'],
    suitableDestinations: ['Earth orbit', 'Moon', 'Mercury', 'Venus', 'Mars', 'Asteroids (inner belt)'],
    powerOutput: 70,
  },
  'rps': {
    label: 'Radioisotope Power System',
    icon: '⚛️',
    description: 'Converts heat from radioactive decay into electricity — works anywhere in the solar system.',
    advantages: ['Works far from Sun', 'Continuous power day/night', 'Proven for deep space'],
    limitations: ['Limited total power output', 'Requires special safety protocols', 'Finite operational life'],
    suitableDestinations: ['Moon', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Any destination'],
    powerOutput: 85,
  },
  'hybrid': {
    label: 'Hybrid Power',
    icon: '🔋',
    description: 'Combines solar panels with battery storage or RPS for flexible power management.',
    advantages: ['Redundancy', 'Handles eclipses/night periods', 'Flexible for various conditions'],
    limitations: ['Increased mass and complexity', 'Higher development cost', 'More failure points'],
    suitableDestinations: ['Moon', 'Mars', 'Inner solar system', 'Asteroids'],
    powerOutput: 80,
  },
};

export const COMMUNICATION_SYSTEMS: Record<Communication, {
  label: string;
  icon: string;
  description: string;
  dataRate: string;
  maxRange: string;
  advantages: string[];
  limitations: string[];
  suitableDestinations: Destination[];
}> = {
  'low-gain': {
    label: 'Low-Gain Antenna',
    icon: '📻',
    description: 'Omnidirectional antenna for basic communication — works from any orientation.',
    dataRate: 'Low (kilobits/sec)',
    maxRange: 'Earth orbit to Moon',
    advantages: ['Simple', 'Works from any orientation', 'Reliable backup'],
    limitations: ['Very limited data rate', 'Short range', 'Cannot transmit high-volume science data'],
    suitableDestinations: ['earth-orbit', 'moon'],
  },
  'high-gain': {
    label: 'High-Gain Antenna',
    icon: '📡',
    description: 'Directional dish antenna for high-bandwidth communication over long distances.',
    dataRate: 'High (megabits/sec)',
    maxRange: 'Inner to outer solar system',
    advantages: ['High data rate', 'Good range', 'Efficient transmission'],
    limitations: ['Must point precisely at Earth', 'Requires attitude control', 'Signal delay increases with distance'],
    suitableDestinations: ['moon', 'mercury', 'venus', 'mars', 'asteroid', 'earth-orbit'],
  },
  'deep-space': {
    label: 'Deep-Space Communication',
    icon: '🔭',
    description: 'Advanced high-power system for communication across billions of kilometers.',
    dataRate: 'Moderate (kilobits–megabits/sec at extreme range)',
    maxRange: 'Entire solar system',
    advantages: ['Works at any solar system distance', 'Connects to Deep Space Network', 'Redundant systems'],
    limitations: ['Large and heavy', 'High power consumption', 'Extreme signal delays at outer planets'],
    suitableDestinations: ['jupiter', 'saturn', 'uranus', 'neptune', 'mars', 'asteroid', 'moon', 'mercury', 'venus', 'earth-orbit'],
  },
};

// ── Score calculation engine ──────────────────────────────────────────────────
export function calculateMissionScores(mission: MissionState): AnalysisScores {
  const { objective, destination, spacecraft, instruments, propulsion, power, communication } = mission;

  // Scientific Value
  let scientificValue = 0;
  if (instruments.length > 0) {
    const baseScore = Math.min(instruments.length * 12, 80);
    const objectiveBonus = objective === 'search-for-life' || objective === 'planetary-exploration' ? 15 : 5;
    scientificValue = Math.min(baseScore + objectiveBonus, 100);
  }

  // Payload Balance
  let payloadBalance = 50;
  if (spacecraft && instruments.length > 0) {
    const sc = SPACECRAFT_TYPES[spacecraft];
    const totalMass = instruments.reduce((sum, inst) => sum + INSTRUMENTS[inst].mass, 0);
    const ratio = totalMass / sc.payloadCapacity;
    if (ratio <= 0.5) payloadBalance = 90;
    else if (ratio <= 0.8) payloadBalance = 75;
    else if (ratio <= 1.0) payloadBalance = 55;
    else payloadBalance = 20;

    if (instruments.length > sc.maxInstruments) payloadBalance = Math.max(payloadBalance - 30, 10);
  }

  // Power Compatibility
  let powerCompatibility = 50;
  if (power && destination) {
    const dest = DESTINATIONS[destination];
    powerCompatibility = dest.powerSuitability[power];
    // Penalize if instruments are power-hungry and power is RPS (limited output)
    const totalPower = instruments.reduce((sum, inst) => sum + INSTRUMENTS[inst].power, 0);
    if (power === 'rps' && totalPower > 80) powerCompatibility = Math.max(powerCompatibility - 20, 20);
    if (power === 'solar' && ['jupiter', 'saturn', 'uranus', 'neptune'].includes(destination)) {
      powerCompatibility = Math.max(powerCompatibility - 30, 5);
    }
  }

  // Propulsion Suitability
  let propulsionSuitability = 50;
  if (propulsion && destination) {
    const distCat = DESTINATIONS[destination].distanceCategory;
    const propScores: Record<Propulsion, Record<string, number>> = {
      'chemical': { near: 95, inner: 80, outer: 45, deep: 20 },
      'ion': { near: 60, inner: 80, outer: 90, deep: 85 },
      'electric': { near: 75, inner: 80, outer: 70, deep: 60 },
      'solar-sail': { near: 85, inner: 70, outer: 30, deep: 10 },
    };
    propulsionSuitability = propScores[propulsion][distCat] ?? 50;
  }

  // Communication
  let communicationScore = 50;
  if (communication && destination) {
    const distCat = DESTINATIONS[destination].distanceCategory;
    const commScores: Record<Communication, Record<string, number>> = {
      'low-gain': { near: 90, inner: 30, outer: 5, deep: 1 },
      'high-gain': { near: 95, inner: 90, outer: 55, deep: 25 },
      'deep-space': { near: 85, inner: 95, outer: 95, deep: 95 },
    };
    communicationScore = commScores[communication][distCat] ?? 50;
  }

  // Destination Compatibility
  let destinationCompatibility = 50;
  if (spacecraft && destination) {
    const sc = SPACECRAFT_TYPES[spacecraft];
    destinationCompatibility = sc.suitableDestinations.includes(destination) ? 85 : 30;
    if (destination === 'earth-orbit' && spacecraft === 'telescope') destinationCompatibility = 98;
    if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(destination) && spacecraft === 'lander') destinationCompatibility = 5;
  }

  // Mission Complexity (higher = more ambitious/risky)
  let missionComplexity = 50;
  if (instruments.length > 0 && destination && spacecraft) {
    const instrumentCount = instruments.length;
    const distCat = DESTINATIONS[destination].distanceCategory;
    const distScore = { near: 20, inner: 40, outer: 70, deep: 90 }[distCat] ?? 50;
    missionComplexity = Math.min(
      (instrumentCount * 8) + distScore + (spacecraft === 'rover' ? 15 : spacecraft === 'lander' ? 10 : 0),
      100
    );
  }

  return {
    scientificValue: Math.round(scientificValue),
    payloadBalance: Math.round(payloadBalance),
    powerCompatibility: Math.round(powerCompatibility),
    propulsionSuitability: Math.round(propulsionSuitability),
    communication: Math.round(communicationScore),
    destinationCompatibility: Math.round(destinationCompatibility),
    missionComplexity: Math.round(missionComplexity),
  };
}

export function getOverallScore(scores: AnalysisScores): number {
  const weights = {
    scientificValue: 0.2,
    payloadBalance: 0.15,
    powerCompatibility: 0.2,
    propulsionSuitability: 0.2,
    communication: 0.15,
    destinationCompatibility: 0.1,
  };
  return Math.round(
    scores.scientificValue * weights.scientificValue +
    scores.payloadBalance * weights.payloadBalance +
    scores.powerCompatibility * weights.powerCompatibility +
    scores.propulsionSuitability * weights.propulsionSuitability +
    scores.communication * weights.communication +
    scores.destinationCompatibility * weights.destinationCompatibility
  );
}

export type ScenarioType =
  | 'smooth' |'power-challenge' |'comm-interrupted' |'instrument-failure' |'navigation-challenge' |'radiation-challenge' |'propulsion-problem' |'science-breakthrough' |'partial-success' |'mission-failure';

export function determineScenario(mission: MissionState, scores: AnalysisScores): ScenarioType {
  const overall = getOverallScore(scores);

  if (overall < 30) return 'mission-failure';

  const risks: ScenarioType[] = [];

  if (scores.powerCompatibility < 40) risks.push('power-challenge');
  if (scores.communication < 40) risks.push('comm-interrupted');
  if (scores.propulsionSuitability < 40) risks.push('navigation-challenge');
  if (scores.destinationCompatibility < 50) risks.push('radiation-challenge');

  const dest = mission.destination;
  if (dest && ['jupiter', 'saturn'].includes(dest)) risks.push('radiation-challenge');
  if (mission.propulsion === 'chemical' && dest && ['uranus', 'neptune'].includes(dest)) risks.push('propulsion-problem');

  if (scores.scientificValue > 80 && overall > 70) {
    if (Math.random() > 0.6) return 'science-breakthrough';
  }

  if (risks.length === 0) return overall > 75 ? 'smooth' : 'partial-success';
  if (risks.length >= 3) return 'mission-failure';

  // Pick most impactful risk
  const pick = risks[Math.floor(overall / 100 * risks.length) % risks.length];
  if (overall > 60) return pick;
  if (overall > 45) return 'partial-success';
  return pick;
}

export interface MissionResultData {
  type: 'success' | 'success-challenges' | 'partial' | 'failure' | 'breakthrough';
  title: string;
  subtitle: string;
  scenario: ScenarioType;
  objectivesCompleted: string[];
  objectivesMissed: string[];
  eventsEncountered: string[];
  playerDecisionSummary: string;
  lessons: { concept: string; lesson: string; learnHref: string }[];
  dataCollected: string[];
  recommendations: string[];
}

export function generateMissionResult(
  mission: MissionState,
  scores: AnalysisScores,
  scenario: ScenarioType,
  playerDecision: string
): MissionResultData {
  const destLabel = mission.destination ? DESTINATIONS[mission.destination].label : 'Unknown';
  const scLabel = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft].label : 'Spacecraft';
  const objLabel = mission.objective ? OBJECTIVES[mission.objective].label : 'Mission';

  const resultMap: Record<ScenarioType, MissionResultData['type']> = {
    'smooth': 'success',
    'science-breakthrough': 'breakthrough',
    'power-challenge': scores.powerCompatibility > 55 ? 'success-challenges' : 'partial',
    'comm-interrupted': scores.communication > 50 ? 'success-challenges' : 'partial',
    'instrument-failure': 'partial',
    'navigation-challenge': scores.propulsionSuitability > 50 ? 'success-challenges' : 'partial',
    'radiation-challenge': scores.destinationCompatibility > 55 ? 'success-challenges' : 'partial',
    'propulsion-problem': 'partial',
    'partial-success': 'partial',
    'mission-failure': 'failure',
  };

  const type = resultMap[scenario];

  const titleMap: Record<MissionResultData['type'], string> = {
    'success': 'MISSION SUCCESSFUL',
    'success-challenges': 'MISSION SUCCESSFUL — WITH CHALLENGES',
    'partial': 'MISSION PARTIALLY SUCCESSFUL',
    'failure': 'MISSION ENDED EARLY',
    'breakthrough': 'EXTRAORDINARY SCIENTIFIC RESULT',
  };

  const subtitleMap: Record<MissionResultData['type'], string> = {
    'success': `Your ${scLabel} completed its ${objLabel} mission to ${destLabel} successfully.`,
    'success-challenges': `Your mission overcame significant challenges to achieve its primary objectives.`,
    'partial': `Your mission reached ${destLabel} but not all objectives were completed.`,
    'failure': `The mission to ${destLabel} could not be completed due to critical system limitations.`,
    'breakthrough': `Your instruments detected an unexpected and scientifically significant observation.`,
  };

  const completedObjectives = type === 'failure' ? [] : [
    `${objLabel} data collected from ${destLabel}`,
    ...(mission.instruments.length > 2 ? [`${mission.instruments.length} scientific instruments operated successfully`] : []),
    ...(scores.communication > 60 ? ['Full science data transmitted to Earth'] : []),
  ];

  const missedObjectives = type === 'success' || type === 'breakthrough' ? [] : [
    ...(scores.powerCompatibility < 50 ? ['Complete power budget maintained throughout mission'] : []),
    ...(scores.communication < 50 ? ['Real-time science data downlink'] : []),
    ...(scenario === 'instrument-failure' ? ['All instrument objectives completed'] : []),
  ];

  const lessons: MissionResultData['lessons'] = [];

  if (scores.powerCompatibility < 60) {
    lessons.push({
      concept: 'Power Systems',
      lesson: `You discovered why spacecraft power budgets are critical — especially operating ${['jupiter','saturn','uranus','neptune'].includes(mission.destination ?? '') ? 'far from the Sun where solar power is limited' : 'with high instrument power demands'}.`,
      learnHref: '#power',
    });
  }
  if (scores.communication < 60) {
    lessons.push({
      concept: 'Communication',
      lesson: `You experienced the challenge of communicating across vast distances — signal delays and bandwidth limitations are real mission constraints.`,
      learnHref: '#communication',
    });
  }
  if (scores.payloadBalance < 60) {
    lessons.push({
      concept: 'Mission Trade-offs',
      lesson: `Adding more instruments increases scientific capability but also increases mass and power requirements — every mission requires careful trade-offs.`,
      learnHref: '#trade-offs',
    });
  }
  if (scores.propulsionSuitability < 60) {
    lessons.push({
      concept: 'Propulsion',
      lesson: `Your propulsion choice affected mission performance — ${mission.propulsion === 'chemical' ? 'chemical propulsion works best for shorter missions, while ion drives excel at deep space' : 'matching propulsion to destination distance is a fundamental mission design decision'}.`,
      learnHref: '#propulsion',
    });
  }
  if (lessons.length === 0) {
    lessons.push({
      concept: 'Mission Planning',
      lesson: `Your well-balanced mission design led to a successful outcome — mission success depends on matching all systems to the destination and objectives.`,
      learnHref: '#missions',
    });
  }

  return {
    type,
    title: titleMap[type],
    subtitle: subtitleMap[type],
    scenario,
    objectivesCompleted: completedObjectives,
    objectivesMissed: missedObjectives,
    eventsEncountered: [],
    playerDecisionSummary: playerDecision,
    lessons,
    dataCollected: mission.instruments.map(inst => `${INSTRUMENTS[inst].label} data archived`),
    recommendations: type === 'failure' ? [
      'Review power system compatibility with your destination',
      'Consider a more suitable propulsion system for the distance',
      'Reduce instrument payload to improve mass balance',
    ] : type === 'partial' ? [
      'Upgrade communication system for better data return',
      'Optimize power system for destination conditions',
    ] : [],
  };
}