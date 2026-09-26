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
const outcomeCounts: Record<string, number> = {};

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
            const t = res.record.outcomes.type;
            outcomeCounts[t] = (outcomeCounts[t] ?? 0) + 1;
            if (!res.record.outcomes?.title) errors.push(`missing outcome title for ${dest}/${sc}/${prop}/${power}/${comm}`);
            if (!res.record.commDelayInfo) errors.push(`missing commDelayInfo for ${dest}/${sc}`);
            if (res.record.scienceReturn == null) errors.push(`missing scienceReturn for ${dest}/${sc}`);
            if (typeof res.record.damageTaken !== 'number') errors.push(`missing damageTaken for ${dest}/${sc}`);
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
    const res = runMission(m);
    runs++;
    const t = res.record.outcomes.type;
    outcomeCounts[t] = (outcomeCounts[t] ?? 0) + 1;
  } catch (e) {
    errors.push(`EDGE CRASH ${m.missionName}: ${(e as Error).message}`);
  }
}

// Replay pre-scripting: the same decisions must reproduce the same record.
try {
  const base: MissionState = {
    missionName: 'Replay Check', objective: 'search-for-life', destination: 'jupiter',
    spacecraft: 'orbiter', instruments: ['camera', 'spectrometer', 'radar'], propulsion: 'ion',
    power: 'rps', communication: 'deep-space', currentStage: 9, completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  };
  const mission = base;
  const first = runMission(mission);
  const fixed: Record<string, number> = {};
  for (const dp of first.decisionPoints) fixed[dp.id] = 0;
  const scripted = runMission(mission, { fixedDecisions: fixed, autonomy: 'continue-science' });
  const scripted2 = runMission(mission, { fixedDecisions: fixed, autonomy: 'continue-science' });
  if (JSON.stringify(scripted.record) !== JSON.stringify(scripted2.record)) {
    errors.push('REPLAY: identical options did not reproduce identical records');
  }
  if (scripted.record.events.length !== first.record.events.length) {
    errors.push('REPLAY: scripted run produced a different event count than the open run');
  }
  runs += 1;
} catch (e) {
  errors.push(`REPLAY CRASH: ${(e as Error).message}`);
}

console.log(`Completed ${runs} runs.`);
console.log('Outcome distribution:', outcomeCounts);
if (outcomeCounts['success'] !== undefined && outcomeCounts['success'] === runs) {
  errors.push('VARIETY: every mission ended as a clean success — outcome tiering is not engaging');
}
if (errors.length > 0) {
  console.log(`ERRORS (${errors.length}):`);
  errors.slice(0, 20).forEach(e => console.log(' - ' + e));
  process.exit(1);
} else {
  console.log('All runs OK — no engine crashes, outcome variety present.');
}
