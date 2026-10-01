'use client';

/**
 * MissionResultScreen — the final mission report.
 *
 * Sections: MISSION OVERVIEW · MISSION CONFIGURATION · SCIENCE RETURN ·
 * MISSION PERFORMANCE · MISSION OUTCOME · FAILURE INVESTIGATOR (when the
 * mission struggled) · MISSION LESSONS · Replay/Learn/New Mission actions.
 */

import React from 'react';
import Link from 'next/link';
import type { MissionState, MissionResultData } from '@/lib/missionData';
import {
  DESTINATIONS, SPACECRAFT_TYPES, OBJECTIVES,
  PROPULSION_SYSTEMS, POWER_SYSTEMS, COMMUNICATION_SYSTEMS, INSTRUMENTS,
} from '@/lib/missionData';
import type { ScienceStats, EventCategory, InvestigationNode } from '@/lib/simulationEngine';
import { getCommDelay } from '@/lib/simulationEngine';
import { getDestinationFacts } from '@/lib/spaceData';
import { computeMissionDNA } from '@/lib/missionDNA';
import DNABars from '@/components/ui/DNABars';
import {
  CheckCircle, XCircle, AlertTriangle, Star, RotateCcw, BookOpen, Rocket,
  Search, Lightbulb, FlaskConical, ArrowRight,
} from 'lucide-react';

interface Props {
  result: MissionResultData;
  mission: MissionState;
  science: ScienceStats | null;
  investigation: InvestigationNode | null;
  events: { category: EventCategory; title: string }[];
  onRestart: () => void;
}

const resultConfig: Record<MissionResultData['type'], {
  icon: React.ElementType; iconColor: string; border: string; bg: string; glow: string; badge: string;
}> = {
  success: { icon: CheckCircle, iconColor: 'text-success', border: 'border-success/40', bg: 'bg-success/5', glow: 'result-success-glow', badge: 'badge-success' },
  'success-challenges': { icon: AlertTriangle, iconColor: 'text-warning', border: 'border-warning/40', bg: 'bg-warning/5', glow: 'result-warning-glow', badge: 'badge-warning' },
  partial: { icon: AlertTriangle, iconColor: 'text-warning', border: 'border-warning/40', bg: 'bg-warning/5', glow: 'result-warning-glow', badge: 'badge-warning' },
  failure: { icon: XCircle, iconColor: 'text-danger', border: 'border-danger/40', bg: 'bg-danger/5', glow: 'result-danger-glow', badge: 'badge-danger' },
  breakthrough: { icon: Star, iconColor: 'text-accent', border: 'border-accent/40', bg: 'bg-accent/5', glow: 'result-success-glow', badge: 'badge-info' },
};

