'use client';

import React from 'react';
import type { AnalysisScores, MissionState } from '@/lib/missionData';
import { getOverallScore } from '@/lib/missionData';
import { Info, TrendingUp } from 'lucide-react';

interface Props {
  scores: AnalysisScores;
  mission: MissionState;
}

const scoreCategories = [
  { key: 'scientificValue' as const, label: 'Scientific Value', desc: 'Instrument capability vs objectives' },
  { key: 'payloadBalance' as const, label: 'Payload Balance', desc: 'Mass vs spacecraft capacity' },
  { key: 'powerCompatibility' as const, label: 'Power Compatibility', desc: 'Power system vs destination' },
  { key: 'propulsionSuitability' as const, label: 'Propulsion Suitability', desc: 'Propulsion vs destination distance' },
  { key: 'communication' as const, label: 'Communication', desc: 'Antenna vs destination range' },
  { key: 'destinationCompatibility' as const, label: 'Destination Match', desc: 'Spacecraft type vs destination' },
  { key: 'missionComplexity' as const, label: 'Mission Complexity', desc: 'Overall mission risk level' },
];

function scoreColor(score: number): string {
  if (score >= 75) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-danger';
}

function scoreTextColor(score: number): string {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

export default function AnalysisPanel({ scores, mission }: Props) {
  const overall = getOverallScore(scores);
  const hasAnySelection = mission.objective || mission.destination || mission.spacecraft;

  return (
    <div className="space-y-4 sticky top-24">
      <div className="space-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mission Analysis
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Educational simulation scores</p>

        {!hasAnySelection ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-xs text-muted-foreground">Analysis updates as you design your mission</p>
          </div>
        ) : (
          <>
            {/* Overall score */}
            <div className="flex items-center justify-center mb-5">
              <div className="relative">
                <svg viewBox="0 0 80 80" className="w-20 h-20">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--muted)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke={overall >= 75 ? 'var(--success)' : overall >= 50 ? 'var(--warning)' : 'var(--danger)'}
                    strokeWidth="6"
                    strokeDasharray={`${(overall / 100) * 201} 201`}
                    strokeDashoffset="50"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xl font-bold font-mono ${scoreTextColor(overall)}`}>{overall}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Overall</span>
                </div>
              </div>
            </div>

            {/* Individual scores */}
            <div className="space-y-3">
              {scoreCategories.map((cat) => {
                const score = scores[cat.key];
                return (
                  <div key={`score-${cat.key}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground font-medium">{cat.label}</span>
                      <span className={`text-xs font-mono font-bold ${scoreTextColor(score)}`}>{score}</span>
                    </div>
                    <div className="score-bar-track">
                      <div
                        className={`score-bar-fill ${scoreColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warnings */}
            {Object.values(scores).some(v => v < 40) && (
              <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30">
                <div className="flex items-start gap-2">
                  <Info size={12} className="text-danger mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-danger/90">
                    One or more systems have low compatibility. Review your selections before launch.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Educational simulation only. Not a real engineering assessment.
          </p>
        </div>
      </div>
    </div>
  );
}