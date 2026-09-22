'use client';

import { useState, useCallback } from 'react';
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

export function useMissionStore() {
  const [mission, setMission] = useState<MissionState>({ ...DEFAULT_MISSION_STATE });

  const updateMissionName = useCallback((name: string) => {
    setMission(prev => ({ ...prev, missionName: name }));
  }, []);

  const updateObjective = useCallback((objective: MissionObjective) => {
    setMission(prev => ({ ...prev, objective }));
  }, []);

  const updateDestination = useCallback((destination: Destination) => {
    setMission(prev => ({ ...prev, destination }));
  }, []);

  const updateSpacecraft = useCallback((spacecraft: SpacecraftType) => {
    setMission(prev => ({ ...prev, spacecraft }));
  }, []);

  const toggleInstrument = useCallback((instrument: Instrument) => {
    setMission(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter(i => i !== instrument)
        : [...prev.instruments, instrument],
    }));
  }, []);

  const updatePropulsion = useCallback((propulsion: Propulsion) => {
    setMission(prev => ({ ...prev, propulsion }));
  }, []);

  const updatePower = useCallback((power: Power) => {
    setMission(prev => ({ ...prev, power }));
  }, []);

  const updateCommunication = useCallback((communication: Communication) => {
    setMission(prev => ({ ...prev, communication }));
  }, []);

  const goToStage = useCallback((stage: number) => {
    setMission(prev => ({
      ...prev,
      currentStage: stage,
      completedStages: prev.completedStages.includes(stage - 1)
        ? prev.completedStages
        : [...prev.completedStages, stage - 1].filter(s => s >= 0),
    }));
  }, []);

  const completeStage = useCallback((stage: number) => {
    setMission(prev => ({
      ...prev,
      completedStages: prev.completedStages.includes(stage)
        ? prev.completedStages
        : [...prev.completedStages, stage],
      currentStage: Math.min(stage + 1, 9),
    }));
  }, []);

  const resetMission = useCallback(() => {
    setMission({ ...DEFAULT_MISSION_STATE });
  }, []);

  const getProgressPercent = useCallback(() => {
    const totalStages = 10;
    return Math.round((mission.completedStages.length / totalStages) * 100);
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
    getProgressPercent,
  };
}