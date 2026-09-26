'use client';

import React from 'react';

import { OBJECTIVES, type MissionObjective } from '@/lib/missionData';
import type { useMissionStore } from '@/lib/missionStore';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

export default function Stage1Objective({ store }: Props) {
  const { mission, updateObjective } = store;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Mission Objective</h2>
        <p className="text-sm text-muted-foreground">What is the primary scientific or operational goal of your mission?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.entries(OBJECTIVES) as [MissionObjective, typeof OBJECTIVES[MissionObjective]][]).map(([key, obj]) => (
          <button
            key={`objective-${key}`}
            type="button"
            onClick={() => updateObjective(key)}
            className={`option-card p-4 text-left ${mission.objective === key ? 'selected' : ''}`}
            aria-pressed={mission.objective === key}
          >
            <div className="text-2xl mb-2">{obj.icon}</div>
            <div className="text-sm font-semibold text-foreground mb-1">{obj.label}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{obj.description}</div>
          </button>
        ))}
      </div>

      {mission.objective && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 animate-fadeIn">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Scientific Purpose</div>
          <p className="text-sm text-foreground">{OBJECTIVES[mission.objective].scientificPurpose}</p>
        </div>
      )}
    </div>
  );
}