export default function MissionResultScreen({
  result, mission, science, investigation, events, onRestart,
}: Props) {
  const config = resultConfig[result.type];
  const Icon = config.icon;
  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;
  const facts = mission.destination ? getDestinationFacts(mission.destination) : null;
  const scInfo = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;
  const objInfo = mission.objective ? OBJECTIVES[mission.objective] : null;
  const delay = getCommDelay(mission.destination);
  const dna = computeMissionDNA(mission);

  const scienceCards = science ? [
    { label: 'Observations completed', value: String(science.observationsCompleted), color: 'text-success' },
    { label: 'Instruments operated', value: `${science.instrumentsOperated}/${mission.instruments.length}`, color: 'text-info' },
    { label: 'Major findings', value: String(science.majorFindings), color: 'text-accent' },
    { label: 'Data returned', value: science.dataReturned, color: 'text-primary' },
    { label: 'Objectives completed', value: `${science.objectivesCompletedPercent}%`, color: 'text-success' },
  ] : [];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* ── Result header ── */}
      <div className={`space-card ${config.border} border-2 ${config.bg} ${config.glow} p-8 mb-6 text-center`}>
        <div className="flex justify-center mb-4">
          <Icon size={56} className={config.iconColor} />
        </div>
        <div className={`badge ${config.badge} mb-3 inline-flex mx-auto text-sm px-4 py-1`}>
          MISSION OUTCOME
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-mono tracking-wide">
          {result.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{result.subtitle}</p>
      </div>

      {/* ── Science Return ── */}
      {science && (
        <div className="space-card p-6 mb-6 border-success/25">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={16} className="text-success" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Science Return
            </h2>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Based on what actually happened during your simulation
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {scienceCards.map(card => (
              <div key={`sci-${card.label}`} className="p-3 rounded-lg bg-muted/40 border border-border text-center">
                <div className={`text-2xl font-bold font-mono ${card.color}`}>{card.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mission Overview + Configuration ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Mission Overview</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Mission Name', value: mission.missionName || 'Mission Alpha' },
              { label: 'Objective', value: objInfo ? `${objInfo.icon} ${objInfo.label}` : '—' },
              { label: 'Destination', value: destInfo ? `${destInfo.icon} ${destInfo.label}` : '—' },
              { label: 'Spacecraft', value: scInfo?.label ?? '—' },
            ].map(item => (
              <div key={`ov-${item.label}`} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground text-right">{item.value}</span>
              </div>
            ))}
            {facts && (
              <div className="pt-2 mt-2 border-t border-border text-[10px] text-muted-foreground leading-relaxed">
                <strong>Destination conditions (NASA planetary data):</strong> {facts.tempRangeC ?? ''} ·
                gravity {facts.gravityMs2} m/s² · one-way light time ≈ {delay.oneWayLabel}.
              </div>
            )}
          </div>
        </div>

        <div className="space-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Mission Configuration</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Instruments', value: mission.instruments.map(i => INSTRUMENTS[i].label).join(', ') || '—' },
              { label: 'Propulsion', value: mission.propulsion ? PROPULSION_SYSTEMS[mission.propulsion].label : '—' },
              { label: 'Power', value: mission.power ? POWER_SYSTEMS[mission.power].label : '—' },
              { label: 'Communication', value: mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].label : '—' },
            ].map(item => (
              <div key={`cfg-${item.label}`} className="text-sm">
                <span className="text-muted-foreground">{item.label}: </span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mission Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Mission Performance</h2>
          <div className="space-y-2">
            {result.objectivesCompleted.map((obj, i) => (
              <div key={`perf-ok-${i}`} className="flex items-start gap-2">
                <CheckCircle size={13} className="text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{obj}</span>
              </div>
            ))}
            {result.objectivesMissed.map((obj, i) => (
              <div key={`perf-missed-${i}`} className="flex items-start gap-2">
                <XCircle size={13} className="text-danger mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{obj}</span>
              </div>
            ))}
            {result.objectivesCompleted.length === 0 && result.objectivesMissed.length === 0 && (
              <p className="text-sm text-muted-foreground">No performance records.</p>
            )}
          </div>
        </div>

        <div className="space-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Major Events</h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No significant anomalies — your configuration handled the mission environment smoothly.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((ev, i) => (
                <div key={`ev-${i}`} className="flex items-start gap-2">
                  <AlertTriangle size={13} className="text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-foreground">{ev.title}</span>
                    <span className="text-xs text-muted-foreground block capitalize">
                      {ev.category} challenge
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.playerDecisionSummary !== 'No decision required' && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Your Decisions</div>
              <p className="text-sm text-foreground">{result.playerDecisionSummary}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Failure Investigator ── */}
      {investigation && (
        <div className="space-card p-6 mb-6 border-danger/30">
          <div className="flex items-center gap-2 mb-1">
            <Search size={16} className="text-danger" />
            <h2 className="text-base font-bold text-foreground">Mission Failure Investigator</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            An educational explanation of what happened — not a blame assignment.
            Real failures are usually systemic, not personal.
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-danger/5 border border-danger/20">
              <div className="text-xs font-bold text-danger uppercase tracking-wider mb-1">What happened?</div>
              <p className="text-sm text-foreground leading-relaxed">{investigation.cause}</p>
            </div>

            {investigation.contributingFactors.length > 0 && (
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="text-xs font-bold text-warning uppercase tracking-wider mb-1">Why did it happen? (contributing factors)</div>
                <ul className="space-y-1">
                  {investigation.contributingFactors.map((f, i) => (
                    <li key={`factor-${i}`} className="text-sm text-foreground flex items-start gap-1.5">
                      <span className="text-warning mt-1">•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Systems involved</div>
                <div className="flex flex-wrap gap-1">
                  {investigation.systemsInvolved.map(s => (
                    <span key={s} className="badge badge-neutral text-[9px] normal-case">{s}</span>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                <div className="text-xs font-bold text-info uppercase tracking-wider mb-1">What could have been done differently?</div>
                <ul className="space-y-1">
                  {investigation.whatCouldHaveBeenDone.map((f, i) => (
                    <li key={`fix-${i}`} className="text-xs text-foreground flex items-start gap-1.5">
                      <span className="text-info mt-0.5">→</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 flex items-start gap-2">
              <Lightbulb size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                <strong className="text-accent">Educational lesson: </strong>
                {investigation.educationalLesson}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Mission Lessons ── */}
      <div className="space-card p-6 mb-6 border-info/30">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-info" />
          <h2 className="text-base font-bold text-foreground">What Did You Learn?</h2>
        </div>
        <div className="space-y-4">
          {result.lessons.map((lesson, i) => (
            <div key={`lesson-${i}`} className="p-4 rounded-lg bg-info/5 border border-info/20">
              <div className="text-xs font-semibold text-info uppercase tracking-wider mb-1">{lesson.concept}</div>
              <p className="text-sm text-foreground leading-relaxed mb-2">{lesson.lesson}</p>
              <Link
                href={lesson.learnHref}
                className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <BookOpen size={10} />
                Explore this concept
                <ArrowRight size={10} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mission DNA at completion ── */}
      <div className="space-card p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Final Mission DNA
        </h2>
        <DNABars dna={dna} showExplanations={false} dense />
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          Educational summary of your configuration — not a professional engineering score.
        </p>
      </div>

      {/* ── Recommendations ── */}
      {result.recommendations.length > 0 && (
        <div className="space-card p-6 mb-6 border-warning/30">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">How to Improve</h2>
          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <div key={`rec-${i}`} className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-warning mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="space-card p-6 mb-6 border-accent/30">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Understand Your Mission Deeper
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Replay a key decision, or review what you learned.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/replay" className="btn-secondary w-full sm:w-auto justify-center">
            <RotateCcw size={14} />
            Replay Mission
          </Link>
          <Link href="/learn" className="btn-secondary w-full sm:w-auto justify-center">
            <BookOpen size={14} />
            What Did You Learn?
          </Link>
          <button onClick={onRestart} className="btn-accent w-full sm:w-auto justify-center">
            <Rocket size={16} />
            Design New Mission
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ is an independent educational project for the NASA Space Apps
          Challenge 2026. Mission outcomes are simplified educational simulations, not real
          engineering assessments. Destination data from NASA public datasets — see
          the <Link href="/about" className="text-primary hover:underline">Data Sources</Link> section.
        </p>
      </div>
    </div>
  );
}
