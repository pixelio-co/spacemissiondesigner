'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { useMissionStore } from '@/lib/missionStore';

interface Props {
  store: ReturnType<typeof useMissionStore>;
}

export default function Stage0MissionName({ store }: Props) {
  const { mission, updateMissionName } = store;
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { missionName: mission.missionName || '' },
  });

  const value = watch('missionName');

  React.useEffect(() => {
    updateMissionName(value);
  }, [value, updateMissionName]);

  const suggestions = ['Project Aurora', 'Mission Helios', 'Operation Voyager', 'Artemis Deep', 'Project Cassini II'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Name Your Mission</h2>
        <p className="text-sm text-muted-foreground">Give your mission a memorable name, or leave blank to auto-generate one.</p>
      </div>

      <div>
        <label htmlFor="missionName" className="block text-sm font-semibold text-foreground mb-1">
          Mission Name
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Choose a name that reflects your mission's purpose. If left blank, it will be named "Mission Alpha".
        </p>
        <input
          id="missionName"
          type="text"
          {...register('missionName')}
          placeholder="e.g. Project Aurora"
          maxLength={40}
          className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono"
          aria-label="Mission name input"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {value ? `"${value}"` : 'Will be named "Mission Alpha" if blank'}
          </p>
          <span className="text-xs text-muted-foreground font-mono">{value.length}/40</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Suggestions</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={`suggestion-${s}`}
              type="button"
              onClick={() => updateMissionName(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                value === s
                  ? 'bg-primary/20 border-primary text-primary' :'bg-muted border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-info/10 border border-info/30">
        <p className="text-xs text-info/90 leading-relaxed">
          <strong>Mission naming</strong> — Real space missions often have evocative names: Voyager, Cassini, Curiosity, OSIRIS-REx.
          A good name reflects the mission's spirit and destination.
        </p>
      </div>
    </div>
  );
}