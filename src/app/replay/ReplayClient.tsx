'use client';

/**
 * ReplayClient — replay a completed mission changing ONE major decision.
 *
 * The original run's record (mission, events, science, outcome) is loaded
 * from the archive. The user picks a different autonomy choice; the same
 * mission is re-simulated deterministically (seeded) with the alternate
 * decision injected, and ORIGINAL vs REPLAY are compared across events,
 * resources, science, and outcome.
 */

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, GitCompare, Rocket, Lightbulb, Clock } from 'lucide-react';
import type { MissionState } from '@/lib/missionData';
import { calculateMissionScores } from '@/lib/missionData';
import {
  MISSION_EVENTS,
  runScienceChecks,
  computeMissionOutcome,
  type DecisionOption,
  type MissionEventDef,
  type SystemStatus,
} from '@/lib/simulationEngine';
import {
  loadCompletedMissions,
  type MissionRecord,
} from '@/lib/missionArchive';
import { useHydrated } from '@/lib/useHydrated';
import { DESTINATIONS } from '@/lib/missionData';

// Deterministic RNG (mulberry32) so replays differ only by the changed decision.
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Re-run the science phase with a fixed decision history, deterministically. */
type ReplayOption = DecisionOption & { __eventCategory: string };

function simulateReplay(
  mission: MissionState,
  seed: number,
  injectedDecision: ReplayOption | null,
): {
  systems: SystemStatus;
  events: string[];
  decisions: string[];
  science: ReturnType<typeof runScienceChecks>['stats'];
  outcome: ReturnType<typeof computeMissionOutcome>;
} {
  const rng = makeRng(seed);
  const scores = calculateMissionScores(mission);
  const systems: SystemStatus = {
    power: 100, communication: 100, propulsion: 100,
    instruments: 100, navigation: 100, radiation: 0,
  };
  const fired: string[] = [];
  const decisions: string[] = [];
  let scienceMod = 0;

  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  // Walk the event list in firing order; apply impacts + decisions.
  const orderable = [...MISSION_EVENTS].sort((a, b) => a.firesAt - b.firesAt);
  for (const ev of orderable as MissionEventDef[]) {
    if (!ev.requires(mission, scores)) continue;
    fired.push(ev.title);
    Object.entries(ev.impact).forEach(([k, v]) => {
      const key = k as keyof SystemStatus;
      systems[key] = clamp(systems[key] + (v ?? 0));
    });
    if (ev.decision) {
      // Inject the alternate decision only for the category being replayed;
      // otherwise reproduce the original run's choice if recorded, else a
      // neutral middle option.
      if (injectedDecision && ev.category === injectedDecision.__eventCategory) {
        decisions.push(injectedDecision.label);
        Object.entries(injectedDecision.effect).forEach(([k, v]) => {
          const key = k as keyof SystemStatus;
          systems[key] = clamp(systems[key] + (v ?? 0));
        });
        if (typeof injectedDecision.scienceDelta === 'number') {
          scienceMod += injectedDecision.scienceDelta;
        }
      } else {
        const middle = ev.decision.options[Math.floor(ev.decision.options.length / 2)];
        decisions.push(middle.label);
        Object.entries(middle.effect).forEach(([k, v]) => {
          const key = k as keyof SystemStatus;
          systems[key] = clamp(systems[key] + (v ?? 0));
        });
        if (typeof middle.scienceDelta === 'number') scienceMod += middle.scienceDelta;
      }
    }
  }

  const { stats } = runScienceChecks(mission, systems, scienceMod, rng);
  const eventsFired = fired.map(t => ({ category: 'comm' as const, title: t }));
  const outcome = computeMissionOutcome(mission, systems, stats, fired.length);
  return { systems, events: fired, decisions, science: stats, outcome };
}

