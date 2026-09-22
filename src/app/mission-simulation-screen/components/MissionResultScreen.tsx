'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { MissionResultData, MissionState, AnalysisScores } from '@/lib/missionData';
import { DESTINATIONS, SPACECRAFT_TYPES, OBJECTIVES, PROPULSION_SYSTEMS, POWER_SYSTEMS, COMMUNICATION_SYSTEMS, getOverallScore } from '@/lib/missionData';
import {
  CheckCircle, XCircle, AlertTriangle, Star, RotateCcw,
  BookOpen, Rocket, ChevronDown, ChevronUp
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface Props {
  result: MissionResultData;
  mission: MissionState;
  scores: AnalysisScores;
  onRestart: () => void;
}

const resultConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-success',
    border: 'border-success/40',
    bg: 'bg-success/5',
    glow: 'result-success-glow',
    badge: 'badge-success',
  },
  'success-challenges': {
    icon: AlertTriangle,
    iconColor: 'text-warning',
    border: 'border-warning/40',
    bg: 'bg-warning/5',
    glow: 'result-warning-glow',
    badge: 'badge-warning',
  },
  partial: {
    icon: AlertTriangle,
    iconColor: 'text-warning',
    border: 'border-warning/40',
    bg: 'bg-warning/5',
    glow: 'result-warning-glow',
    badge: 'badge-warning',
  },
  failure: {
    icon: XCircle,
    iconColor: 'text-danger',
    border: 'border-danger/40',
    bg: 'bg-danger/5',
    glow: 'result-danger-glow',
    badge: 'badge-danger',
  },
  breakthrough: {
    icon: Star,
    iconColor: 'text-accent',
    border: 'border-accent/40',
    bg: 'bg-accent/5',
    glow: 'result-success-glow',
    badge: 'badge-info',
  },
};

export default function MissionResultScreen({ result, mission, scores, onRestart }: Props) {
  const [showFullReport, setShowFullReport] = useState(false);
  const config = resultConfig[result.type];
  const Icon = config.icon;
  const overall = getOverallScore(scores);

  const destInfo = mission.destination ? DESTINATIONS[mission.destination] : null;
  const scInfo = mission.spacecraft ? SPACECRAFT_TYPES[mission.spacecraft] : null;
  const objInfo = mission.objective ? OBJECTIVES[mission.objective] : null;

  const suggestedMissions = [
    { label: 'Try Mars with a Rover', href: '/mission-designer' },
    { label: 'Try an Asteroid with an Orbiter', href: '/mission-designer' },
    { label: 'Try a Deep-Space Probe', href: '/mission-designer' },
    { label: 'Try a Space Telescope', href: '/mission-designer' },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* Result header */}
      <div className={`space-card ${config.border} border-2 ${config.bg} ${config.glow} p-8 mb-6 text-center`}>
        <div className="flex justify-center mb-4">
          <Icon size={56} className={config.iconColor} />
        </div>
        <div className={`badge ${config.badge} mb-3 inline-flex mx-auto text-sm px-4 py-1`}>
          {result.type === 'breakthrough' ? 'EXTRAORDINARY RESULT' : result.type.replace('-', ' ').toUpperCase()}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-mono tracking-wide">
          {result.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{result.subtitle}</p>

        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="text-center">
            <div className={`text-4xl font-bold font-mono ${overall >= 70 ? 'text-success' : overall >= 45 ? 'text-warning' : 'text-danger'}`}>
              {overall}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Mission Score</div>
          </div>
          {result.objectivesCompleted.length > 0 && (
            <div className="text-center">
              <div className="text-4xl font-bold font-mono text-success">
                {result.objectivesCompleted.length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Objectives Met</div>
            </div>
          )}
          {result.dataCollected.length > 0 && (
            <div className="text-center">
              <div className="text-4xl font-bold font-mono text-info">
                {result.dataCollected.length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Data Sets</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Objectives */}
        <div className="space-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Mission Objectives</h2>
          <div className="space-y-2">
            {result.objectivesCompleted.map((obj, i) => (
              <div key={`obj-complete-${i}`} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{obj}</span>
              </div>
            ))}
            {result.objectivesMissed.map((obj, i) => (
              <div key={`obj-missed-${i}`} className="flex items-start gap-2">
                <XCircle size={14} className="text-danger mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{obj}</span>
              </div>
            ))}
            {result.objectivesCompleted.length === 0 && result.objectivesMissed.length === 0 && (
              <p className="text-sm text-muted-foreground">No objectives recorded.</p>
            )}
          </div>
        </div>

        {/* Data collected */}
        <div className="space-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Science Data Collected</h2>
          <div className="space-y-2">
            {result.dataCollected.length > 0 ? result.dataCollected.map((d, i) => (
              <div key={`data-${i}`} className="flex items-start gap-2">
                <span className="text-info mt-0.5">·</span>
                <span className="text-sm text-foreground">{d}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No science data collected due to mission failure.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lessons learned */}
      <div className="space-card p-6 mb-6 border-info/30 border">
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
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations (for non-success) */}
      {result.recommendations.length > 0 && (
        <div className="space-card p-6 mb-6 border-warning/30 border">
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

      {/* Full mission report (collapsible) */}
      <div className="space-card p-6 mb-6">
        <button
          onClick={() => setShowFullReport(!showFullReport)}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={showFullReport}
          aria-controls="full-mission-report"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Full Mission Report</h2>
          {showFullReport ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        {showFullReport && (
          <div id="full-mission-report" className="mt-4 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { label: 'Mission Name', value: mission.missionName || 'Mission Alpha' },
                { label: 'Objective', value: objInfo?.label ?? '—' },
                { label: 'Destination', value: destInfo?.label ?? '—' },
                { label: 'Spacecraft', value: scInfo?.label ?? '—' },
                { label: 'Instruments', value: `${mission.instruments.length} selected` },
                { label: 'Propulsion', value: mission.propulsion ? PROPULSION_SYSTEMS[mission.propulsion].label : '—' },
                { label: 'Power', value: mission.power ? POWER_SYSTEMS[mission.power].label : '—' },
                { label: 'Communication', value: mission.communication ? COMMUNICATION_SYSTEMS[mission.communication].label : '—' },
                { label: 'Player Decision', value: result.playerDecisionSummary || 'No decision required' },
                { label: 'Final Outcome', value: result.title },
              ].map((item) => (
                <div key={`report-${item.label}`} className="bg-muted/30 rounded p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                  <div className="text-xs font-semibold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground italic">
                This mission report is a simplified educational simulation. Values and outcomes are not real mission predictions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Try different missions */}
      <div className="space-card p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Try a Different Mission
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {suggestedMissions.map((sm) => (
            <Link
              key={`suggest-${sm.label}`}
              href={sm.href}
              className="space-card p-3 text-center text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              {sm.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={onRestart} className="btn-accent text-base px-8 py-3">
          <Rocket size={18} />
          Design New Mission
        </button>
        <Link href="/" className="btn-secondary text-base px-8 py-3">
          <RotateCcw size={18} />
          Return Home
        </Link>
      </div>

      {/* Educational disclaimer */}
      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground">
          ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ is an independent educational project for NASA Space Apps Challenge 2026.
          Mission outcomes are simplified simulations, not real engineering assessments.
        </p>
      </div>
    </div>
  );
}