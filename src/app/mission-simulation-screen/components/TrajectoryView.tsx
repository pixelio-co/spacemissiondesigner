'use client';

/**
 * TrajectoryView — educational solar-system visualization.
 *
 * Shows the Sun, the inner planets' orbits (compact scale), Earth, the
 * mission destination, and the spacecraft animating along its trajectory.
 * NOT to scale and NOT a real-time ephemeris — labeled as educational.
 */

import React from 'react';
import type { Destination } from '@/lib/missionData';
import { DESTINATIONS } from '@/lib/missionData';
import { getDestinationFacts, DESTINATION_FACTS } from '@/lib/spaceData';
import type { SimPhase } from '@/lib/simulationEngine';

interface Props {
  destination: Destination | null;
  progress: number;
  phase: SimPhase;
}

// Compact orbit radii for the visualization (not to scale).
const ORBIT_RADII: Record<string, number> = {
  mercury: 70,
  venus: 95,
  'earth-orbit': 120,
  mars: 150,
  asteroid: 185,
  jupiter: 230,
  saturn: 280,
  uranus: 330,
  neptune: 375,
};

const SUN_AT = { x: 300, y: 100 };

export default function TrajectoryView({ destination, progress, phase }: Props) {
  const destInfo = destination ? DESTINATIONS[destination] : null;
  const facts = destination ? getDestinationFacts(destination) : null;

  // Spacecraft position: eased path from Earth's orbit to the destination orbit.
  const destR = destination ? (ORBIT_RADII[destination] ?? 120) : 120;
  const startAngle = -0.35; // Earth's angular position on its orbit
  const destAngle = 0.6;
  const eased = Math.min(progress / 100, 1);
  const t = eased * eased * (3 - 2 * eased); // smoothstep
  const angle = startAngle + (destAngle - startAngle) * t;
  const radius = 120 + (destR - 120) * t;
  const craftX = SUN_AT.x + Math.cos(angle) * radius;
  const craftY = SUN_AT.y + Math.sin(angle) * radius * 0.55; // flattened for view

  const earthX = SUN_AT.x + Math.cos(startAngle) * 120;
  const earthY = SUN_AT.y + Math.sin(startAngle) * 120 * 0.55;

  // Comm signal line Earth ↔ spacecraft
  const showSignal = phase !== 'pre-launch' && progress > 0 && progress < 98;

  const otherPlanets = Object.keys(DESTINATION_FACTS).filter(
    k => k !== destination && k !== 'earth-orbit' && ORBIT_RADII[k]
  );

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-background/50 border border-border" style={{ height: '220px' }}>
      <svg
        viewBox="0 0 600 200"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`Educational visualization: spacecraft trajectory from Earth toward ${destInfo?.label ?? 'destination'}`}
      >
        {/* Stars */}
        {Array.from({ length: 42 }, (_, i) => (
          <circle
            key={`tv-star-${i}`}
            cx={(i * 137 + 19) % 600}
            cy={(i * 89 + 11) % 200}
            r={0.4 + (i % 3) * 0.35}
            fill="rgba(226,232,240,0.35)"
          />
        ))}

        {/* Orbits */}
        {Object.entries(ORBIT_RADII).map(([key, r]) => (
          <ellipse
            key={`tv-orbit-${key}`}
            cx={SUN_AT.x}
            cy={SUN_AT.y}
            rx={r}
            ry={r * 0.55}
            fill="none"
            stroke={key === destination ? 'rgba(29,110,245,0.45)' : 'rgba(30,58,95,0.35)'}
            strokeWidth={key === destination ? 1.4 : 0.8}
            strokeDasharray="3 5"
          />
        ))}

        {/* Sun */}
        <circle cx={SUN_AT.x} cy={SUN_AT.y} r="26" fill="rgba(245,158,11,0.15)" />
        <circle cx={SUN_AT.x} cy={SUN_AT.y} r="14" fill="#f59e0b" />
        <text x={SUN_AT.x} y={SUN_AT.y + 40} textAnchor="middle" fontSize="8" fill="rgba(245,158,11,0.7)" fontFamily="var(--font-mono)">SUN</text>

        {/* Other planets */}
        {otherPlanets.map(key => {
          const r = ORBIT_RADII[key];
          const a = ((key.charCodeAt(0) * 7) % 100) / 100 * Math.PI * 2;
          const px = SUN_AT.x + Math.cos(a) * r;
          const py = SUN_AT.y + Math.sin(a) * r * 0.55;
          const color = DESTINATION_FACTS[key] ? DESTINATIONS[key as Destination]?.color ?? '#64748b' : '#64748b';
          return (
            <g key={`tv-planet-${key}`}>
              <circle cx={px} cy={py} r="5" fill={color} opacity="0.55" />
              <text x={px} y={py - 8} textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.55)" fontFamily="var(--font-mono)">
                {DESTINATIONS[key as Destination]?.label?.toUpperCase() ?? key.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Earth */}
        <circle cx={earthX} cy={earthY} r="12" fill="rgba(59,130,246,0.2)" />
        <circle cx={earthX} cy={earthY} r="7" fill="#1d6ef5" />
        <text x={earthX} y={earthY + 22} textAnchor="middle" fontSize="8" fill="rgba(147,197,253,0.9)" fontFamily="var(--font-mono)">EARTH</text>

        {/* Destination (highlighted) */}
        {destInfo && (
          <g>
            <circle cx={SUN_AT.x + Math.cos(destAngle) * destR} cy={SUN_AT.y + Math.sin(destAngle) * destR * 0.55} r="18" fill={`${destInfo.color}22`} />
            <circle
              cx={SUN_AT.x + Math.cos(destAngle) * destR}
              cy={SUN_AT.y + Math.sin(destAngle) * destR * 0.55}
              r="11"
              fill={destInfo.color}
              opacity="0.9"
            />
            <text
              x={SUN_AT.x + Math.cos(destAngle) * destR}
              y={SUN_AT.y + Math.sin(destAngle) * destR * 0.55 + 30}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(226,232,240,0.95)"
              fontFamily="var(--font-mono)"
              fontWeight="bold"
            >
              {destInfo.label.toUpperCase()}
            </text>
          </g>
        )}

        {/* Trajectory path Earth → destination */}
        <path
          d={`M ${earthX} ${earthY} Q ${SUN_AT.x + 40} ${Math.min(earthY, SUN_AT.y + Math.sin(destAngle) * destR * 0.55) - 40} ${SUN_AT.x + Math.cos(destAngle) * destR} ${SUN_AT.y + Math.sin(destAngle) * destR * 0.55}`}
          fill="none"
          stroke="rgba(29,110,245,0.35)"
          strokeWidth="1.2"
          strokeDasharray="5 4"
        />

        {/* Comm signal */}
        {showSignal && (
          <line
            x1={earthX} y1={earthY}
            x2={craftX} y2={craftY}
            stroke="rgba(245,158,11,0.35)"
            strokeWidth="0.8"
            strokeDasharray="2 6"
          />
        )}

        {/* Spacecraft */}
        {progress > 0 && phase !== 'pre-launch' && (
          <g transform={`translate(${craftX}, ${craftY})`}>
            <ellipse cx="-6" cy="0" rx="6" ry="2.4" fill="rgba(245,158,11,0.4)" />
            <rect x="-4" y="-3" width="9" height="6" rx="1.5" fill="#e2e8f0" />
            <rect x="-1" y="-8" width="4" height="4" rx="0.8" fill="#1d6ef5" opacity="0.9" />
            <rect x="-1" y="4" width="4" height="4" rx="0.8" fill="#1d6ef5" opacity="0.9" />
          </g>
        )}

        {/* Phase caption */}
        <text x="300" y="14" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.8)" fontFamily="var(--font-mono)">
          {phase.toUpperCase().replace(/-/g, ' ')} — {Math.round(progress)}%
        </text>
      </svg>

      {/* Facts overlay */}
      {facts && (
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[9px] font-mono text-muted-foreground bg-background/70 rounded px-2 py-1">
          <span>Sunlight: {Math.round(((facts.solarIrradianceWm2 ?? 1361) / 1361) * 100)}% of Earth</span>
          <span>Gravity: {facts.gravityMs2} m/s²</span>
          <span>Temp: {facts.meanTempC}°C avg</span>
          <span>Light-time: ≈{Math.round(facts.avgOneWayDelaySeconds / 60)} min</span>
        </div>
      )}
    </div>
  );
}