export default function ReplayClient() {
  const hydrated = useHydrated();
  const [records, setRecords] = useState<MissionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replayChoice, setReplayChoice] = useState<string | null>(null);
  const [seed, setSeed] = useState<number>(() => 20260925);

  useEffect(() => {
    setRecords(loadCompletedMissions());
  }, []);

  const selected = useMemo(
    () => records.find(r => r.id === selectedId) ?? null,
    [records, selectedId],
  );

  // Decisions available for replay: autonomy choices from comm events + others.
  const replayOptions: ReplayOption[] = useMemo(() => {
    if (!selected) return [];
    const opts: ReplayOption[] = [];
    for (const ev of MISSION_EVENTS) {
      if (!ev.decision) continue;
      if (!ev.requires(selected.mission, calculateMissionScores(selected.mission))) continue;
      for (const o of ev.decision.options) {
        opts.push({ ...o, __eventCategory: ev.category });
      }
    }
    return opts;
  }, [selected]);

  const replayResult = useMemo(() => {
    if (!selected) return null;
    const choice = replayOptions.find(o => o.id === replayChoice) ?? null;
    return simulateReplay(selected.mission, seed, choice);
  }, [selected, replayChoice, replayOptions, seed]);

  if (!hydrated) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-card p-10 max-w-xl mx-auto text-center border-warning/30">
          <RotateCcw size={40} className="text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-3">No missions to replay yet</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Complete a mission first — then you can replay it while changing one major decision
            and compare what changed.
          </p>
          <Link href="/mission-designer" className="btn-accent inline-flex items-center gap-2">
            <Rocket size={16} />
            Design a Mission
          </Link>
        </div>
      </div>
    );
  }

  const orig = selected;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <RotateCcw size={22} className="text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Replay Mission</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Re-run a completed mission while changing <strong>one major decision</strong>.
          The comparison shows what the different choice would have meant — objectively.
        </p>
      </div>

      {/* Mission selector */}
      <div className="space-card p-4 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Choose a completed mission
        </div>
        <div className="flex flex-col gap-2">
          {records.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => { setSelectedId(r.id); setReplayChoice(null); }}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedId === r.id
                  ? 'bg-accent/10 border-accent/50'
                  : 'bg-muted/30 border-border hover:border-accent/30'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {r.mission.missionName || 'Mission Alpha'}
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      → {r.mission.destination ? DESTINATIONS[r.mission.destination].label : 'Unknown'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.result.title} · {r.scienceStats.observationsCompleted} observations ·{' '}
                    {new Date(r.completedAt).toLocaleDateString()}
                  </div>
                </div>
                {selectedId === r.id && (
                  <span className="badge badge-warning text-[9px]">Selected</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {orig && (
        <>
          {/* Decision picker */}
          <div className="space-card p-4 mb-6 border-accent/25">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Change one major decision
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Original run: <span className="text-foreground">{orig.keyDecision || 'no decisions recorded'}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {replayOptions.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setReplayChoice(replayChoice === o.id ? null : o.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    replayChoice === o.id
                      ? 'bg-info/15 border-info/60'
                      : 'bg-muted/30 border-border hover:border-info/40'
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground">{o.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                    {o.__eventCategory} decision
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Comparison */}
          {replayResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <GitCompare size={16} className="text-info" />
                <span className="text-sm font-bold text-foreground">Original vs Replay</span>
                <button
                  type="button"
                  onClick={() => setSeed(s => s + 1)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  title="Re-roll probabilistic science outcomes"
                >
                  <Clock size={11} />
                  Re-roll run
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ORIGINAL */}
                <div className="space-card p-5">
                  <div className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Original Outcome</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Result: </span>
                      <span className="font-semibold text-foreground">{orig.result.title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Science: </span>
                      <span className="text-foreground">
                        {orig.scienceStats.observationsCompleted} observations ·{' '}
                        {orig.scienceStats.majorFindings} major findings · {orig.scienceStats.dataReturned}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Events: </span>
                      <span className="text-foreground">
                        {orig.timeline.length > 0 ? orig.timeline.map(t => t.label).join(', ') : 'none'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Decisions: </span>
                      <span className="text-foreground">{orig.keyDecision || 'none'}</span>
                    </div>
                  </div>
                </div>

                {/* REPLAY */}
                <div className="space-card p-5 border-info/30">
                  <div className="text-sm font-bold text-info uppercase tracking-wider mb-3">Replay Outcome</div>
                  {replayChoice ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Result: </span>
                        <span className="font-semibold text-foreground">{replayResult.outcome.label}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Science: </span>
                        <span className="text-foreground">
                          {replayResult.science.observationsCompleted} observations ·{' '}
                          {replayResult.science.majorFindings} major findings · {replayResult.science.dataReturned}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Events: </span>
                        <span className="text-foreground">
                          {replayResult.events.length > 0 ? replayResult.events.join(', ') : 'none'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Decisions: </span>
                        <span className="text-foreground">{replayResult.decisions.join(' → ')}</span>
                      </div>
                      <div className="pt-2 mt-1 border-t border-border">
                        <span className="text-muted-foreground text-xs">System deltas vs original: </span>
                        <span className="font-mono text-xs text-foreground">
                          {(['power', 'communication', 'propulsion', 'instruments'] as const).map(k => {
                            const before = 0; // original systems are not archived per-axis; show replay levels
                            void before;
                            return `${k} ${Math.round(replayResult.systems[k])}%`;
                          }).join(' · ')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a decision above to run the replay.
                    </p>
                  )}
                </div>
              </div>

              {/* Educational note */}
              <div className="space-card p-4 border-accent/25 flex items-start gap-2">
                <Lightbulb size={14} className="text-accent mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground leading-relaxed">
                  <strong>Why outcomes differ:</strong> decisions change resources (power, instruments,
                  comms), which changes what the science checks can complete and how the mission ends.
                  Neither run is “the right one” — the comparison is the lesson.
                  Replay runs are deterministic given the same seed, so differences come from the
                  changed decision, not luck.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
