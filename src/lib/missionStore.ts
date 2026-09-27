'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type {
  MissionState,
  MissionObjective,
  Destination,
  SpacecraftType,
  Instrument,
  Propulsion,
  Power,
  Communication,
} from './missionData';

import {
  saveActiveMission,
  clearActiveMission,
  clearMissionResult,
  subscribeSession,
  getSessionState,
} from './missionArchive';

/**
 * The empty starting state for a brand-new mission. Nothing is auto-created on
 * page load: a mission only comes into existence once the user makes a design
 * choice in the Mission Designer.
 */
export const DEFAULT_MISSION_STATE: MissionState = {
  missionName: '',
  objective: null,
  destination: null,
  spacecraft: null,
  instruments: [],
  propulsion: null,
  power: null,
  communication: null,
  currentStage: 0,
  completedStages: [],
};

// Stable identity so useSyncExternalStore snapshots don't thrash when there is
// no active mission.
const EMPTY_DRAFT: MissionState = { ...DEFAULT_MISSION_STATE };

function currentDraft(): MissionState {
  return getSessionState().activeMission ?? EMPTY_DRAFT;
}

/** Apply an update to the active draft, creating it on first edit. */
function updateDraft(next: MissionState | ((draft: MissionState) => MissionState)): void {
  const base = currentDraft();
  saveActiveMission(typeof next === 'function' ? next(base) : next);
}

/**
 * Single source of truth for the mission being designed.
 *
 * Backed by the in-memory session store, so every route that calls this hook
 * sees the same mission within one browser session, and a page refresh resets
 * it to the empty draft. All persistence has been removed.
 */
export function useMissionStore() {
  const mission = useSyncExternalStore(
    subscribeSession,
    () => getSessionState().activeMission,
    () => null,
  ) ?? EMPTY_DRAFT;

  const updateMissionName = useCallback((name: string) => {
    updateDraft(prev => ({ ...prev, missionName: name }));
  }, []);

  const updateObjective = useCallback((objective: MissionObjective) => {
    updateDraft(prev => ({ ...prev, objective }));
  }, []);

  const updateDestination = useCallback((destination: Destination) => {
    updateDraft(prev => ({ ...prev, destination }));
  }, []);

  const updateSpacecraft = useCallback((spacecraft: SpacecraftType) => {
    updateDraft(prev => ({ ...prev, spacecraft }));
  }, []);

  const toggleInstrument = useCallback((instrument: Instrument) => {
    updateDraft(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter(i => i !== instrument)
        : [...prev.instruments, instrument],
    }));
  }, []);

  const updatePropulsion = useCallback((propulsion: Propulsion) => {
    updateDraft(prev => ({ ...prev, propulsion }));
  }, []);

  const updatePower = useCallback((power: Power) => {
    updateDraft(prev => ({ ...prev, power }));
  }, []);

  const updateCommunication = useCallback((communication: Communication) => {
    updateDraft(prev => ({ ...prev, communication }));
  }, []);

  const goToStage = useCallback((stage: number) => {
    updateDraft(prev => ({
      ...prev,
      currentStage: stage,
      completedStages: prev.completedStages.includes(stage - 1)
        ? prev.completedStages
        : [...prev.completedStages, stage - 1].filter(s => s >= 0),
    }));
  }, []);

  const completeStage = useCallback((stage: number) => {
    updateDraft(prev => ({
      ...prev,
      completedStages: prev.completedStages.includes(stage)
        ? prev.completedStages
        : [...prev.completedStages, stage],
      currentStage: Math.min(stage + 1, 9),
    }));
  }, []);

  const resetMission = useCallback(() => {
    clearActiveMission();
    clearMissionResult();
  }, []);

  // Adopt a complete mission as the active draft (e.g. applying a What-If
  // change), so the designer continues from that configuration.
  const loadMission = useCallback((next: MissionState) => {
    updateDraft({
      ...next,
      currentStage: Math.min(Math.max(next.currentStage, 0), 8),
      completedStages: next.completedStages.filter(s => s >= 0 && s <= 8),
    });
  }, []);

  const getProgressPercent = useCallback(() => {
    // 9 design stages (0–8); Launch (9) is reached, not designed.
    const designed = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(stageId =>
      mission.completedStages.includes(stageId)
    ).length;
    return Math.round((designed / 9) * 100);
  }, [mission.completedStages]);

  return {
    mission,
    updateMissionName,
    updateObjective,
    updateDestination,
    updateSpacecraft,
    toggleInstrument,
    updatePropulsion,
    updatePower,
    updateCommunication,
    goToStage,
    completeStage,
    resetMission,
    loadMission,
    getProgressPercent,
  };
}
