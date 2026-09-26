'use client';

/**
 * MISSION ADVISOR — rule-based, fully transparent recommendations.
 * Explains WHICH rule produced each insight and often cites a real mission.
 * Never claims to be an official AI or NASA system.
 */

import React from 'react';
import type { AdvisorInsight } from '@/lib/missionRules';
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Sparkles } from 'lucide-react';

interface Props {
  insights: AdvisorInsight[];
}

const severityConfig: Record<AdvisorInsight['severity'], {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  critical: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', label: 'Review' },
  caution: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'Caution' },
  good: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', label: 'Strength' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-info/30', label: 'Insight' },
};

export default function MissionAdvisor({ insights }: Props) {
  return (
    <div className="space-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mission Advisor
        </span>
        <span className="badge badge-neutral text-[9px]">Rule-based</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Transparent rules — every insight shows the rule behind it. Not an AI system, and not affiliated with any agency.
      </p>

      {insights.length === 0 ? (
        <div className="text-center py-6">
          <Lightbulb size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Advisor insights appear as you design — pick a destination to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map(insight => {
            const cfg = severityConfig[insight.severity];
            const Icon = cfg.icon;
            return (
              <div key={insight.id} className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2.5">
                  <Icon size={14} className={`${cfg.color} mt-0.5 flex-shrink-0`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${cfg.color}`}>{insight.title}</span>
                      <span className={`badge badge-neutral text-[8px] ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{insight.detail}</p>
                    <div className="text-[10px] text-muted-foreground/80 italic mb-1">
                      Rule: {insight.rule}
                    </div>
                    {insight.realMissionExample && (
                      <div className="text-[10px] text-info/90 flex items-start gap-1">
                        <span className="flex-shrink-0">🛰️</span>
                        <span>{insight.realMissionExample}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
