'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMissionStore } from '@/lib/missionStore';
import { calculateMissionScores, MISSION_STAGES } from '@/lib/missionData';
import { computeMissionDNA } from '@/lib/missionDNA';
import ProgressBar from './ProgressBar';
import MissionStatusPanel from './MissionStatusPanel';
import DNAPanel from './DNAPanel';
import Stage0MissionName from './Stage0MissionName';
import Stage1Objective from './Stage1Objective';
import Stage2Destination from './Stage2Destination';
import Stage3Spacecraft from './Stage3Spacecraft';
import Stage4Instruments from './Stage4Instruments';
import Stage5Propulsion from './Stage5Propulsion';
import Stage6Power from './Stage6Power';
import Stage7Communication from './Stage7Communication';
import Stage8Review from './Stage8Review';
import { ChevronLeft, ChevronRight, Rocket, FlaskConical } from 'lucide-react';

export default function MissionDesignerClient() {
  const router = useRouter();
  const store = useMissionStore();
  const { mission, completeStage, goToStage, resetMission, getProgressPercent } = store;

  const scores = calculateMissionScores(mission);
  const dna = computeMissionDNA(mission, scores);
  const progress = getProgressPercent();

  const canAdvance = useCallback((): boolean => {
    const stage = mission.currentStage;
    if (stage === 0) return true; // name optional
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
      // Launch — the simulation reads the same in-memory session mission, so
      // the exact configuration flows through without any URL params.
      router.push('/mission-simulation-screen');
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
    8: <Stage8Review store={store} scores={scores} dna={dna} />,
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/what-if-lab')}
              className="btn-secondary text-xs px-3 py-2"
              title="Compare configuration alternatives"
            >
              <FlaskConical size={14} />
              What-If Lab
            </button>
            <button onClick={handleReset} className="btn-secondary text-xs px-3 py-2">
              Start Over
            </button>
          </div>
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

        {/* Right: Mission DNA + Advisor */}
        <div className="lg:block">
          <DNAPanel dna={dna} mission={mission} />
        </div>
      </div>
    </div>
  );
}