'use client';

import React from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import { PROPULSION_SYSTEMS, DESTINATIONS, type Propulsion } from '@/lib/missionData';
import { PROPULSION_EDUCATION } from '@/lib/missionRules';
import OptionEducationBlock from './OptionEducationBlock';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

export default function Stage5Propulsion({ store }: Props) {
  const { mission, updatePropulsion } = store;
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Propulsion System</h2>
        <p className="text-sm text-muted-foreground">
          How will your spacecraft travel? Different propulsion systems suit different mission types and distances.
          {destInfo && <span className="text-info"> Your destination is <strong>{destInfo.label}</strong> — a <strong>{destInfo.distanceCategory}</strong>-distance target.</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.entries(PROPULSION_SYSTEMS) as [Propulsion, typeof PROPULSION_SYSTEMS[Propulsion]][]).map(([key, prop]) => {
          const isSelected = mission.propulsion === key;

          return (
            <button
              key={`propulsion-${key}`}
              type="button"
              onClick={() => updatePropulsion(key)}
              className={`option-card p-5 text-left ${isSelected ? 'selected' : ''}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{prop.icon}</span>
                <div>
                  <div className="text-sm font-bold text-foreground">{prop.label}</div>
                  <div className="text-xs text-muted-foreground">{prop.description}</div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Thrust Level</span>
                    <span className="text-xs font-mono text-foreground">{prop.thrustLevel}%</span>
                  </div>
                  <div className="score-bar-track h-1.5">
                    <div className="score-bar-fill bg-danger" style={{ width: `${prop.thrustLevel}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Fuel Efficiency</span>
                    <span className="text-xs font-mono text-foreground">{prop.efficiency}%</span>
                  </div>
                  <div className="score-bar-track h-1.5">
                    <div className="score-bar-fill bg-success" style={{ width: `${prop.efficiency}%` }} />
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                <strong className="text-foreground">How it works:</strong> {prop.howItWorks}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-success font-semibold mb-1">Advantages</div>
                  {prop.advantages.slice(0, 2).map((adv, i) => (
                    <div key={`adv-${key}-${i}`} className="text-muted-foreground flex items-start gap-1">
                      <span className="text-success">+</span>{adv}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-danger font-semibold mb-1">Limitations</div>
                  {prop.limitations.slice(0, 2).map((lim, i) => (
                    <div key={`lim-${key}-${i}`} className="text-muted-foreground flex items-start gap-1">
                      <span className="text-danger">!</span>{lim}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {mission.propulsion && (
        <OptionEducationBlock
          education={PROPULSION_EDUCATION[mission.propulsion]}
          optionLabel={PROPULSION_SYSTEMS[mission.propulsion].label}
        />
      )}
    </div>
  );
}