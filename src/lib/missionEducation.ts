/**
 * missionEducation.ts — Educational content for the Mission Designer stages.
 *
 * Each major choice gets: what it does, why it matters, and the trade-off.
 * Content is concise by design; the UI shows it via "Why does this matter?"
 * expandable panels so the interface stays uncluttered.
 */

import type { Instrument, Power, Propulsion, Communication } from './missionData';

export interface ChoiceEducation {
  whatItDoes: string;
  whyItMatters: string;
  tradeOff: string;
}

export const STAGE_EDUCATION: Record<string, ChoiceEducation> = {
  spacecraft: {
    whatItDoes:
      'The spacecraft architecture decides where your instruments can go and what vantage points they get: orbit, surface, flyby, or deep space.',
    whyItMatters:
      'An orbiter studies a world for years from above; a rover touches and traverses it; a flyby gets one precious pass. Each answers different questions.',
    tradeOff:
      'Surface and mobile platforms get in-situ data but carry entry/descent/landing risk and power stress; orbiters are safer but more distant from their targets.',
  },
  destination: {
    whatItDoes:
      'The destination sets the physical environment your spacecraft must survive: sunlight, temperature, radiation, gravity, and light-time to Earth.',
    whyItMatters:
      'Distance from the Sun controls solar power; distance from Earth controls communication delay and data rates. These are real physical constraints no engineering can waive.',
    tradeOff:
      'Near targets are easier to reach and talk to; distant targets offer unique science at the cost of power, time, and autonomy.',
  },
  objective: {
    whatItDoes:
      'The objective defines what “success” means for your mission — what questions it exists to answer.',
    whyItMatters:
      'Every other choice (spacecraft, instruments, destination) is judged against the objective. Real missions start here too: the Decadal Survey ranks science questions first, hardware second.',
    tradeOff:
      'Ambitious objectives (search for life) demand specialized instruments and more risk tolerance; focused objectives can fly smaller, cheaper spacecraft.',
  },
  instruments: {
    whatItDoes:
      'Instruments are the spacecraft’s senses. Each one turns a physical phenomenon — light, heat, magnetism, vibration — into data we can study.',
    whyItMatters:
      'Instruments decide what your mission can discover. A camera can image surfaces; only a spectrometer can identify composition; only a seismometer can feel quakes.',
    tradeOff:
      'Every instrument adds mass, power draw, cost, and complexity. Real missions famously debate “more instruments vs more reliability” — Cassini carried 12; a Mars Scout mission might carry 4.',
  },
  propulsion: {
    whatItDoes:
      'Propulsion changes the spacecraft’s speed and direction: escaping Earth, cruising, correcting course, entering orbit, or landing.',
    whyItMatters:
      'The propulsion system sets which destinations are reachable and how fast. Ion drives trade tiny thrust for extreme efficiency; chemical rockets do the opposite.',
    tradeOff:
      'High thrust (chemical) burns propellant fast but moves you quickly; high efficiency (ion/sail) saves propellant but takes months or years. Distance is the deciding factor.',
  },
  power: {
    whatItDoes:
      'The power system converts energy — sunlight, radioactive decay, or both — into electricity for every other subsystem.',
    whyItMatters:
      'Power is the lifeblood of the mission: instruments, communication, heaters, and computers all draw from it. Where the Sun is weak, only nuclear (RPS) keeps working.',
    tradeOff:
      'Solar is clean and scalable but dies with distance and dust; RPS works anywhere but delivers limited total power and needs special handling; hybrid adds redundancy but also mass and failure points.',
  },
  communication: {
    whatItDoes:
      'The communication system sends commands up and science data down, via radio (and increasingly laser) links to Earth.',
    whyItMatters:
      'A spacecraft that cannot talk to Earth cannot deliver its discoveries. Data rate decides how much of your science actually arrives.',
    tradeOff:
      'Bigger antennas and more power buy data rate but cost mass and energy. At long light-times, no link is “real-time” — autonomy fills the gap.',
  },
};

