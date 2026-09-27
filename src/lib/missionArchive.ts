/**
 * missionArchive.ts — In-memory session store (NO persistence).
 *
 * The game is intentionally a one-session experience: every piece of mission
 * state lives in module-level variables for the lifetime of the current page
 * load and is discarded the moment the browser reloads. There is deliberately
 * no localStorage, sessionStorage, cookie, IndexedDB, URL-parameter or backend
 * persistence anywhere in this module — refreshing the browser gives a
 * brand-new, empty session.
 *
 * Because the state lives in a shared module, every route that imports these
 * helpers (Mission Designer, Simulation, What-If Lab, Replay, Learn) reads the
 * SAME session state while the app is open, and React components re-render when
 * it changes via `subscribeSession` + `getSessionState`.
 */

import type { MissionState, MissionResultData } from './missionData';
import type { MissionDNA } from './missionDNA';
import type { InvestigationNode, EventCategory } from './simulationEngine';

// ── Shared types ─────────────────────────────────────────────────────────────

export interface ScienceStats {
  observationsCompleted: number;
  instrumentsOperated: number;
  majorFindings: number;
  dataReturned: string;
  objectivesCompletedPercent: number;
}

export interface MissionRecord {
  id: string;
  completedAt: number;
  mission: MissionState;
  result: MissionResultData;
  dna: MissionDNA;
  scienceStats: ScienceStats;
  /** Milestone timeline snapshot for the replay comparison view. */
  timeline: { label: string; status: 'ok' | 'warn' | 'bad' }[];
  /** The single decision that changed the outcome (if any). */
  keyDecision: string;
}

export interface LearnedLesson {
  id: string;
  missionName: string;
  concept: string;
  lesson: string;
  learnHref: string;
  earnedAt: number;
}

/** Everything needed to re-render the current session's result screen. */
export interface MissionResultSnapshot {
  mission: MissionState;
  result: MissionResultData;
  science: ScienceStats | null;
  investigation: InvestigationNode | null;
  events: { category: EventCategory; title: string }[];
}

// ── Session state (module memory only) ───────────────────────────────────────

interface SessionState {
  /** The mission currently being designed / awaiting simulation. */
  activeMission: MissionState | null;
  /** Missions completed during this browser session (newest first). */
  completedMissions: MissionRecord[];
  /** Lessons earned during this browser session. */
  learnedLessons: LearnedLesson[];
  /** The result of the most recent completed run in this session. */
  missionResult: MissionResultSnapshot | null;
}

let session: SessionState = {
  activeMission: null,
  completedMissions: [],
  learnedLessons: [],
  missionResult: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to session changes (used by React via useSyncExternalStore). */
export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reference-stable snapshot of the whole session. Returns the same object
 * until a mutation replaces it, which is required by useSyncExternalStore.
 */
export function getSessionState(): SessionState {
  return session;
}

function setSession(patch: Partial<SessionState>): void {
  session = { ...session, ...patch };
  listeners.forEach(listener => listener());
}

// ── In-progress mission (designer draft) ─────────────────────────────────────

export function saveActiveMission(mission: MissionState): void {
  // Editing/creating a draft is a new mission, so any previous result no
  // longer belongs to the active state.
  setSession({ activeMission: { ...mission }, missionResult: null });
}

export function loadActiveMission(): MissionState | null {
  return session.activeMission ? { ...session.activeMission } : null;
}

export function clearActiveMission(): void {
  if (session.activeMission === null) return;
  setSession({ activeMission: null });
}

// ── Current mission result (session only) ────────────────────────────────────

export function saveMissionResult(snapshot: MissionResultSnapshot): void {
  setSession({ missionResult: snapshot });
}

export function loadMissionResult(): MissionResultSnapshot | null {
  return session.missionResult;
}

export function clearMissionResult(): void {
  if (session.missionResult === null) return;
  setSession({ missionResult: null });
}

// ── Completed mission records (session only) ─────────────────────────────────

export function saveCompletedMission(record: MissionRecord): void {
  // Keep the 12 most recent missions for this session.
  setSession({ completedMissions: [record, ...session.completedMissions].slice(0, 12) });
}

export function loadCompletedMissions(): MissionRecord[] {
  return session.completedMissions;
}

export function loadMissionRecord(id: string): MissionRecord | null {
  return session.completedMissions.find(r => r.id === id) ?? null;
}

/** Most recently completed mission (records are stored newest-first). */
export function loadLatestCompletedMission(): MissionRecord | null {
  return session.completedMissions[0] ?? null;
}

// ── Lessons learned (session only) ───────────────────────────────────────────

export function saveLearnedLessons(
  lessons: MissionRecord['result']['lessons'],
  missionName: string,
): void {
  const earnedAt = Date.now();
  const newOnes: LearnedLesson[] = lessons.map((lesson, i) => ({
    id: `${earnedAt}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    missionName,
    concept: lesson.concept,
    lesson: lesson.lesson,
    learnHref: lesson.learnHref,
    earnedAt,
  }));
  setSession({ learnedLessons: [...newOnes, ...session.learnedLessons].slice(0, 30) });
}

export function loadLearnedLessons(): LearnedLesson[] {
  return session.learnedLessons;
}

// ── Explicit full reset ──────────────────────────────────────────────────────

export function clearAllData(): void {
  setSession({
    activeMission: null,
    completedMissions: [],
    learnedLessons: [],
    missionResult: null,
  });
}
