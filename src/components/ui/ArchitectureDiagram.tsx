'use client';

/**
 * MISSION ARCHITECTURE — a compact flow diagram of the whole mission system:
 * OBJECTIVE → DESTINATION → SPACECRAFT → INSTRUMENTS → PROPULSION → POWER →
 * COMMUNICATION → SCIENCE RETURN. Shows the user's actual selections so
 * judges and users can grasp the system at a glance.
 */

import React from 'react';
import type { MissionState } from '@/lib/missionData';
import {
  OBJECTIVES, DESTINATIONS, SPACECRAFT_TYPES, INSTRUMENTS,
  PROPULSION_SYSTEMS, POWER_SYSTEMS, COMMUNICATION_SYSTEMS,
} from '@/lib/missionData';
import { ArrowDown, Flag, Globe, Rocket, Microscope, Fuel, Zap, Radio, FlaskConical } from 'lucide-react';

interface Props {
  mission: MissionState;
  compact?: boolean;
}

interface NodeSpec {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  set: boolean;
}

export default function ArchitectureDiagram({ mission, compact = false }: Props) {
  const nodes: NodeSpec[] = [
    {
      key: 'objective',
      label: 'Objective',
      value: mission.objective ? OBJECTIVES[mission.objective].label : 'Not set',
      icon: Flag,
      color: 'text-primary',
      set: !!mission.objective,
    },
    {
      key: 'destination',
      label: 'Destination',
      value: mission.destination ? DESTINATIONS[mission.destination].label : 'Not set',
      icon: Globe,
      color: 'text-info',
      set: !!mission.destination,
    },
    {
      key: 'spacecraft',
      label: 'Spacecraft',
      value: mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft].label : 'Not set',
      icon: Rocket,
      color: 'text-accent',
      set: !!mission.spacecraft,
    },
    {
      key: 'instruments',
      label: 'Instruments',
      value: mission.instruments.length > 0 ? mission.instruments.map(i => INSTRUMENTS[i].label.replace('High-Resolution ', '').replace('System', '')).join(', ') : 'None',
      icon: Microscope,
      color: 'text-success',
      set: mission.instruments.length > 0,
    },
    {
      key: 'propulsion',
      label: 'Propulsion',
      value: mission.propulsion ? PROPULSION_SYSTEMS[mission.propulsion].label.replace(' Propulsion', '') : 'Not set',
      icon: Fuel,
      color: 'text-warning',
      set: !!mission.propulsion,
    },
    {
      key: 'power',
      label: 'Power',
      value: mission.power ? POWER_SYSTEMS[mission.power].label : 'Not set',
      icon: Zap,
      color: 'text-warning',
      set: !!mission.power,
    },
    {
      key: 'communication',
      label: 'Communication',
      value: mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].label : 'Not set',
      icon: Radio,
      color: 'text-info',
      set: !!mission.communication,
    },
    {
      key: 'science',
      label: 'Science Return',
      value: mission.instruments.length > 0 ? 'Observations → data → discovery' : 'Requires instruments',
      icon: FlaskConical,
      color: 'text-accent',
      set: mission.instruments.length > 0,
    },
  ];

  return (
    <div className="space-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Mission Architecture
      </div>
      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'} gap-1`}>
        {nodes.map((node, idx) => {
          const Icon = node.icon;
          return (
            <React.Fragment key={`arch-${node.key}`}>
              <div
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                  node.set
                    ? 'bg-card border-border'
                    : 'bg-muted/20 border-dashed border-border opacity-60'
                }`}
              >
                <div className={`w-7 h-7 rounded-md bg-muted/60 flex items-center justify-center flex-shrink-0`}>
                  <Icon size={13} className={node.color} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{node.label}</div>
                  <div className="text-xs font-medium text-foreground truncate" title={node.value}>
                    {node.value}
                  </div>
                </div>
              </div>
              {/* Arrow after each node except the last, on single-column layout */}
              {!compact && idx < nodes.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown size={11} className="text-muted-foreground/60" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 italic">
        Every box interacts with the others: instruments draw power, power suits the destination,
        communication carries the science home.
      </p>
    </div>
  );
}
