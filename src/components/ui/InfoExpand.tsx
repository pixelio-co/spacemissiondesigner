'use client';

/**
 * INFOEXPAND — "Why does this matter?" expandable educational panel.
 * Small footprint: a compact toggle that reveals one concise explanation.
 */

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Lightbulb } from 'lucide-react';

interface Props {
  title?: string;
  children: React.ReactNode;
  /** Compact renders as an inline chip; full renders as a labelled box. */
  variant?: 'chip' | 'box';
  icon?: 'question' | 'idea';
  defaultOpen?: boolean;
}

export default function InfoExpand({
  title = 'Why does this matter?',
  children,
  variant = 'chip',
  icon = 'question',
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = icon === 'idea' ? Lightbulb : HelpCircle;

  if (variant === 'chip') {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1.5 text-xs text-info hover:text-foreground transition-colors"
          aria-expanded={open}
        >
          <Icon size={12} />
          {title}
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="mt-2 p-3 rounded-lg bg-info/5 border border-info/20 text-xs text-muted-foreground leading-relaxed animate-fadeIn">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon size={13} className={icon === 'idea' ? 'text-accent' : 'text-info'} />
          {title}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
