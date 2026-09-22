'use client';

import React from 'react';
import type { useMissionStore } from '@/lib/missionStore';
import type { AnalysisScores } from '@/lib/missionData';
import {
  OBJECTIVES, DESTINATIONS, SPACECRAFT_TYPES, INSTRUMENTS,
  PROPULSION_SYSTEMS, POWER_SYSTEMS, COMMUNICATION_SYSTEMS, getOverallScore
} from '@/lib/missionData';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  store: ReturnType<typeof useMissionStore>;
  scores: AnalysisScores;
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 70) return <CheckCircle size={14} className="text-success" />;
  if (score >= 40) return <AlertTriangle size={14} className="text-warning" />;
  return <XCircle size={14} className="text-danger" />;
}

export default function Stage8Review({ store, scores }: Props) {
  const { mission } = store;
  const overall = getOverallScore(scores);

  const reviewItems = [
    {
      key: 'review-name',
      label: 'Mission Name',
      value: mission.missionName || 'Mission Alpha',
      icon: '🚀',
    },
    {
      key: 'review-obj',
      label: 'Objective',
      value: mission.objective ? OBJECTIVES[mission.objective].label : 'Not set',
      icon: mission.objective ? OBJECTIVES[mission.objective].icon : '❓',
    },
    {
      key: 'review-dest',
      label: 'Destination',
      value: mission.destination ? DESTINATIONS[mission.destination].label : 'Not set',
      icon: mission.destination ? DESTINATIONS[mission.destination].icon : '❓',
    },
    {
      key: 'review-sc',
      label: 'Spacecraft',
      value: mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft].label : 'Not set',
      icon: mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft].icon : '❓',
    },
    {
      key: 'review-inst',
      label: 'Instruments',
      value: mission.instruments.length > 0
        ? mission.instruments.map(i => INSTRUMENTS[i].label).join(', ')
        : 'None selected',
      icon: '🔬',
    },
    {
      key: 'review-prop',
      label: 'Propulsion',
      value: mission.propulsion ? PROPULSION_SYSTEMS[mission.propulsion].label : 'Not set',
      icon: mission.propulsion ? PROPULSION_SYSTEMS[mission.propulsion].icon : '❓',
    },
    {
      key: 'review-power',
      label: 'Power',
      value: mission.power ? POWER_SYSTEMS[mission.power].label : 'Not set',
      icon: mission.power ? POWER_SYSTEMS[mission.power].icon : '❓',
    },
    {
      key: 'review-comm',
      label: 'Communication',
      value: mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].label : 'Not set',
      icon: mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].icon : '❓',
    },
  ];

  const scoreItems = [
    { key: 'rev-sci', label: 'Scientific Value', score: scores.scientificValue },
    { key: 'rev-payload', label: 'Payload Balance', score: scores.payloadBalance },
    { key: 'rev-power', label: 'Power Compatibility', score: scores.powerCompatibility },
    { key: 'rev-prop', label: 'Propulsion Suitability', score: scores.propulsionSuitability },
    { key: 'rev-comm', label: 'Communication', score: scores.communication },
    { key: 'rev-dest', label: 'Destination Match', score: scores.destinationCompatibility },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Mission Review</h2>
        <p className="text-sm text-muted-foreground">Review your mission configuration before launch. You can go back to change any stage.</p>
      </div>

      {/* Overall readiness */}
      <div className={`p-4 rounded-xl border ${overall >= 70 ? 'bg-success/10 border-success/30' : overall >= 45 ? 'bg-warning/10 border-warning/30' : 'bg-danger/10 border-danger/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-foreground">Mission Readiness Score</div>
            <div className="text-xs text-muted-foreground">Educational simulation assessment</div>
          </div>
          <div className={`text-4xl font-bold font-mono ${overall >= 70 ? 'text-success' : overall >= 45 ? 'text-warning' : 'text-danger'}`}>
            {overall}
          </div>
        </div>
        <div className="mt-3 score-bar-track">
          <div
            className={`score-bar-fill ${overall >= 70 ? 'bg-success' : overall >= 45 ? 'bg-warning' : 'bg-danger'}`}
            style={{ width: `${overall}%` }}
          />
        </div>
        {overall < 45 && (
          <p className="text-xs text-danger mt-2">
            Low readiness score — consider reviewing power, propulsion, and communication compatibility with your destination.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration summary */}
        <div className="space-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Configuration</h3>
          <div className="space-y-2">
            {reviewItems.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-xs font-medium text-foreground truncate">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Analysis Scores</h3>
          <div className="space-y-3">
            {scoreItems.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <ScoreIcon score={item.score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-foreground">{item.label}</span>
                    <span className={`text-xs font-mono font-bold ${item.score >= 70 ? 'text-success' : item.score >= 40 ? 'text-warning' : 'text-danger'}`}>
                      {item.score}
                    </span>
                  </div>
                  <div className="score-bar-track h-1.5">
                    <div
                      className={`score-bar-fill ${item.score >= 70 ? 'bg-success' : item.score >= 40 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
        <p className="text-xs text-accent/90 font-medium">
          Ready to launch? Click "Launch Mission" below to begin your mission simulation.
          Your decisions during the mission may affect the final outcome.
        </p>
      </div>
    </div>
  );
}