'use client';

/**
 * SOLAR SYSTEM VIEW — educational visualization (not to physical scale).
 * Orbit radii use a log scale of real AU data so all planets fit; planet
 * sizes are illustrative. The spacecraft moves along its journey as the
 * mission progresses through its phases.
 */

import React, { useMemo } from 'react';
import type { Destination } from '@/lib/missionData';
import { DESTINATIONS } from '@/lib/missionData';
import { DESTINATION_FACTS, SOLAR_SYSTEM_SCALE } from '@/lib/spaceData';

interface Props {
  destination: Destination | null;
  /** Mission progress 0–100; controls spacecraft position along the route. */
  progress?: number;
  /** Current phase label (displayed under the diagram). */
  phaseLabel?: string;
  height?: number;
}

export default function SolarSystemView({ destination, progress = 0, phaseLabel, height = 260 }: Props) {
  const destScale = useMemo(
    () => SOLAR_SYSTEM_SCALE.find(p => p.destination === destination),
    [destination]
  );

  const W = 720;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2 + 10;
  const maxR = 112;

  // Sun glow
  const sunR = 13;

  // Spacecraft route: Earth orbit → destination (via a curved path)
  const earthAU = DESTINATION_FACTS['earth-orbit'].distanceFromSunAu;
  const earthScale = SOLAR_SYSTEM_SCALE.find(p => p.destination === 'earth-orbit')!;
  const destAU = destination ? DESTINATION_FACTS[destination].distanceFromSunAu : 1.52;

  // Position along an interpolated spiral between Earth's and the destination's orbit.
  const t = Math.min(Math.max(progress, 0), 100) / 100;
  const auNow = earthAU + (destAU - earthAU) * t;
  const orbitRNow = Math.max(24, Math.min(maxR, (Math.log10(auNow * 2) / Math.log10(60)) * maxR));
  const angle = -Math.PI / 2 + t * Math.PI * 1.15; // sweep most of a turn
  const craftX = cx + Math.cos(angle) * orbitRNow;
  const craftY = cy + Math.sin(angle) * orbitRNow * 0.55; // ellipse for depth

  return (
    <div className="relative w-full" aria-label="Educational solar system visualization">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: height }}>
        {/* Background stars */}
        {Array.from({ length: 40 }, (_, i) => (
          <circle
            key={`ss-star-${i}`}
            cx={(i * 173 + 29) % W}
            cy={(i * 97 + 13) % H}
            r={0.4 + (i % 3) * 0.3}
            fill="rgba(226,232,240,0.35)"
          />
        ))}

        {/* Orbits (log-scaled, dashed) */}
        {SOLAR_SYSTEM_SCALE.map(p => {
          const r = Math.max(24, Math.min(maxR, (Math.log10(p.au * 2) / Math.log10(60)) * maxR));
          return (
            <ellipse
              key={`orbit-${p.destination}`}
              cx={cx}
              cy={cy}
              rx={r}
              ry={r * 0.55}
              fill="none"
              stroke={p.destination === destination ? 'rgba(29,110,245,0.55)' : 'rgba(30,58,95,0.5)'}
              strokeWidth={p.destination === destination ? 1.5 : 1}
              strokeDasharray="3 5"
            />
          );
        })}

        {/* Sun */}
        <circle cx={cx} cy={cy} r={sunR * 2.2} fill="rgba(245,158,11,0.12)" />
        <circle cx={cx} cy={cy} r={sunR} fill="#f59e0b" />
        <text x={cx} y={cy - sunR - 6} textAnchor="middle" fontSize="8" fill="rgba(245,158,11,0.8)" fontFamily="var(--font-mono)">SUN</text>

        {/* Planets */}
        {SOLAR_SYSTEM_SCALE.map(p => {
          const r = Math.max(24, Math.min(maxR, (Math.log10(p.au * 2) / Math.log10(60)) * maxR));
          const a = -0.6 + SOLAR_SYSTEM_SCALE.indexOf(p) * 1.1; // fixed display angles
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r * 0.55;
          const isDest = p.destination === destination;
          const isEarth = p.destination === 'earth-orbit';
          return (
            <g key={`planet-${p.destination}`}>
              {isDest && (
                <circle cx={px} cy={py} r={p.visualSize + 6} fill="none" stroke="rgba(29,110,245,0.8)" strokeWidth="1.2" strokeDasharray="2 3">
                  <animate attributeName="stroke-opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={px} cy={py} r={p.visualSize} fill={p.color} opacity={isDest || isEarth ? 1 : 0.75} />
              <text
                x={px}
                y={py + p.visualSize + 10}
                textAnchor="middle"
                fontSize="8"
                fill={isDest ? '#93c5fd' : 'rgba(148,163,184,0.7)'}
                fontFamily="var(--font-mono)"
              >
                {p.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Spacecraft */}
        {destination && (
          <g transform={`translate(${craftX}, ${craftY})`}>
            <circle r="7" fill="rgba(245,158,11,0.15)">
              <animate attributeName="r" values="6;9;6" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <rect x="-3.5" y="-2.5" width="7" height="5" rx="1.5" fill="#e2e8f0" />
            <rect x="-2" y="-6" width="4" height="3" rx="0.5" fill="#1d6ef5" />
            <rect x="-2" y="3" width="4" height="3" rx="0.5" fill="#1d6ef5" />
          </g>
        )}
      </svg>

      <div className="flex items-center justify-between mt-1 px-2">
        <span className="text-[10px] text-muted-foreground italic">
          Educational visualization — orbits are log-scaled, planet sizes not to scale.
        </span>
        {destScale && destAU > earthAU && (
          <span className="text-[10px] font-mono text-info">
            {DESTINATION_FACTS[destination!].distanceFromSunAu} AU from the Sun
          </span>
        )}
      </div>
      {phaseLabel && (
        <div className="text-center text-[10px] font-mono text-muted-foreground mt-0.5">
          {phaseLabel}
        </div>
      )}
    </div>
  );
}