export const INSTRUMENT_EDUCATION: Record<Instrument, ChoiceEducation> = {
  camera: {
    whatItDoes: 'Captures visible-light images of surfaces, clouds, and phenomena.',
    whyItMatters: 'Imaging is how most missions “see” their target — morphology, geology, weather, and context for every other instrument.',
    tradeOff: 'Relatively low power, but data volume is huge and needs strong downlink.',
  },
  spectrometer: {
    whatItDoes: 'Splits light (or particles) into spectra to identify chemical composition.',
    whyItMatters: 'Composition is central to science: minerals, ices, organics, atmospheric gases.',
    tradeOff: 'Higher power draw; spectral data is complex to interpret.',
  },
  radar: {
    whatItDoes: 'Bounces radio waves off/below a surface to map structure hidden from cameras.',
    whyItMatters: 'Sees through clouds, ice, and dry regolith — subsurface oceans, ice deposits, buried terrain.',
    tradeOff: 'One of the heaviest, most power-hungry instruments.',
  },
  magnetometer: {
    whatItDoes: 'Measures magnetic field strength and direction.',
    whyItMatters: 'Magnetic fields reveal planetary interiors, radiation shielding, and solar-wind interaction.',
    tradeOff: 'Tiny mass/power, but must sit on a boom away from the spacecraft’s own magnetic noise.',
  },
  thermal: {
    whatItDoes: 'Measures infrared emission to map temperature and thermal inertia.',
    whyItMatters: 'Temperature maps reveal surface materials, heat flow, and volcanic activity.',
    tradeOff: 'Needs thermal isolation from the spacecraft’s own heat.',
  },
  atmospheric: {
    whatItDoes: 'Measures pressure, temperature, composition, and winds of an atmosphere.',
    whyItMatters: 'Atmospheres drive weather, climate, and habitability questions.',
    tradeOff: 'Only meaningful for targets with atmospheres (useless at the Moon or most asteroids).',
  },
  radiation: {
    whatItDoes: 'Counts high-energy particles and measures radiation dose.',
    whyItMatters: 'Radiation shapes mission safety and habitability — and protects your own electronics.',
    tradeOff: 'Low mass/power, but readings near gas giants can saturate the detector.',
  },
  seismometer: {
    whatItDoes: 'Detects ground motion from quakes and impacts.',
    whyItMatters: 'Seismic waves are our best probe of a planet’s interior structure.',
    tradeOff: 'Needs surface contact and extremely quiet placement; useless on an orbiter.',
  },
  particle: {
    whatItDoes: 'Identifies and counts charged and neutral particles (plasma, solar wind).',
    whyItMatters: 'Particle data reveals magnetospheres, auroras, and space-weather environments.',
    tradeOff: 'Low power, but interpretation is statistical and data-heavy.',
  },
};

export const POWER_EDUCATION: Record<Power, ChoiceEducation> = {
  solar: {
    whatItDoes: 'Photovoltaic panels convert sunlight directly into electricity.',
    whyItMatters: 'It is the default for inner-system missions; even Jupiter-class Juno made it work with giant arrays.',
    tradeOff: 'Output falls with the square of distance — at Saturn it is ~1% of Earth levels. Dust and eclipses interrupt it.',
  },
  rps: {
    whatItDoes: 'Radioisotope power converts heat from plutonium-238 decay into electricity.',
    whyItMatters: 'It powers missions where sunlight fails: outer planets, dusty Mars winters, lunar nights.',
    tradeOff: 'Limited total output (hundreds of watts), finite life, special safety protocols.',
  },
  hybrid: {
    whatItDoes: 'Combines solar with batteries or an RPS unit for redundancy.',
    whyItMatters: 'Handles eclipses, nights, and dust gracefully — a good match for challenging near targets.',
    tradeOff: 'More mass, more complexity, more failure points.',
  },
};

export const PROPULSION_EDUCATION: Record<Propulsion, ChoiceEducation> = {
  chemical: {
    whatItDoes: 'Burns propellant for high thrust in short burns.',
    whyItMatters: 'Proven and fast — it gets you to orbit insertion and landing burns on schedule.',
    tradeOff: 'Fuel-hungry: the delta-v needed for outer planets quickly exceeds what a chemical stage can carry.',
  },
  ion: {
    whatItDoes: 'Electrically accelerates xenon ions for tiny thrust applied for months or years.',
    whyItMatters: '10× the efficiency of chemical — this is how Dawn visited two asteroids with one spacecraft.',
    tradeOff: 'Almost no thrust: you cannot rush; and it needs a lot of electrical power.',
  },
  electric: {
    whatItDoes: 'Broader electric-propulsion family (Hall thrusters, electrothermal) with moderate thrust and good efficiency.',
    whyItMatters: 'A flexible middle ground used on many modern satellites and deep-space proposals.',
    tradeOff: 'Performance depends on available power; more complex than a simple chemical stage.',
  },
  'solar-sail': {
    whatItDoes: 'Uses sunlight pressure on a large reflective film for continuous ultra-low thrust.',
    whyItMatters: 'No propellant at all — the Sun is the engine. Ideal for near-Sun and station-keeping work.',
    tradeOff: 'Effectiveness fades beyond Mars; deployment is risky; control authority is tiny.',
  },
};

