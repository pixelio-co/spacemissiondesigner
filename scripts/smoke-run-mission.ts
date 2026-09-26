/**
 * Headless smoke test for the simulation engine.
 * Run with: bun scripts/smoke-run-mission.ts
 * Not part of the app bundle — dev tooling only.
 */
import { runMission } from '../src/lib/simulationEngine';
import type { MissionState, MissionObjective, Destination, SpacecraftType, Instrument, Propulsion, Power, Communication } from '../src/lib/missionData';

const objectives: MissionObjective[] = ['planetary-exploration', 'lunar-exploration', 'asteroid-exploration', 'earth-observation', 'climate-research', 'space-weather', 'search-for-life', 'astrophysics', 'technology-demo'];
const destinations: Destination[] = ['earth-orbit', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'asteroid'];
const spacecraft: SpacecraftType[] = ['orbiter', 'lander', 'rover', 'flyby', 'telescope', 'cubesat'];
const instruments: Instrument[] = ['camera', 'spectrometer', 'radar', 'magnetometer', 'thermal', 'atmospheric', 'radiation', 'seismometer', 'particle'];
const propulsions: Propulsion[] = ['chemical', 'ion', 'electric', 'solar-sail'];
const powers: Power[] = ['solar', 'rps', 'hybrid'];
const comms: Communication[] = ['low-gain', 'high-gain', 'deep-space'];

let runs = 0;
const errors: string[] = [];

// Test every destination × spacecraft × propulsion × power × comm with 3 instruments,
// plus edge cases (no instruments, all instruments).
for (const dest of destinations) {
  for (const sc of spacecraft) {
    for (const prop of propulsions) {
      for (const power of powers) {
        for (const comm of comms) {
          const mission: MissionState = {
            missionName: `Test ${dest}`,
            objective: objectives[runs % objectives.length],
            destination: dest,
            spacecraft: sc,
            instruments: [instruments[runs % 9], instruments[(runs + 3) % 9], instruments[(runs + 6) % 9]],
            propulsion: prop,
            power,
            communication: comm,
            currentStage: 9,
            completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8],
          };
          try {
            const res = runMission(mission);
            runs++;
            if (!res.record.outcomes?.title) errors.push(`missing outcome title for ${dest}/${sc}/${prop}/${power}/${comm}`);
            if (!res.record.commDelayInfo) errors.push(`missing commDelayInfo for ${dest}/${sc}`);
            if (res.record.scienceReturn == null) errors.push(`missing scienceReturn for ${dest}/${sc}`);
          } catch (e) {
            errors.push(`CRASH ${dest}/${sc}/${prop}/${power}/${comm}: ${(e as Error).message}`);
          }
        }
      }
    }
  }
}

// Edge cases: no instruments, all instruments, minimal mission.
const edgeCases: MissionState[] = [
  { missionName: 'Empty', objective: 'astrophysics', destination: 'earth-orbit', spacecraft: 'cubesat', instruments: [], propulsion: 'chemical', power: 'solar', communication: 'low-gain', currentStage: 9, completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { missionName: 'All instruments', objective: 'search-for-life', destination: 'jupiter', spacecraft: 'orbiter', instruments: [...instruments], propulsion: 'ion', power: 'rps', communication: 'deep-space', currentStage: 9, completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { missionName: 'Bare', objective: null, destination: null, spacecraft: null, instruments: [], propulsion: null, power: null, communication: null, currentStage: 9, completedStages: [] },
];
for (const m of edgeCases) {
  try {
    runMission(m);
    runs++;
  } catch (e) {
    errors.push(`EDGE CRASH ${m.missionName}: ${(e as Error).message}`);
  }
}

console.log(`Completed ${runs} runs.`);
if (errors.length > 0) {
  console.log(`ERRORS (${errors.length}):`);
  errors.slice(0, 20).forEach(e => console.log(' - ' + e));
  process.exit(1);
} else {
  console.log('All runs OK — no engine crashes.');
}
