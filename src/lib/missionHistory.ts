'use client';

/**
 * MISSION RECORD STORAGE
 * Persists completed mission records in localStorage so the user can:
 *  - Review past missions from the Mission Review page
 *  - Replay a past mission with one changed decision
 *  - Compare original vs replay outcomes
 *
 * All access is SSR-safe: reads/writes happen only in the browser and are
 * wrapped in try/catch so private-mode or blocked storage never breaks the app.
 */

import type { MissionState } from './missionData';
import type { SimulationRecord } from './simulationEngine';

const ACTIVE_MISSION_KEY = 'smd-active-mission';
const RECORDS_KEY = 'smd-mission-records-v1';
const MAX_RECORDS = 12;

export interface StoredMissionRecord {
  id: string;
  completedAt: string; // ISO date
  mission: MissionState;
  record: SimulationRecord;
}

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode / quota) — non-fatal.
  }
}

// ── Active mission persistence (survives navigation between pages) ─────────

export function saveActiveMission(mission: MissionState): void {
  safeSet(ACTIVE_MISSION_KEY, JSON.stringify(mission));
}

export function loadActiveMission(): MissionState | null {
  const raw = safeGet(ACTIVE_MISSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MissionState;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveMission(): void {
  safeSet(ACTIVE_MISSION_KEY, '');
}

// ── Completed mission records ───────────────────────────────────────────────

export function loadMissionRecords(): StoredMissionRecord[] {
  const raw = safeGet(RECORDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredMissionRecord[];
  } catch {
    return [];
  }
}

export function saveMissionRecord(mission: MissionState, record: SimulationRecord): StoredMissionRecord {
  const entry: StoredMissionRecord = {
    id: `rec-${Date.now()}-${record.seed}`,
    completedAt: new Date().toISOString(),
    mission,
    record,
  };
  const existing = loadMissionRecords();
  const next = [entry, ...existing].slice(0, MAX_RECORDS);
  safeSet(RECORDS_KEY, JSON.stringify(next));
  return entry;
}

export function clearMissionRecords(): void {
  safeSet(RECORDS_KEY, '[]');
}

/** Find a record by id (used by the replay flow). */
export function getMissionRecord(id: string): StoredMissionRecord | null {
  return loadMissionRecords().find(r => r.id === id) ?? null;
}
