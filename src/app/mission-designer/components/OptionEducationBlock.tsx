'use client';

import React from 'react';
import type { OptionEducation } from '@/lib/missionRules';
import { Wrench, Compass, Scale } from 'lucide-react';

interface Props {
  education: OptionEducation;
  optionLabel: string;
}

export default function OptionEducationBlock({ education, optionLabel }: Props) {
  return (
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/25 animate-fadeIn">
      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
        {optionLabel} — understand your choice
      </div>
      <div className="space-y-2.5">
        <div className="flex items-start gap-2">
          <Wrench size={12} className="text-info mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-info">What it does</span>
            <p className="text-xs text-foreground leading-relaxed">{education.whatItDoes}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Compass size={12} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Why it matters</span>
            <p className="text-xs text-foreground leading-relaxed">{education.whyItMatters}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Scale size={12} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-warning">Trade-off</span>
            <p className="text-xs text-foreground leading-relaxed">{education.tradeOff}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