export const COMMUNICATION_EDUCATION: Record<Communication, ChoiceEducation> = {
  'low-gain': {
    whatItDoes: 'Omnidirectional antenna that works in any orientation.',
    whyItMatters: 'Perfect as a emergency/low-rate lifeline — every spacecraft carries one.',
    tradeOff: 'Kilobits per second: science data does not fit through it beyond lunar distances.',
  },
  'high-gain': {
    whatItDoes: 'Directional dish concentrating signal toward Earth.',
    whyItMatters: 'The workhorse of interplanetary science return — megabit-class data rates.',
    tradeOff: 'Must point precisely at Earth; weakens at outer-planet distances.',
  },
  'deep-space': {
    whatItDoes: 'DSN-class high-power system with redundancy for the entire solar system.',
    whyItMatters: 'The only class that stays viable at Uranus/Neptune distances.',
    tradeOff: 'Heavy, power-hungry, and still limited by light-time, not hardware.',
  },
};

export const OBJECTIVE_EDUCATION: Record<string, ChoiceEducation> = {
  'planetary-exploration': {
    whatItDoes: 'Studies a planet’s surface, atmosphere, and geology systematically.',
    whyItMatters: 'Comparative planetology tells us how Earth works by seeing how other worlds differ.',
    tradeOff: 'Broad goal — usually needs orbiter + multiple instruments for real coverage.',
  },
  'lunar-exploration': {
    whatItDoes: 'Investigates the Moon’s geology, resources, and environment.',
    whyItMatters: 'The Moon is the proving ground for deep-space operations and resource use.',
    tradeOff: 'The two-week lunar night stresses any solar-powered design.',
  },
  'asteroid-exploration': {
    whatItDoes: 'Characterizes primitive bodies that preserve early-solar-system material.',
    whyItMatters: 'Asteroids are time capsules — and planetary-defense targets.',
    tradeOff: 'Microgravity makes “landing” unlike any other landing.',
  },
  'earth-observation': {
    whatItDoes: 'Monitors Earth’s surface, oceans, ice, and atmosphere from orbit.',
    whyItMatters: 'Earth science underpins climate policy and disaster response.',
    tradeOff: 'Communication is easy; the challenge is calibration and data volume.',
  },
  'climate-research': {
    whatItDoes: 'Studies climate systems, greenhouse gases, and energy balance.',
    whyItMatters: 'Improves models that project our planet’s future.',
    tradeOff: 'Needs long-duration, stable, calibrated observations — not snapshots.',
  },
  'space-weather': {
    whatItDoes: 'Watches solar activity and its effects on the space environment.',
    whyItMatters: 'Solar storms threaten satellites, astronauts, and power grids.',
    tradeOff: 'Often needs warning time — which means positions far from Earth.',
  },
  'search-for-life': {
    whatItDoes: 'Searches for biosignatures and habitable conditions.',
    whyItMatters: 'It is one of humanity’s oldest questions, asked with modern instruments.',
    tradeOff: 'Requires the most specialized instrument suite and strict contamination control.',
  },
  astrophysics: {
    whatItDoes: 'Observes stars, galaxies, and fundamental physics from space.',
    whyItMatters: 'Space telescopes see wavelengths the atmosphere blocks.',
    tradeOff: 'Target is usually “everywhere”, so vantage point and stability matter more than destination.',
  },
  'technology-demo': {
    whatItDoes: 'Proves new technologies in the space environment.',
    whyItMatters: 'Every later mission inherits these de-risked capabilities.',
    tradeOff: 'Science is secondary; risk acceptance is deliberately higher.',
  },
};
