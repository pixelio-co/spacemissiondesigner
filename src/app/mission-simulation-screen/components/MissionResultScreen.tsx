'use client';

/**
 * MISSION RESULT SCREEN
 * The end-of-mission debrief: full report, Science Return summary,
 * Failure Investigator (for trouble), lessons, and Replay.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SimulationRecord, AutonomyChoice } from '@/lib/simulationEngine';
import { runMission } from '@/lib/simulationEngine';
import { loadMissionRecords } from '@/lib/missionHistory';
import {
  CheckCircle, XCircle, AlertTriangle, Star, RotateCcw, BookOpen, Rocket,
  ChevronDown, ChevronUp, Search, FlaskConical, Repeat, GitCompare,
} from 'lucide-react';
import ArchitectureDiagram from '@/components/ui/ArchitectureDiagram';
import MissionDna from '@/components/ui/MissionDna';
import { computeMissionDna } from '@/lib/missionRules';

interface Props {
  record: SimulationRecord;
  replayMode: boolean;
  replayChangedLabel: string | null;
  savedRecordId: string | null;
}

const resultConfig = {
  success: { icon: CheckCircle, iconColor: 'text-success', border: 'border-success/40', bg: 'bg-success/5', glow: 'result-success-glow', badge: 'badge-success' },
  'success-challenges': { icon: AlertTriangle, iconColor: 'text-warning', border: 'border-warning/40', bg: 'bg-warning/5', glow: 'result-warning-glow', badge: 'badge-warning' },
  partial: { icon: AlertTriangle, iconColor: 'text-warning', border: 'border-warning/40', bg: 'bg-warning/5', glow: 'result-warning-glow', badge: 'badge-warning' },
  failure: { icon: XCircle, iconColor: 'text-danger', border: 'border-danger/40', bg: 'bg-danger/5', glow: 'result-danger-glow', badge: 'badge-danger' },
  breakthrough: { icon: Star, iconColor: 'text-accent', border: 'border-accent/40', bg: 'bg-accent/5', glow: 'result-success-glow', badge: 'badge-info' },
} as const;

const OUTCOME_LABEL: Record<SimulationRecord['outcomes']['type'], string> = {
  success: 'Successful',
  'success-challenges': 'Successful with Challenges',
  partial: 'Partially Successful',
  failure: 'Ended Early',
  breakthrough: 'Extraordinary Scientific Result',
};

/** One major decision the replay can change. */
interface ReplayOption {
  key: string;
  label: string;
  detail: string;
  autonomy?: AutonomyChoice;
  query: Record<string, string>;
}

function buildReplayOptions(record: SimulationRecord): ReplayOption[] {
  const opts: ReplayOption[] = [];
  const autonomyDecision = record.decisions.find(d => d.kind === 'autonomy');

  if (autonomyDecision) {
    const alternatives: { choice: AutonomyChoice; label: string; detail: string }[] = [
      { choice: 'continue-science', label: 'Continue planned science', detail: 'Science continues autonomously; more observations, higher power draw.' },
      { choice: 'safe-mode', label: 'Safe mode', detail: 'Protects spacecraft resources; science pauses.' },
      { choice: 'wait', label: 'Wait for communication', detail: 'Conservative hold; may miss observation windows.' },
    ];
    // Current choice: infer from the recorded effects.
    const currentIsContinue = autonomyDecision.optionLabel.toLowerCase().includes('continue');
    const currentIsSafe = autonomyDecision.optionLabel.toLowerCase().includes('safe');
    alternatives.forEach(alt => {
      const isCurrent =
        (currentIsContinue && alt.choice === 'continue-science') ||
        (currentIsSafe && alt.choice === 'safe-mode') ||
        (!currentIsContinue && !currentIsSafe && alt.choice === 'wait');
      if (!isCurrent) {
        opts.push({
          key: `replay-autonomy-${alt.choice}`,
          label: `During communication interruption → ${alt.label}`,
          detail: alt.detail,
          autonomy: alt.choice,
          query: { autonomy: alt.choice, replayLabel: `Autonomy: ${alt.label}` },
        });
      }
    });
  }

  // Decision replays: re-run each player decision with a different option.
  const playerDecisions = record.decisions.filter(d => d.kind === 'player');
  playerDecisions.forEach(d => {
    const ev = record.events.find(e => e.id === d.eventId);
    if (!ev?.scenario) return;
    opts.push({
      key: `replay-decision-${d.eventId}`,
      label: `${d.eventTitle} → different response`,
      detail: 'Re-run the mission answering this event differently and compare what changes.',
      query: { replayDecision: d.eventId, replayLabel: `${d.eventTitle} — alternative response` },
    });
  });

  return opts.slice(0, 3);
}

