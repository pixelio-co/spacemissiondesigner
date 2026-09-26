'use client';

import React from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import { COMMUNICATION_SYSTEMS, DESTINATIONS, type Communication } from '@/lib/missionData';
import { COMMUNICATION_EDUCATION } from '@/lib/missionRules';
import { getCommDelayInfo } from '@/lib/spaceData';
import OptionEducationBlock from './OptionEducationBlock';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

export default function Stage7Communication({ store }: Props) {
  const { mission, updateCommunication } = store;
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Communication System</h2>
        <p className="text-sm text-muted-foreground">
          How will your spacecraft communicate with Earth? Signal delay and bandwidth are critical considerations.
        </p>
      </div>

      {destInfo && (() => {
        const delay = getCommDelayInfo(mission.destination!);
        return (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-xs text-warning/90">
              <strong>Signal delay to {destInfo.label}:</strong> at a representative distance of{' '}
              {Math.round(delay.representativeDistanceKm / 1e6)} million km, one-way light-time is{' '}
              <strong className="font-mono">{delay.lightTime.formatted}</strong> — computed from real
              distance data ÷ the speed of light.
              {['outer', 'deep'].includes(destInfo.distanceCategory) && ' A high-gain or deep-space antenna is strongly recommended.'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 italic">{delay.distanceNote}</p>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(COMMUNICATION_SYSTEMS) as [Communication, typeof COMMUNICATION_SYSTEMS[Communication]][]).map(([key, comm]) => {
          const isSelected = mission.communication === key;
          const isSuitable = !destInfo || comm.suitableDestinations.includes(mission.destination!);

          return (
            <button
              key={`comm-${key}`}
              type="button"
              onClick={() => updateCommunication(key)}
              className={`option-card p-5 text-left ${isSelected ? 'selected' : ''} ${!isSuitable ? 'opacity-60' : ''}`}
              aria-pressed={isSelected}
            >
              <div className="text-3xl mb-3">{comm.icon}</div>
              <div className="flex items-start justify-between mb-1">
                <div className="text-sm font-bold text-foreground">{comm.label}</div>
                {!isSuitable && <span className="badge badge-warning text-[9px]">Limited range</span>}
              </div>
              <div className="text-xs text-muted-foreground mb-3 leading-relaxed">{comm.description}</div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Data Rate</span>
                  <span className="text-xs font-mono text-foreground">{comm.dataRate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Max Range</span>
                  <span className="text-xs font-mono text-foreground">{comm.maxRange}</span>
                </div>
              </div>

              <div className="space-y-1">
                {comm.advantages.slice(0, 2).map((adv, i) => (
                  <div key={`comm-adv-${key}-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-success">+</span>{adv}
                  </div>
                ))}
                {comm.limitations.slice(0, 1).map((lim, i) => (
                  <div key={`comm-lim-${key}-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-danger">!</span>{lim}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">About signal delay:</strong> Radio waves travel at the speed of light (~299,792 km/s).
          Even at this speed, a signal to Mars takes 3–22 minutes one-way — making real-time control impossible.
          Spacecraft must be designed to operate autonomously during communication gaps.
        </p>
      </div>

      {mission.communication && (
        <OptionEducationBlock
          education={COMMUNICATION_EDUCATION[mission.communication]}
          optionLabel={COMMUNICATION_SYSTEMS[mission.communication].label}
        />
      )}
    </div>
  );
}