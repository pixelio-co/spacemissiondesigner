/**
 * SIM TYPES — shared constants and types for the simulation engine and UI.
 */

import type { MissionState, ScenarioType } from './missionData';
import { DESTINATIONS } from './missionData';

export interface SystemStatus {
  power: number;
  communication: number;
  propulsion: number;
  instruments: number;
  navigation: number;
  radiation: number;
}

// ── Autonomy options (communication-gap behaviors) ──────────────────────────

export interface AutonomyOptionDef {
  id: 'continue-science' | 'safe-mode' | 'wait';
  label: string;
  shortLabel: string;
  description: string;
  tradeOffHint: string;
}

export const AUTONOMY_OPTIONS: AutonomyOptionDef[] = [
  {
    id: 'continue-science',
    label: 'Continue planned science',
    shortLabel: 'Continue Science',
    description: 'Keep observing per the pre-planned sequence while Earth is out of contact. Data stores onboard.',
    tradeOffHint: '↑ Potential science return · ↑ Power consumption',
  },
  {
    id: 'safe-mode',
    label: 'Enter safe mode',
    shortLabel: 'Safe Mode',
    description: 'Power down to essential systems only. Hardware is protected; science pauses until contact resumes.',
    tradeOffHint: '↑ Protects resources · ↓ Reduced science operations',
  },
  {
    id: 'wait',
    label: 'Wait for communication',
    shortLabel: 'Wait for Comms',
    description: 'Hold attitude and wait for the next contact window. The most conservative option.',
    tradeOffHint: '↑ Conservative · ↓ Mission time and science opportunity',
  },
];

// ── Scenario definitions ─────────────────────────────────────────────────────

export interface DecisionOptionDef {
  label: string;
  consequence: string;
  effects: Partial<SystemStatus>;
  educationalWhy: string;
}

export interface ScenarioDef {
  title: string;
  logType: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  message: (destLabel: string) => string;
  /** Why this event happened, framed educationally and config-aware. */
  educationalCause: (mission: MissionState, destLabel: string) => string;
  systemEffect: Partial<SystemStatus>;
  decisionOptions: DecisionOptionDef[];
  /** Which communication behavior the event enables (comm interruptions only). */
  isCommEvent?: boolean;
}

