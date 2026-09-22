'use client';

import React from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import { SPACECRAFT_TYPES, DESTINATIONS, type SpacecraftType } from '@/lib/missionData';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

const SpacecraftSVG = ({ type }: { type: SpacecraftType }) => {
  const svgs: Record<SpacecraftType, React.ReactNode> = {
    orbiter: (
      <svg viewBox="0 0 100 100" className="w-20 h-20" aria-label="Orbiter spacecraft diagram">
        <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
        <rect x="38" y="38" width="24" height="24" rx="3" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
        <rect x="10" y="46" width="26" height="8" rx="2" fill="var(--accent)" opacity="0.8" />
        <rect x="64" y="46" width="26" height="8" rx="2" fill="var(--accent)" opacity="0.8" />
        <circle cx="50" cy="50" r="4" fill="var(--primary)" />
      </svg>
    ),
    lander: (
      <svg viewBox="0 0 100 100" className="w-20 h-20" aria-label="Lander spacecraft diagram">
        <polygon points="50,20 65,55 35,55" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
        <rect x="35" y="55" width="30" height="15" rx="2" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" />
        <line x1="35" y1="70" x2="20" y2="85" stroke="var(--muted-foreground)" strokeWidth="2" />
        <line x1="65" y1="70" x2="80" y2="85" stroke="var(--muted-foreground)" strokeWidth="2" />
        <line x1="50" y1="70" x2="50" y2="88" stroke="var(--muted-foreground)" strokeWidth="2" />
        <circle cx="20" cy="87" r="4" fill="var(--accent)" />
        <circle cx="80" cy="87" r="4" fill="var(--accent)" />
        <circle cx="50" cy="90" r="4" fill="var(--accent)" />
      </svg>
    ),
    rover: (
      <svg viewBox="0 0 100 100" className="w-20 h-20" aria-label="Rover spacecraft diagram">
        <rect x="20" y="45" width="60" height="25" rx="3" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
        <rect x="30" y="30" width="40" height="15" rx="2" fill="var(--accent)" opacity="0.7" />
        <circle cx="30" cy="75" r="8" fill="var(--muted)" stroke="var(--primary)" strokeWidth="2" />
        <circle cx="50" cy="75" r="8" fill="var(--muted)" stroke="var(--primary)" strokeWidth="2" />
        <circle cx="70" cy="75" r="8" fill="var(--muted)" stroke="var(--primary)" strokeWidth="2" />
        <line x1="50" y1="30" x2="50" y2="18" stroke="var(--muted-foreground)" strokeWidth="1.5" />
        <circle cx="50" cy="16" r="4" fill="var(--primary)" opacity="0.8" />
      </svg>
    ),
    flyby: (
      <svg viewBox="0 0 100 100" className="w-20 h-20" aria-label="Flyby probe spacecraft diagram">
        <ellipse cx="50" cy="50" rx="35" ry="8" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
        <line x1="50" y1="30" x2="50" y2="70" stroke="var(--accent)" strokeWidth="2" />
        <line x1="25" y1="50" x2="75" y2="50" stroke="var(--muted-foreground)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="6" fill="var(--primary)" />
        <polygon points="80,47 95,50 80,53" fill="var(--accent)" opacity="0.8" />
      </svg>
    ),
    telescope: (
      <svg viewBox="0 0 100 100" className="w-20 h-20" aria-label="Space telescope spacecraft diagram">
        <rect x="30" y="35" width="40" height="30" rx="2" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
        <ellipse cx="30" cy="50" rx="12" ry="15" fill="var(--muted)" stroke="var(--primary)" strokeWidth="1.5" />
        <rect x="10" y="46" width="18" height="8" rx="1" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
        <rect x="70" y="30" width="20" height="8" rx="2" fill="var(--accent)" opacity="0.7" />
        <rect x="70" y="62" width="20" height="8" rx="2" fill="var(--accent)" opacity="0.7" />
      </svg>
    ),
    cubesat: (
      <svg viewBox="0 0 100 100" className="w-20 h-20" aria-label="CubeSat spacecraft diagram">
        <rect x="30" y="30" width="40" height="40" rx="3" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
        <rect x="10" y="44" width="18" height="12" rx="1" fill="var(--accent)" opacity="0.7" />
        <rect x="72" y="44" width="18" height="12" rx="1" fill="var(--accent)" opacity="0.7" />
        <line x1="38" y1="30" x2="38" y2="70" stroke="var(--border)" strokeWidth="1" />
        <line x1="50" y1="30" x2="50" y2="70" stroke="var(--border)" strokeWidth="1" />
        <line x1="62" y1="30" x2="62" y2="70" stroke="var(--border)" strokeWidth="1" />
      </svg>
    ),
  };
  return <>{svgs[type]}</>;
};

export default function Stage3Spacecraft({ store }: Props) {
  const { mission, updateSpacecraft } = store;
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Spacecraft Design</h2>
        <p className="text-sm text-muted-foreground">Choose the type of spacecraft for your mission. Each has different capabilities and limitations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(SPACECRAFT_TYPES) as [SpacecraftType, typeof SPACECRAFT_TYPES[SpacecraftType]][]).map(([key, sc]) => {
          const isSelected = mission.spacecraft === key;
          const isSuitable = !destInfo || sc.suitableDestinations.includes(mission.destination!);

          return (
            <button
              key={`spacecraft-${key}`}
              type="button"
              onClick={() => updateSpacecraft(key)}
              className={`option-card p-4 text-left relative ${isSelected ? 'selected' : ''} ${!isSuitable ? 'opacity-60' : ''}`}
              aria-pressed={isSelected}
            >
              {!isSuitable && (
                <div className="absolute top-2 right-2">
                  <span className="badge badge-warning text-[9px]">Limited suitability</span>
                </div>
              )}
              <div className="spacecraft-preview py-2">
                <SpacecraftSVG type={key} />
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">{sc.label}</div>
              <div className="text-xs text-muted-foreground mb-3 leading-relaxed">{sc.description}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground">Max Instruments</div>
                  <div className="font-mono font-bold text-foreground">{sc.maxInstruments}</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground">Payload Cap.</div>
                  <div className="font-mono font-bold text-foreground">{sc.payloadCapacity} kg</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {mission.spacecraft && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30 animate-fadeIn">
          <p className="text-xs text-success/90">
            <strong>{SPACECRAFT_TYPES[mission.spacecraft].label}</strong> selected —
            payload capacity: {SPACECRAFT_TYPES[mission.spacecraft].payloadCapacity} kg,
            max {SPACECRAFT_TYPES[mission.spacecraft].maxInstruments} instruments.
          </p>
        </div>
      )}
    </div>
  );
}