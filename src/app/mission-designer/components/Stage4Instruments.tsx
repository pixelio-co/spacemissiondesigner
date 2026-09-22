'use client';

import React from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import { INSTRUMENTS, SPACECRAFT_TYPES, type Instrument } from '@/lib/missionData';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

export default function Stage4Instruments({ store }: Props) {
  const { mission, toggleInstrument } = store;
  const scInfo = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;

  const totalMass = mission.instruments.reduce((sum, inst) => sum + INSTRUMENTS[inst].mass, 0);
  const totalPower = mission.instruments.reduce((sum, inst) => sum + INSTRUMENTS[inst].power, 0);
  const maxInstruments = scInfo?.maxInstruments ?? 9;
  const payloadCapacity = scInfo?.payloadCapacity ?? 999;
  const massPercent = Math.min((totalMass / payloadCapacity) * 100, 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Scientific Instruments</h2>
        <p className="text-sm text-muted-foreground">Select instruments for your spacecraft. More instruments increase scientific value but add mass and power requirements.</p>
      </div>

      {/* Payload summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-card p-3 text-center">
          <div className={`text-lg font-bold font-mono ${mission.instruments.length > maxInstruments ? 'text-danger' : 'text-foreground'}`}>
            {mission.instruments.length}/{maxInstruments}
          </div>
          <div className="text-xs text-muted-foreground">Instruments</div>
        </div>
        <div className="space-card p-3 text-center">
          <div className={`text-lg font-bold font-mono ${totalMass > payloadCapacity ? 'text-danger' : totalMass > payloadCapacity * 0.8 ? 'text-warning' : 'text-foreground'}`}>
            {totalMass} kg
          </div>
          <div className="text-xs text-muted-foreground">Total Mass</div>
        </div>
        <div className="space-card p-3 text-center">
          <div className={`text-lg font-bold font-mono ${totalPower > 80 ? 'text-warning' : 'text-foreground'}`}>
            {totalPower} W
          </div>
          <div className="text-xs text-muted-foreground">Power Draw</div>
        </div>
      </div>

      {/* Mass bar */}
      {scInfo && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Payload Mass Usage</span>
            <span className="text-xs font-mono text-muted-foreground">{totalMass} / {payloadCapacity} kg</span>
          </div>
          <div className="score-bar-track">
            <div
              className={`score-bar-fill ${massPercent > 90 ? 'bg-danger' : massPercent > 70 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${massPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Instrument cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.entries(INSTRUMENTS) as [Instrument, typeof INSTRUMENTS[Instrument]][]).map(([key, inst]) => {
          const isSelected = mission.instruments.includes(key);
          const wouldExceed = !isSelected && mission.instruments.length >= maxInstruments;

          return (
            <button
              key={`instrument-${key}`}
              type="button"
              onClick={() => !wouldExceed && toggleInstrument(key)}
              disabled={wouldExceed}
              className={`option-card p-4 text-left ${isSelected ? 'selected-accent' : ''} ${wouldExceed ? 'opacity-40 cursor-not-allowed' : ''}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{inst.icon}</span>
                <div className="flex gap-1">
                  <span className="badge badge-neutral text-[9px]">{inst.mass} kg</span>
                  <span className="badge badge-neutral text-[9px]">{inst.power} W</span>
                </div>
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">{inst.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{inst.description}</div>
              {isSelected && (
                <div className="mt-2 text-xs text-accent font-medium">✓ Selected</div>
              )}
            </button>
          );
        })}
      </div>

      {mission.instruments.length > maxInstruments && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30">
          <p className="text-xs text-danger">
            You have selected {mission.instruments.length} instruments but your spacecraft supports a maximum of {maxInstruments}.
            Remove some instruments or choose a larger spacecraft.
          </p>
        </div>
      )}
    </div>
  );
}