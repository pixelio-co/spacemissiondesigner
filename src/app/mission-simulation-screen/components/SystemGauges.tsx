'use client';

import React from 'react';
import type { SystemStatus } from './SimulationClient';
import { Zap, Radio, Navigation, FlaskConical, Shield, Compass } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface Props {
  systems: SystemStatus;
}

function gaugeColor(value: number): string {
  if (value >= 70) return 'bg-success';
  if (value >= 40) return 'bg-warning';
  return 'bg-danger';
}

function statusLabel(value: number, key: string): string {
  if (key === 'radiation') {
    if (value < 20) return 'NOMINAL';
    if (value < 50) return 'ELEVATED';
    return 'HIGH';
  }
  if (value >= 80) return 'NOMINAL';
  if (value >= 50) return 'DEGRADED';
  if (value >= 20) return 'WARNING';
  return 'CRITICAL';
}

function statusColor(value: number, key: string): string {
  if (key === 'radiation') {
    if (value < 20) return 'text-success';
    if (value < 50) return 'text-warning';
    return 'text-danger';
  }
  if (value >= 80) return 'text-success';
  if (value >= 50) return 'text-warning';
  return 'text-danger';
}

const gaugeConfig: { key: keyof SystemStatus; label: string; icon: React.ElementType; inverted?: boolean }[] = [
  { key: 'power', label: 'Power', icon: Zap },
  { key: 'communication', label: 'Communication', icon: Radio },
  { key: 'propulsion', label: 'Propulsion', icon: Navigation },
  { key: 'instruments', label: 'Instruments', icon: FlaskConical },
  { key: 'navigation', label: 'Navigation', icon: Compass },
  { key: 'radiation', label: 'Radiation', icon: Shield, inverted: true },
];

export default function SystemGauges({ systems }: Props) {
  return (
    <div className="space-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        System Status
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {gaugeConfig.map(({ key, label, icon: Icon, inverted }) => {
          const value = systems[key];
          const displayValue = inverted ? value : value;
          const barColor = inverted
            ? (value < 20 ? 'bg-success' : value < 50 ? 'bg-warning' : 'bg-danger')
            : gaugeColor(value);

          return (
            <div key={`gauge-${key}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`pulse-dot ${statusColor(value, key).replace('text-', '')}`}
                    style={{ background: value >= 80 && key !== 'radiation' ? 'var(--success)' : value >= 50 && key !== 'radiation' ? 'var(--warning)' : 'var(--danger)' }}
                  />
                  <span className={`text-xs font-mono font-bold ${statusColor(value, key)}`}>
                    {statusLabel(value, key)}
                  </span>
                </div>
              </div>
              <div className="system-gauge">
                <div
                  className={`system-gauge-fill ${barColor}`}
                  style={{ width: `${displayValue}%` }}
                />
              </div>
              <div className="text-right mt-0.5">
                <span className="text-xs font-mono text-muted-foreground">{Math.round(displayValue)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}