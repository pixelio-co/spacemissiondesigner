'use client';

import React, { useState } from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import { DESTINATIONS, type Destination } from '@/lib/missionData';
import { DESTINATION_FACTS, TRAVEL_TIME_REFERENCE } from '@/lib/spaceData';
import InfoExpand from '@/components/ui/InfoExpand';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

const distanceBadge: Record<string, string> = {
  near: 'badge-success',
  inner: 'badge-info',
  outer: 'badge-warning',
  deep: 'badge-danger',
};

const distanceLabel: Record<string, string> = {
  near: 'Near Space',
  inner: 'Inner Solar System',
  outer: 'Outer Solar System',
  deep: 'Deep Space',
};

export default function Stage2Destination({ store }: Props) {
  const { mission, updateDestination } = store;
  const [expanded, setExpanded] = useState<Destination | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Choose Your Destination</h2>
        <p className="text-sm text-muted-foreground">Where will your spacecraft travel? Each destination has unique challenges and opportunities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.entries(DESTINATIONS) as [Destination, typeof DESTINATIONS[Destination]][]).map(([key, dest]) => {
          const isSelected = mission.destination === key;
          const isExpanded = expanded === key;

          return (
            <div key={`dest-${key}`}>
              <button
                type="button"
                onClick={() => {
                  updateDestination(key);
                  setExpanded(isExpanded ? null : key);
                }}
                className={`option-card p-4 text-left w-full ${isSelected ? 'selected' : ''}`}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{dest.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{dest.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">{dest.distanceKm}</div>
                    </div>
                  </div>
                  <span className={`badge ${distanceBadge[dest.distanceCategory]}`}>
                    {distanceLabel[dest.distanceCategory]}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{dest.environment}</div>
              </button>

              {isSelected && (
                <div className="mt-2 p-4 rounded-lg bg-muted/50 border border-border animate-fadeIn space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Opportunities</div>
                      <ul className="space-y-1">
                        {dest.opportunities.map((opp, i) => (
                          <li key={`opp-${key}-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-success mt-0.5">+</span>
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-danger uppercase tracking-wider mb-1">Challenges</div>
                      <ul className="space-y-1">
                        {dest.challenges.map((ch, i) => (
                          <li key={`ch-${key}-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-danger mt-0.5">!</span>
                            {ch}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-border flex-wrap">
                    <div>
                      <div className="text-xs text-muted-foreground">Signal Delay</div>
                      <div className="text-xs font-mono font-semibold text-info">{dest.communicationDelay}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Typical real cruise time</div>
                      <div className="text-xs font-mono font-semibold text-foreground">{TRAVEL_TIME_REFERENCE[key].typicalCruise}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Gravity</div>
                      <div className="text-xs font-mono font-semibold text-foreground">
                        {DESTINATION_FACTS[key].surfaceGravityMs2 != null ? `${DESTINATION_FACTS[key].surfaceGravityMs2} m/s²` : 'varies'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="text-success font-semibold">Real example:</span> {TRAVEL_TIME_REFERENCE[key].example}. {TRAVEL_TIME_REFERENCE[key].note}
                  </div>
                  <div className="text-[10px] text-muted-foreground/80 italic">
                    Data: NASA Planetary Fact Sheet snapshot · gravity/temp are representative values.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}