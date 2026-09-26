/**
 * One-off verification (dev tooling): badly matched designs must NOT auto-succeed.
 */
import { runMission } from '../src/lib/simulationEngine';
import type { MissionState } from '../src/lib/missionData';

const cases: { name: string; mission: MissionState }[] = [
  {
    name: 'Solar at Neptune, low-gain, chemical (very bad)',
    mission: { missionName: 'Neptune Solar', objective: 'planetary-exploration', destination: 'neptune', spacecraft: 'orbiter', instruments: ['camera', 'spectrometer', 'radar', 'magnetometer'], propulsion: 'chemical', power: 'solar', communication: 'low-gain', currentStage: 9, completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  },
  {
    name: 'CubeSat overloaded, low-gain to Saturn',
    mission: { missionName: 'Tiny Saturn', objective: 'space-weather', destination: 'saturn', spacecraft: 'cubesat', instruments: ['camera', 'spectrometer', 'radar', 'magnetometer', 'thermal', 'atmospheric'], propulsion: 'chemical', power: 'solar', communication: 'low-gain', currentStage: 9, completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  },
  {
    name: 'Seismometer from a flyby at Mercury (nonsensical)',
    mission: { missionName: 'Flyby Seismology', objective: 'lunar-exploration', destination: 'mercury', spacecraft: 'flyby', instruments: ['seismometer'], propulsion: 'solar-sail', power: 'solar', communication: 'low-gain', currentStage: 9, completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  },
  {
    name: 'Solid Moon lander (good design — should succeed)',
    mission: { missionName: 'Moon Lander', objective: 'lunar-exploration', destination: 'moon', spacecraft: 'lander', instruments: ['camera', 'seismometer'], propulsion: 'chemical', power: 'hybrid', communication: 'high-gain', currentStage: 9, completedStages: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  },
];

for (const c of cases) {
  // Run the same design across several seeds to see outcome variety for it.
  const outcomes: Record<string, number> = {};
  for (let seed = 1; seed <= 40; seed++) {
    const r = runMission(c.mission, { seed });
    outcomes[r.record.outcomes.type] = (outcomes[r.record.outcomes.type] ?? 0) + 1;
  }
  console.log(`${c.name}:`, outcomes);
}