export default function MissionResultScreen({ record, replayMode, replayChangedLabel, savedRecordId }: Props) {
  const router = useRouter();
  const [showFullReport, setShowFullReport] = useState(false);
  const [replayOpen, setReplayOpen] = useState(replayMode);
  const config = resultConfig[record.outcomes.type];
  const Icon = config.icon;
  const mission = record.mission;

  const dna = useMemo(() => computeMissionDna(mission), [mission]);

  // For replay mode: find the original record to compare against.
  const originalRecord = useMemo(() => {
    if (!replayMode) return null;
    const records = loadMissionRecords();
    // The most recent record that isn't this run's mission-with-changed-decision.
    return records.find(r => r.record.seed === record.seed && r.record.endProgress !== record.endProgress)
      ?? records[1]
      ?? records[0]
      ?? null;
  }, [replayMode, record]);

  const replayOptions = useMemo(() => buildReplayOptions(record), [record]);

  const startReplay = (opt: ReplayOption) => {
    const params = new URLSearchParams({
      missionName: mission.missionName || 'Mission Alpha',
      objective: mission.objective ?? '',
      destination: mission.destination ?? '',
      spacecraft: mission.spacecraft ?? '',
      instruments: mission.instruments.join(','),
      propulsion: mission.propulsion ?? '',
      power: mission.power ?? '',
      communication: mission.communication ?? '',
      replay: savedRecordId ?? '1',
      ...(opt.autonomy ? { autonomy: opt.autonomy } : {}),
      ...(opt.query.replayLabel ? { replayLabel: opt.query.replayLabel } : {}),
    });
    router.push(`/mission-simulation-screen?${params.toString()}`);
  };

  const sci = record.scienceReturn;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* Result header */}
      <div className={`space-card ${config.border} border-2 ${config.bg} ${config.glow} p-8 mb-6 text-center`}>
        <div className="flex justify-center mb-4">
          <Icon size={56} className={config.iconColor} />
        </div>
        <div className={`badge ${config.badge} mb-3 inline-flex mx-auto text-sm px-4 py-1`}>
          {OUTCOME_LABEL[record.outcomes.type]}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-mono tracking-wide">
          {record.outcomes.title}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{record.outcomes.subtitle}</p>
        <p className="text-xs text-muted-foreground/80 max-w-2xl mx-auto mt-2 italic">{record.outcomes.explanation}</p>

        <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
          <div className="text-center">
            <div className="text-4xl font-bold font-mono text-info">{sci.observationsCompleted}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Observations</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold font-mono text-accent">{sci.majorFindings}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Major Findings</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold font-mono text-success">{sci.objectivesCompletedPercent}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Objectives Completed</div>
          </div>
        </div>
      </div>

      {/* Replay banner when this IS a replay */}
      {replayMode && replayChangedLabel && (
        <div className="space-card p-4 mb-6 border-accent/40 border-2 bg-accent/5">
          <div className="flex items-center gap-2 mb-2">
            <Repeat size={16} className="text-accent" />
            <h2 className="text-sm font-bold text-accent uppercase tracking-wider">Replay Result</h2>
          </div>
          <p className="text-sm text-foreground">
            You changed one decision: <strong>{replayChangedLabel}</strong>.
            {originalRecord && (
              <> Original outcome: <strong>{originalRecord.record.outcomes.title}</strong> →
              This replay: <strong>{record.outcomes.title}</strong>.</>
            )}
          </p>
          {originalRecord && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Observations', orig: originalRecord.record.observationsCompleted, replay: record.observationsCompleted },
                { label: 'Data returned (GB)', orig: originalRecord.record.dataReturnedGb, replay: record.dataReturnedGb },
                { label: 'Objectives completed (%)', orig: originalRecord.record.scienceReturn.objectivesCompletedPercent, replay: record.scienceReturn.objectivesCompletedPercent },
              ].map(cmp => {
                const diff = cmp.replay - cmp.orig;
                return (
                  <div key={`cmp-${cmp.label}`} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{cmp.label}</div>
                    <div className="text-xs font-mono flex items-center gap-2">
                      <span className="text-muted-foreground">{cmp.orig}</span>
                      <GitCompare size={10} className="text-muted-foreground/60" />
                      <span className="text-foreground font-bold">{cmp.replay}</span>
                      <span className={diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : 'text-muted-foreground'}>
                        ({diff > 0 ? '+' : ''}{diff})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SCIENCE RETURN */}
      <div className="space-card p-6 mb-6 border-info/30 border">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={18} className="text-info" />
          <h2 className="text-base font-bold text-foreground">Science Return</h2>
          <span className="badge badge-neutral text-[9px]">Based on what actually happened</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Observations completed', value: sci.observationsCompleted, color: 'text-info' },
            { label: 'Instruments operated', value: `${sci.instrumentsOperated}/${mission.instruments.length}`, color: 'text-success' },
            { label: 'Major findings', value: sci.majorFindings, color: 'text-accent' },
            { label: 'Data returned', value: `${sci.dataReturnedGb} GB`, color: 'text-primary' },
            { label: 'Objectives completed', value: `${sci.objectivesCompletedPercent}%`, color: 'text-success' },
          ].map(item => (
            <div key={`sci-${item.label}`} className="p-3 rounded-lg bg-muted/30 border border-border text-center">
              <div className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {Object.entries(sci.explanations).map(([key, text]) => (
            <div key={`sci-exp-${key}`} className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-info font-semibold">Why: </span>{text}
            </div>
          ))}
        </div>
        {record.discoveries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Observation log — each enabled by your instruments
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {record.discoveries.map(d => (
                <div key={d.id} className="text-xs p-2 rounded bg-muted/20 border border-border flex items-start gap-2">
                  <span className={d.significance === 'major' ? 'text-accent' : 'text-success'}>{d.significance === 'major' ? '★' : '·'}</span>
                  <div>
                    <span className="text-foreground font-medium">{d.label}</span>
                    <span className="text-muted-foreground"> — {d.instrumentLabel} · {d.time}</span>
                    <div className="text-[10px] text-muted-foreground/80 italic">{d.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MISSION FAILURE INVESTIGATOR */}
      {record.failureInvestigation && (
        <div className="space-card p-6 mb-6 border-warning/40 border-2">
          <div className="flex items-center gap-2 mb-4">
            <Search size={18} className="text-warning" />
            <h2 className="text-base font-bold text-foreground">Mission Failure Investigator</h2>
            <span className="badge badge-neutral text-[9px]">Educational explanation — not blame</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="text-xs font-semibold text-warning uppercase tracking-wider mb-1">What happened?</div>
                <p className="text-xs text-foreground leading-relaxed">{record.failureInvestigation.whatHappened}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="text-xs font-semibold text-warning uppercase tracking-wider mb-1">Why did it happen?</div>
                <p className="text-xs text-foreground leading-relaxed">{record.failureInvestigation.whyItHappened}</p>
              </div>
              {record.failureInvestigation.systemsInvolved.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Systems involved</div>
                  <div className="flex flex-wrap gap-1.5">
                    {record.failureInvestigation.systemsInvolved.map(s => (
                      <span key={`sys-${s}`} className="badge badge-neutral text-[9px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                <div className="text-xs font-semibold text-info uppercase tracking-wider mb-1.5">What could have been done differently?</div>
                <div className="space-y-2">
                  {record.failureInvestigation.alternatives.map((alt, i) => (
                    <div key={`alt-${i}`}>
                      <div className="text-xs text-foreground font-medium">· {alt.action}</div>
                      <div className="text-[11px] text-muted-foreground pl-3">{alt.likelyEffect}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Educational lesson</div>
                <p className="text-xs text-foreground leading-relaxed">{record.failureInvestigation.lesson}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPLAY MISSION */}
      {!replayMode && replayOptions.length > 0 && (
        <div className="space-card p-6 mb-6">
          <button
            onClick={() => setReplayOpen(o => !o)}
            className="flex items-center justify-between w-full text-left"
            aria-expanded={replayOpen}
          >
            <div className="flex items-center gap-2">
              <Repeat size={18} className="text-accent" />
              <div>
                <h2 className="text-base font-bold text-foreground">Replay Mission</h2>
                <p className="text-xs text-muted-foreground">Change one major decision and see how the story changes.</p>
              </div>
            </div>
            {replayOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>

          {replayOpen && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
              {replayOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => startReplay(opt)}
                  className="option-card p-4 text-left"
                >
                  <div className="text-sm font-semibold text-foreground mb-1">{opt.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{opt.detail}</div>
                  <div className="text-[10px] text-accent mt-2 font-mono uppercase tracking-wider">Run this replay →</div>
                </button>
              ))}
              <div className="sm:col-span-2 text-[10px] text-muted-foreground italic">
                Replays change exactly one decision — everything else stays the same, so differences
                in the outcome show that decision's true effect.
              </div>
            </div>
          )}
        </div>
      )}

      {/* MISSION PERFORMANCE summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Mission Performance</h2>
          <div className="space-y-2">
            {[
              { label: 'Final power reserves', value: `${Math.round(record.finalSystems.power)}%` },
              { label: 'Communication health', value: `${Math.round(record.finalSystems.communication)}%` },
              { label: 'Propulsion health', value: `${Math.round(record.finalSystems.propulsion)}%` },
              { label: 'Instrument health', value: `${Math.round(record.finalSystems.instruments)}%` },
              { label: 'Mission progress reached', value: `${record.endProgress}%` },
            ].map(item => (
              <div key={`perf-${item.label}`} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
          {record.decisions.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Decisions made</div>
              <div className="space-y-1.5">
                {record.decisions.map(d => (
                  <div key={`dec-${d.eventId}`} className="text-xs p-2 rounded bg-muted/20 border border-border">
                    <span className="text-foreground font-medium">{d.eventTitle}</span>
                    <span className="text-muted-foreground"> → {d.optionLabel}</span>
                    <div className="text-[10px] text-muted-foreground/80 italic mt-0.5">{d.consequence}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mission DNA at completion */}
        <MissionDna dna={dna} compact />
      </div>

      {/* Lessons learned */}
      <div className="space-card p-6 mb-6 border-info/30 border">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-info" />
          <h2 className="text-base font-bold text-foreground">What Did You Learn?</h2>
        </div>
        <div className="space-y-4">
          {record.lessons.map((lesson, i) => (
            <div key={`lesson-${i}`} className="p-4 rounded-lg bg-info/5 border border-info/20">
              <div className="text-xs font-semibold text-info uppercase tracking-wider mb-1">{lesson.concept}</div>
              <p className="text-sm text-foreground leading-relaxed mb-2">{lesson.lesson}</p>
              <Link
                href={`/learn${lesson.learnHref}`}
                className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <BookOpen size={10} />
                Explore this concept
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {record.recommendations.length > 0 && (
        <div className="space-card p-6 mb-6 border-warning/30 border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Try Next</h2>
          <div className="space-y-2">
            {record.recommendations.map((rec, i) => (
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
          <div id="full-mission-report" className="mt-4 space-y-4 animate-fadeIn">
            <ArchitectureDiagram mission={mission} compact />

            {/* Communication transparency */}
            <div className="p-3 rounded bg-info/5 border border-info/20">
              <div className="text-xs font-semibold text-info uppercase tracking-wider mb-1">Communication delays (computed from real data)</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                One-way light-time: <span className="font-mono text-foreground">{record.commDelayInfo.oneWay}</span> ·
                Round trip: <span className="font-mono text-foreground">{record.commDelayInfo.roundTrip}</span>.
                {record.commDelayInfo.distanceNote}
              </p>
            </div>

            <div className="p-3 rounded bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground italic">
                This mission report is a simplified educational simulation based on transparent rules —
                not real engineering predictions. Destination facts come from NASA public datasets
                (see About → Data Sources).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={() => router.push('/mission-designer')} className="btn-accent text-base px-8 py-3">
          <Rocket size={18} />
          Design New Mission
        </button>
        <Link href="/learn" className="btn-secondary text-base px-8 py-3">
          <BookOpen size={18} />
          Learn More
        </Link>
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
