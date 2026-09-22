'use client';

import React from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import { POWER_SYSTEMS, DESTINATIONS, type Power } from '@/lib/missionData';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

export default function Stage6Power({ store }: Props) {
  const { mission, updatePower } = store;
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Power System</h2>
        <p className="text-sm text-muted-foreground">
          How will your spacecraft generate electricity? Your destination strongly affects which power system is suitable.
        </p>
      </div>

      {destInfo && (
        <div className="p-3 rounded-lg bg-info/10 border border-info/30">
          <p className="text-xs text-info/90">
            <strong>Destination note:</strong> {destInfo.label} is a <strong>{destInfo.distanceCategory}</strong> destination.
            {['outer', 'deep'].includes(destInfo.distanceCategory) && ' Solar power is significantly reduced at this distance — consider RPS.'}
            {['near', 'inner'].includes(destInfo.distanceCategory) && ' Solar power is viable at this distance.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(POWER_SYSTEMS) as [Power, typeof POWER_SYSTEMS[Power]][]).map(([key, pwr]) => {
          const isSelected = mission.power === key;
          const suitabilityScore = destInfo ? destInfo.powerSuitability[key] : 70;

          return (
            <button
              key={`power-${key}`}
              type="button"
              onClick={() => updatePower(key)}
              className={`option-card p-5 text-left ${isSelected ? 'selected' : ''}`}
              aria-pressed={isSelected}
            >
              <div className="text-3xl mb-3">{pwr.icon}</div>
              <div className="text-sm font-bold text-foreground mb-1">{pwr.label}</div>
              <div className="text-xs text-muted-foreground mb-3 leading-relaxed">{pwr.description}</div>

              {destInfo && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Suitability for {destInfo.label}</span>
                    <span className={`text-xs font-mono font-bold ${suitabilityScore >= 70 ? 'text-success' : suitabilityScore >= 40 ? 'text-warning' : 'text-danger'}`}>
                      {suitabilityScore}%
                    </span>
                  </div>
                  <div className="score-bar-track h-1.5">
                    <div
                      className={`score-bar-fill ${suitabilityScore >= 70 ? 'bg-success' : suitabilityScore >= 40 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${suitabilityScore}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {pwr.advantages.slice(0, 2).map((adv, i) => (
                  <div key={`pwr-adv-${key}-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-success">+</span>{adv}
                  </div>
                ))}
                {pwr.limitations.slice(0, 1).map((lim, i) => (
                  <div key={`pwr-lim-${key}-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-danger">!</span>{lim}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}