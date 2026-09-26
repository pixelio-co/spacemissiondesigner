'use client';

import React from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import { POWER_SYSTEMS, DESTINATIONS, type Power } from '@/lib/missionData';
import { POWER_EDUCATION } from '@/lib/missionRules';
import { DESTINATION_FACTS } from '@/lib/spaceData';
import OptionEducationBlock from './OptionEducationBlock';
import InfoExpand from '@/components/ui/InfoExpand';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

export default function Stage6Power({ store }: Props) {
  const { mission, updatePower } = store;
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;
  const destFacts = mission.destination ? DESTINATION_FACTS[mission.destination] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Power System</h2>
        <p className="text-sm text-muted-foreground">
          Choose how your spacecraft gets energy. Your destination strongly affects which power
          system can do the job.
        </p>
      </div>

      {destInfo && destFacts && (
        <div className="p-3 rounded-lg bg-info/10 border border-info/30">
          <p className="text-xs text-info/90">
            <strong>{destInfo.label}</strong> orbits at {destFacts.distanceFromSunAu} AU from the Sun.
            Sunlight there provides about <strong>{destFacts.solarIlluminationPercentOfEarth}%</strong> of
            what a panel receives at Earth (inverse-square law).
            {['outer', 'deep'].includes(destInfo.distanceCategory) && ' This is why real missions this far out choose radioisotope power.'}
            {['near', 'inner'].includes(destInfo.distanceCategory) && ' Solar power is generally viable at this distance.'}
          </p>
          <InfoExpand title="Why does sunlight fade with distance?" icon="idea">
            Light spreads out as it travels, so the energy passing through a given area drops with the
            <strong> square</strong> of the distance. Double the distance from the Sun → one quarter the
            sunlight. At 10 AU (Saturn) a panel collects ~1% of what it would at Earth.
          </InfoExpand>
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

      {mission.power && (
        <OptionEducationBlock
          education={POWER_EDUCATION[mission.power]}
          optionLabel={POWER_SYSTEMS[mission.power].label}
        />
      )}
    </div>
  );
}