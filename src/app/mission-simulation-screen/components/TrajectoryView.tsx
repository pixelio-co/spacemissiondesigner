'use client';

import React from 'react';
import type { Destination } from '@/lib/missionData';
import { DESTINATIONS } from '@/lib/missionData';
import type { SimPhase } from './SimulationClient';

interface Props {
  destination: Destination | null;
  progress: number;
  phase: SimPhase;
}

export default function TrajectoryView({ destination, progress, phase }: Props) {
  const destInfo = destination ? DESTINATIONS[destination] : null;
  const craftX = 60 + (progress / 100) * 480;
  const craftY = 120 + Math.sin((progress / 100) * Math.PI * 1.5) * 40;

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-background/50 border border-border" style={{ height: '200px' }}>
      <svg
        viewBox="0 0 600 200"
        className="w-full h-full"
        aria-label={`Spacecraft trajectory to ${destInfo?.label ?? 'destination'}`}
      >
        {/* Stars */}
        {Array.from({ length: 30 }, (_, i) => (
          <circle
            key={`traj-star-${i}`}
            cx={(i * 73 + 11) % 600}
            cy={(i * 47 + 7) % 200}
            r={0.5 + (i % 3) * 0.4}
            fill="rgba(226,232,240,0.4)"
          />
        ))}

        {/* Trajectory path */}
        <path
          d={`M 60 120 Q 300 ${120 - 50} 540 120`}
          fill="none"
          stroke="rgba(29,110,245,0.3)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          className="trajectory-line"
        />

        {/* Earth (origin) */}
        <circle cx="60" cy="120" r="18" fill="rgba(59,130,246,0.2)" />
        <circle cx="60" cy="120" r="12" fill="#1d6ef5" />
        <text x="60" y="148" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.8)" fontFamily="var(--font-mono)">EARTH</text>

        {/* Destination */}
        <circle cx="540" cy="120" r="20" fill={`${destInfo?.color ?? '#6366f1'}22`} />
        <circle cx="540" cy="120" r="14" fill={destInfo?.color ?? '#6366f1'} opacity="0.8" />
        <text x="540" y="148" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.8)" fontFamily="var(--font-mono)">
          {destInfo?.label?.toUpperCase() ?? 'DEST'}
        </text>

        {/* Progress fill on path */}
        {progress > 0 && (
          <path
            d={`M 60 120 Q 300 ${120 - 50} ${Math.min(craftX, 540)} ${craftY}`}
            fill="none"
            stroke="rgba(29,110,245,0.7)"
            strokeWidth="2"
          />
        )}

        {/* Spacecraft */}
        {progress > 0 && (
          <g transform={`translate(${Math.min(craftX, 530)}, ${craftY})`}>
            {/* Engine glow */}
            <ellipse cx="-8" cy="0" rx="8" ry="3" fill="rgba(245,158,11,0.4)" />
            {/* Body */}
            <rect x="-5" y="-4" width="12" height="8" rx="2" fill="#e2e8f0" />
            {/* Solar panels */}
            <rect x="-2" y="-10" width="6" height="5" rx="1" fill="#1d6ef5" opacity="0.9" />
            <rect x="-2" y="5" width="6" height="5" rx="1" fill="#1d6ef5" opacity="0.9" />
          </g>
        )}

        {/* Phase label */}
        <text x="300" y="20" textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.7)" fontFamily="var(--font-mono)">
          {phase.toUpperCase().replace('-', ' ')} — {Math.round(progress)}%
        </text>
      </svg>
    </div>
  );
}