export const SCENARIO_DEFINITIONS: Record<ScenarioType, ScenarioDef> = {
  'smooth': {
    title: 'All systems nominal',
    logType: 'success',
    message: () => 'All systems nominal — mission proceeding as planned.',
    educationalCause: () => 'Your design matched its environment with margin to spare.',
    systemEffect: {},
    decisionOptions: [],
  },
  'science-breakthrough': {
    title: 'Unexpected observation',
    logType: 'success',
    message: () => 'Instruments detect an anomalous signature of high scientific interest.',
    educationalCause: () => 'Capable instruments in a rich environment occasionally produce standout results.',
    systemEffect: { instruments: 8 },
    decisionOptions: [],
  },
  'power-challenge': {
    title: 'Power system warning',
    logType: 'warning',
    message: (dest) => `Power generation is below the level needed for all active systems near ${dest}.`,
    educationalCause: (mission, dest) => {
      const parts: string[] = [];
      if (mission.power === 'solar' && ['jupiter', 'saturn', 'uranus', 'neptune'].includes(mission.destination ?? '')) {
        parts.push('solar output falls off dramatically at this distance (inverse-square law)');
      }
      if ((mission.instruments?.length ?? 0) >= 4) parts.push('multiple simultaneous instrument power draws');
      parts.push(`the power system\u2019s match to ${dest} was marginal`);
      return `Caused by ${parts.join(' + ')}.`;
    },
    systemEffect: { power: -30 },
    decisionOptions: [
      {
        label: 'Duty-cycle instruments (science in shifts)',
        consequence: 'Power stabilized. Some science is spread over more time.',
        effects: { power: 20, instruments: -20 },
        educationalWhy: 'Duty-cycling is how real missions ride through power deficits without shutting down completely.',
      },
      {
        label: 'Reduce communication activity',
        consequence: 'Power recovered. Data downlink rate reduced.',
        effects: { power: 15, communication: -20 },
        educationalWhy: 'Transmitters are major power consumers; the trade is power now vs. data speed later.',
      },
      {
        label: 'Continue full operations',
        consequence: 'Power continues to degrade — the mission is drawing on reserves.',
        effects: { power: -18 },
        educationalWhy: 'Running through deficits can work, but it converts a warning into a limit. Real missions protect reserves.',
      },
    ],
  },
  'comm-interrupted': {
    title: 'Communication link interrupted',
    logType: 'warning',
    message: (dest) => `Contact with Earth lost during ${dest} operations. The spacecraft is operating autonomously.`,
    educationalCause: (mission, dest) => {
      if (mission.communication === 'low-gain' && mission.destination !== 'earth-orbit') {
        return 'A low-gain antenna\u2019s power is spread in every direction — at this range the signal is simply too faint.';
      }
      return `Distance and pointing geometry thinned the link margin at ${dest} (${DESTINATIONS[mission.destination ?? 'moon'].communicationDelay} one-way).`;
    },
    systemEffect: { communication: -40 },
    decisionOptions: [
      {
        label: 'Increase antenna power & re-point',
        consequence: 'Link margin improved for the next contact window.',
        effects: { communication: 15, power: -10 },
        educationalWhy: 'Re-pointing spends attitude-control propellant and power to buy signal strength.',
      },
      {
        label: 'Store data and await next pass',
        consequence: 'Data accumulates onboard until the link returns.',
        effects: { instruments: 4 },
        educationalWhy: 'Onboard storage turns blackouts from data loss into data delay — standard practice for orbiters.',
      },
      {
        label: 'Divert power from instruments to the transmitter',
        consequence: 'Link restored faster. Science paused during the recovery.',
        effects: { communication: 20, instruments: -12 },
        educationalWhy: 'The communication link and the science instruments draw from the same budget.',
      },
    ],
    isCommEvent: true,
  },
  'instrument-failure': {
    title: 'Instrument anomaly detected',
    logType: 'danger',
    message: () => 'One scientific instrument has stopped responding. Diagnostics are in progress.',
    educationalCause: (mission) => `${mission.instruments.length} instruments share power, thermal and data systems — complexity raises interaction risks.`,
    systemEffect: { instruments: -25 },
    decisionOptions: [
      {
        label: 'Attempt instrument restart',
        consequence: 'Instrument partially recovered at reduced capability.',
        effects: { instruments: 10, power: -5 },
        educationalWhy: 'Reboots recover many anomalies; real ops teams do this constantly.',
      },
      {
        label: 'Reallocate power to remaining instruments',
        consequence: 'Remaining instruments operate at enhanced capacity.',
        effects: { instruments: 6, power: -6 },
        educationalWhy: 'Rerouting a failed instrument\u2019s share of the budget strengthens the rest of the suite.',
      },
      {
        label: 'Continue with remaining instruments',
        consequence: 'Mission adapts — some objectives are modified.',
        effects: { instruments: -8 },
        educationalWhy: 'Sometimes the best move is accepting a smaller science plan over risking the whole mission.',
      },
    ],
  },
  'navigation-challenge': {
    title: 'Trajectory deviation detected',
    logType: 'warning',
    message: (dest) => `The spacecraft has deviated from its planned trajectory toward ${dest}. A correction maneuver is required.`,
    educationalCause: (mission, dest) => {
      if (mission.propulsion === 'chemical' && ['outer', 'deep'].includes(DESTINATIONS[mission.destination ?? 'mars'].distanceCategory)) {
        return 'Chemical propulsion\u2019s limited efficiency left little delta-v margin for corrections on this long journey.';
      }
      return `Navigation demands near ${dest} exceeded the propulsion system\u2019s comfortable authority.`;
    },
    systemEffect: { navigation: -30 },
    decisionOptions: [
      {
        label: 'Execute full correction burn',
        consequence: 'Trajectory corrected. Propellant reserves reduced.',
        effects: { navigation: 25, propulsion: -20 },
        educationalWhy: 'Propellant spent on corrections is propellant unavailable for arrival — a classic budget trade.',
      },
      {
        label: 'Execute partial correction',
        consequence: 'Partial correction. The approach plan is adjusted.',
        effects: { navigation: 12, propulsion: -8 },
        educationalWhy: 'Real nav teams spread corrections over multiple smaller burns to keep options open.',
      },
      {
        label: 'Accept deviation and adjust the mission plan',
        consequence: 'Destination still reachable; some objectives modified.',
        effects: { navigation: -8 },
        educationalWhy: 'Adapting objectives to reality is a legitimate mission-design skill.',
      },
    ],
  },
  'radiation-challenge': {
    title: 'Radiation levels elevated',
    logType: 'danger',
    message: (dest) => `The spacecraft is entering a high-radiation environment near ${dest}. Electronics are at risk.`,
    educationalCause: (mission, dest) => {
      if (['jupiter', 'saturn'].includes(mission.destination ?? '')) {
        return 'Giant planets host the solar system\u2019s most severe radiation belts — Europa Clipper carries a titanium vault for this reason.';
      }
      return `The ${dest} environment delivers particle doses that stress unshielded electronics.`;
    },
    systemEffect: { radiation: 45, power: -10 },
    decisionOptions: [
      {
        label: 'Activate shielding protocols',
        consequence: 'Systems protected. Power consumption increased.',
        effects: { radiation: -25, power: -12 },
        educationalWhy: 'Shielding works, but its mass and the power to run active protection come from somewhere.',
      },
      {
        label: 'Reduce instrument exposure time',
        consequence: 'Electronics protected. The science window shrank.',
        effects: { radiation: -15, instruments: -12 },
        educationalWhy: 'Protecting detectors from the environment they study is a genuine design tension.',
      },
      {
        label: 'Continue through the radiation zone',
        consequence: 'Maximum science collected. System wear increased.',
        effects: { radiation: 18, instruments: 8, power: -8 },
        educationalWhy: 'High-risk, high-reward: some of planetary science\u2019s biggest finds came from pushing through belts.',
      },
    ],
  },
  'propulsion-problem': {
    title: 'Propulsion anomaly',
    logType: 'danger',
    message: () => 'The propulsion system shows anomalous readings. Thrust performance is below nominal.',
    educationalCause: (mission) => {
      if (mission.propulsion === 'ion' || mission.propulsion === 'electric') {
        return 'Electric propulsion is exquisitely sensitive to power quality — a sagging bus degrades thrust.';
      }
      return 'The propulsion technology was being pushed toward the edge of its efficient envelope.';
    },
    systemEffect: { propulsion: -35 },
    decisionOptions: [
      {
        label: 'Run diagnostics and recalibrate',
        consequence: 'Propulsion partially restored. Time cost accepted.',
        effects: { propulsion: 15 },
        educationalWhy: 'Time is a resource too — diagnosis trades schedule for reliability.',
      },
      {
        label: 'Switch to backup thrusters',
        consequence: 'Reduced thrust capability. The mission continues.',
        effects: { propulsion: 6, navigation: -6 },
        educationalWhy: 'Redundancy is why most spacecraft carry more than one string of thrusters.',
      },
      {
        label: 'Continue on the current trajectory',
        consequence: 'Destination still reachable; correction margins reduced.',
        effects: { propulsion: -10 },
        educationalWhy: 'Accepting degraded capability is sometimes better than risking a bigger failure.',
      },
    ],
  },
  'partial-success': {
    title: 'Operational constraints',
    logType: 'warning',
    message: (dest) => `Multiple systems near their limits near ${dest} — objectives are being reprioritized.`,
    educationalCause: () => 'Several subsystems were sized too close to their limits, leaving no margin for reality.',
    systemEffect: { instruments: -12, communication: -10 },
    decisionOptions: [
      {
        label: 'Prioritize the highest-value objectives',
        consequence: 'Core science protected; secondary objectives deferred.',
        effects: { instruments: 6, power: -6 },
        educationalWhy: 'Real missions keep a ranked objective list for exactly this reason.',
      },
      {
        label: 'Spread operations over a longer period',
        consequence: 'Lower peak demand; slower data return.',
        effects: { power: 8, instruments: -6 },
        educationalWhy: 'Time is a resource: stretching the plan reduces peak stress on every system.',
      },
      {
        label: 'Push the original plan',
        consequence: 'All objectives attempted. Margins nearly exhausted.',
        effects: { instruments: 10, power: -14 },
        educationalWhy: 'Sometimes it works — but the mission now has no reserves for surprises.',
      },
    ],
  },
  'mission-failure': {
    title: 'Cascade failure',
    logType: 'danger',
    message: (dest) => `Multiple system failures detected — mission viability near ${dest} is compromised.`,
    educationalCause: () => 'Compounding design mismatches: several subsystems lacked margin at once.',
    systemEffect: { power: -50, propulsion: -40, communication: -35 },
    decisionOptions: [
      {
        label: 'Safe the spacecraft and preserve data',
        consequence: 'Remaining systems protected. Science ends.',
        effects: { power: 10, instruments: -15 },
        educationalWhy: 'Even in failure, protecting the data preserves the mission\u2019s remaining value.',
      },
      {
        label: 'Attempt emergency recovery procedures',
        consequence: 'A daring attempt to stabilize the spacecraft.',
        effects: { power: -10, communication: 8, propulsion: 6 },
        educationalWhy: 'Recovery attempts sometimes succeed (SOHO), sometimes not (Mars Polar Lander) — that is why they are called attempts.',
      },
    ],
  },
};

export const FAILURE_POINT_CONFIG = {
  /** Progress beyond which rescue is impossible. */
  pointOfNoReturn: 60,
};
