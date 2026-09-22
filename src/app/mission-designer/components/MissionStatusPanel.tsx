'use client';

import React from 'react';
import type { MissionState } from '@/lib/missionData';
import { DESTINATIONS, OBJECTIVES, SPACECRAFT_TYPES } from '@/lib/missionData';
import { Satellite, Cpu } from 'lucide-react';

interface Props {
  mission: MissionState;
  progress: number;
}

export default function MissionStatusPanel({ mission, progress }: Props) {
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;
  const objInfo = mission.objective ? OBJECTIVES[mission.objective] : null;
  const scInfo = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;

  const systems = [
    {
      key: 'power',
      label: 'Power',
      value: mission.power ? mission.power.toUpperCase().replace('-', ' ') : 'Not configured',
      online: !!mission.power,
    },
    {
      key: 'comm',
      label: 'Communication',
      value: mission.communication ? mission.communication.toUpperCase().replace('-', ' ') : 'Not configured',
      online: !!mission.communication,
    },
    {
      key: 'propulsion',
      label: 'Propulsion',
      value: mission.propulsion ? mission.propulsion.toUpperCase().replace('-', ' ') : 'Not configured',
      online: !!mission.propulsion,
    },
    {
      key: 'instruments',
      label: 'Instruments',
      value: mission.instruments.length > 0 ? `${mission.instruments.length} active` : 'None selected',
      online: mission.instruments.length > 0,
    },
  ];

  return (
    <div className="space-y-4 sticky top-24">
      {/* Mission Identity */}
      <div className="space-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Satellite size={14} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mission Status</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Mission</div>
            <div className="text-sm font-semibold text-foreground truncate">
              {mission.missionName || 'Unnamed Mission'}
            </div>
          </div>

          {destInfo && (
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Destination</div>
              <div className="text-sm font-medium text-foreground flex items-center gap-1">
                <span>{destInfo.icon}</span>
                <span>{destInfo.label}</span>
              </div>
            </div>
          )}

          {objInfo && (
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Objective</div>
              <div className="text-sm font-medium text-foreground flex items-center gap-1">
                <span>{objInfo.icon}</span>
                <span className="truncate">{objInfo.label}</span>
              </div>
            </div>
          )}

          {scInfo && (
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Spacecraft</div>
              <div className="text-sm font-medium text-foreground flex items-center gap-1">
                <span>{scInfo.icon}</span>
                <span>{scInfo.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="space-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={14} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Systems</span>
        </div>

        <div className="space-y-2">
          {systems.map((sys) => (
            <div key={`sys-${sys.key}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`pulse-dot ${sys.online ? 'online' : 'offline'}`} />
                <span className="text-xs text-muted-foreground">{sys.label}</span>
              </div>
              <span className={`text-xs font-mono font-medium ${sys.online ? 'text-success' : 'text-muted-foreground'}`}>
                {sys.online ? 'ONLINE' : 'PENDING'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="space-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Overall Progress</span>
          <span className="text-xs font-mono font-bold text-primary">{progress}%</span>
        </div>
        <div className="score-bar-track">
          <div className="score-bar-fill bg-primary" style={{ width: `${progress}%` }} />
        </div>
        {progress === 0 && (
          <p className="text-xs text-muted-foreground mt-2">Complete each stage to build your mission.</p>
        )}
      </div>

      {/* Communication delay note */}
      {destInfo && (
        <div className="space-card p-4 border-info/30 border">
          <div className="text-xs text-muted-foreground mb-1">Signal Delay</div>
          <div className="text-sm font-mono text-info font-semibold">{destInfo.communicationDelay}</div>
          <div className="text-xs text-muted-foreground mt-1">One-way communication time to {destInfo.label}</div>
        </div>
      )}
    </div>
  );
}