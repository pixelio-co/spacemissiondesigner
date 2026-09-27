'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import type { ChoiceEducation } from '@/lib/missionEducation';

interface WhyItMattersProps {
  education: ChoiceEducation;
  /** Compact variant for tight stage layouts. */
  compact?: boolean;
  id?: string;
}

/**
 * "Why does this matter?" — concise, expandable educational context.
 * Closed by default so the interface stays uncluttered.
 */
export default function WhyItMatters({ education, compact = false, id }: WhyItMattersProps) {
  const [open, setOpen] = useState(false);

  return (
    <div id={id} className="rounded-lg border border-info/25 bg-info/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-info/10 transition-colors"
        aria-expanded={open}
      >
        <HelpCircle size={14} className="text-info flex-shrink-0" />
        <span className="text-xs font-semibold text-info uppercase tracking-wider flex-1">
          Why does this matter?
        </span>
        <ChevronDown
          size={14}
          className={`text-info transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-fadeIn">
          {[
            { label: 'What it does', text: education.whatItDoes, color: 'text-primary' },
            { label: 'Why it matters', text: education.whyItMatters, color: 'text-info' },
            { label: 'Trade-off', text: education.tradeOff, color: 'text-warning' },
          ].map(item => (
            <div key={item.label}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${item.color}`}>
                {item.label}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
          {compact && null}
        </div>
      )}
    </div>
  );
}
