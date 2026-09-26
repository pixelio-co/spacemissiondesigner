'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMissionStore } from '@/lib/missionStore';
import { calculateMissionScores, MISSION_STAGES } from '@/lib/missionData';
import { computeMissionDna, getAdvisorInsights } from '@/lib/missionRules';
import ProgressBar from './ProgressBar';
import MissionStatusPanel from './MissionStatusPanel';
import AnalysisPanel from './AnalysisPanel';
import Stage0MissionName from './Stage0MissionName';
import Stage1Objective from './Stage1Objective';
import Stage2Destination from './Stage2Destination';
import Stage3Spacecraft from './Stage3Spacecraft';
import Stage4Instruments from './Stage4Instruments';
import Stage5Propulsion from './Stage5Propulsion';
import Stage6Power from './Stage6Power';
import Stage7Communication from './Stage7Communication';
import Stage8Review from './Stage8Review';
import MissionDna from '@/components/ui/MissionDna';
import MissionAdvisor from '@/components/ui/MissionAdvisor';
import WhatIfLab from '@/components/ui/WhatIfLab';
import { ChevronLeft, ChevronRight, Rocket, Dna, Sparkles, FlaskConical, BarChart3 } from 'lucide-react';

type RightTab = 'analysis' | 'dna' | 'advisor' | 'lab';

export default function MissionDesignerClient() {
  const router = useRouter();
  const store = useMissionStore();
  const { mission, completeStage, goToStage, resetMission, getProgressPercent } = store;
  const [rightTab, setRightTab] = useState<RightTab>('dna');

  const scores = calculateMissionScores(mission);
  const progress = getProgressPercent();
  const dna = useMemo(() => computeMissionDna(mission), [mission]);
  const advisorInsights = useMemo(() => getAdvisorInsights(mission), [mission]);

  const canAdvance = useCallback((): boolean => {
    const stage = mission.currentStage;
    if (stage === 0) return mission.missionName.trim().length > 0 || true; // name optional
    if (stage === 1) return mission.objective !== null;
    if (stage === 2) return mission.destination !== null;
    if (stage === 3) return mission.spacecraft !== null;
    if (stage === 4) return mission.instruments.length > 0;
    if (stage === 5) return mission.propulsion !== null;
    if (stage === 6) return mission.power !== null;
    if (stage === 7) return mission.communication !== null;
    if (stage === 8) return true;
    return false;
  }, [mission]);

  const handleNext = () => {
    if (!canAdvance()) {
      toast.error('Please make a selection before continuing.');
      return;
    }
    if (mission.currentStage === 8) {
      // Launch — navigate to simulation. The draft is NOT cleared here (that
      // would repaint this page at stage 0 mid-navigation); the simulation
      // screen clears the stored draft once it mounts. The mission itself is
      // fully encoded in the URL params, so nothing is lost.
      const params = new URLSearchParams({
        missionName: mission.missionName || 'Mission Alpha',
        objective: mission.objective ?? '',
        destination: mission.destination ?? '',
        spacecraft: mission.spacecraft ?? '',
        instruments: mission.instruments.join(','),
        propulsion: mission.propulsion ?? '',
        power: mission.power ?? '',
        communication: mission.communication ?? '',
      });
      router.push(`/mission-simulation-screen?${params.toString()}`);
      return;
    }
    completeStage(mission.currentStage);
  };

  const handleBack = () => {
    if (mission.currentStage > 0) {
      goToStage(mission.currentStage - 1);
    }
  };

  const handleReset = () => {
    resetMission();
    toast.success('Mission reset. Start fresh!');
  };

  const stageComponents: Record<number, React.ReactNode> = {
    0: <Stage0MissionName store={store} />,
    1: <Stage1Objective store={store} />,
    2: <Stage2Destination store={store} />,
    3: <Stage3Spacecraft store={store} />,
    4: <Stage4Instruments store={store} />,
    5: <Stage5Propulsion store={store} />,
    6: <Stage6Power store={store} />,
    7: <Stage7Communication store={store} />,
    8: <Stage8Review store={store} scores={scores} />,
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mission Designer</h1>
            <p className="text-sm text-muted-foreground">Design your space mission step by step</p>
          </div>
          <button onClick={handleReset} className="btn-secondary text-xs px-3 py-2">
            Start Over
          </button>
        </div>
        <ProgressBar
          stages={MISSION_STAGES}
          currentStage={mission.currentStage}
          completedStages={mission.completedStages}
          progress={progress}
          onStageClick={goToStage}
        />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] xl:grid-cols-[260px_1fr_300px] gap-6">
        {/* Left: Mission Status */}
        <div className="lg:block">
          <MissionStatusPanel mission={mission} progress={progress} />
        </div>

        {/* Center: Stage Content */}
        <div className="min-w-0">
          <div className="space-card p-6 min-h-[500px] flex flex-col">
            <div className="flex-1 animate-fadeIn">
              {stageComponents[mission.currentStage] ?? (
                <div className="text-muted-foreground text-center py-10">Stage not found.</div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
              <button
                onClick={handleBack}
                disabled={mission.currentStage === 0}
                className="btn-secondary disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <div className="text-xs font-mono text-muted-foreground">
                Stage {mission.currentStage + 1} of {MISSION_STAGES.length}
              </div>

              <button
                onClick={handleNext}
                className={mission.currentStage === 8 ? 'btn-accent' : 'btn-primary'}
              >
                {mission.currentStage === 8 ? (
                  <>
                    <Rocket size={16} />
                    Launch Mission
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Analysis tabs — DNA / Advisor / What-If / Scores */}
        <div className="lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-card border border-border">
              {([
                { key: 'dna' as const, label: 'DNA', icon: Dna },
                { key: 'advisor' as const, label: 'Advisor', icon: Sparkles },
                { key: 'lab' as const, label: 'Lab', icon: FlaskConical },
                { key: 'analysis' as const, label: 'Scores', icon: BarChart3 },
              ]).map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={`tab-${tab.key}`}
                    type="button"
                    onClick={() => setRightTab(tab.key)}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-md text-[10px] font-medium uppercase tracking-wide transition-colors ${
                      rightTab === tab.key
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={rightTab === tab.key}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {rightTab === 'dna' && <MissionDna dna={dna} />}
            {rightTab === 'advisor' && <MissionAdvisor insights={advisorInsights} />}
            {rightTab === 'lab' && <WhatIfLab mission={mission} />}
            {rightTab === 'analysis' && <AnalysisPanel scores={scores} mission={mission} />}
          </div>
        </div>
      </div>
    </div>
  );
}