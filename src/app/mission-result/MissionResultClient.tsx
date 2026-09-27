'use client';

/**
 * MissionResultClient — the standalone Mission Result Screen.
 *
 * It renders ONLY the result of a simulation completed in the current session
 * (held in the in-memory session store). With no session result it shows a
 * "No Mission Result" empty state — never an old or fake result, because
 * nothing is persisted across a browser refresh.
 */

import React, { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, AlertTriangle } from 'lucide-react';
import {
  subscribeSession,
  getSessionState,
  clearMissionResult,
  clearActiveMission,
} from '@/lib/missionArchive';
import MissionResultScreen from '@/app/mission-simulation-screen/components/MissionResultScreen';

export default function MissionResultClient() {
  const router = useRouter();
  const snapshot = useSyncExternalStore(
    subscribeSession,
    () => getSessionState().missionResult,
    () => null,
  );

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="space-card p-10 max-w-lg w-full text-center border-warning/40 border">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mx-auto mb-6">
            <AlertTriangle size={32} className="text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">No Mission Result</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Complete a mission simulation to view your results.
          </p>
          <button
            onClick={() => router.push('/mission-designer')}
            className="btn-accent text-base px-8 py-3 inline-flex items-center gap-2"
          >
            <Rocket size={18} />
            Create Mission
          </button>
        </div>
      </div>
    );
  }

  return (
    <MissionResultScreen
      result={snapshot.result}
      mission={snapshot.mission}
      science={snapshot.science}
      investigation={snapshot.investigation}
      events={snapshot.events}
      onRestart={() => {
        clearMissionResult();
        clearActiveMission();
        router.push('/mission-designer');
      }}
    />
  );
}
