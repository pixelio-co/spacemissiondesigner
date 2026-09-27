'use client';

/**
 * RestoredMissionNotice — shared "a saved mission was restored" banner.
 *
 * The app auto-restores the last saved mission draft, which is convenient for
 * continuing work but confusing when the saved mission is a *finished* one.
 * Every page that can load a saved mission uses this notice so the restore is
 * explicit and one click from being cleared.
 */

import React from 'react';
import { History, Pencil, RotateCcw, X } from 'lucide-react';

interface RestoredMissionNoticeProps {
  /** Saved mission name (callers apply their own fallback for blank names). */
  name: string;
  /** Optional detail suffix, e.g. "62% designed". */
  detail?: string;
  /** Context-specific explanation of what this page will use the mission for. */
  description?: string;
  /** Clear the saved mission and start fresh. */
  onStartFresh: () => void;
  /** Optional shortcut to the Mission Designer to edit the mission. */
  onEditDesign?: () => void;
  /** Optional dismiss (hides the notice for this page view only). */
  onDismiss?: () => void;
}

export default function RestoredMissionNotice({
  name, detail, description, onStartFresh, onEditDesign, onDismiss,
}: RestoredMissionNoticeProps) {
  return (
    <div className="space-card p-4 mb-6 border-info/30 flex flex-col sm:flex-row sm:items-center gap-3">
      <History size={16} className="text-info flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium">
          Restored saved mission &ldquo;{name}&rdquo;{detail ? ` — ${detail}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          {description ??
            'Your previous design was restored automatically so you can continue where you left off. Don\u2019t want it? Start fresh with one click.'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onEditDesign && (
          <button onClick={onEditDesign} className="btn-secondary text-xs px-3 py-2">
            <Pencil size={12} />
            Edit design
          </button>
        )}
        <button onClick={onStartFresh} className="btn-accent text-xs px-3 py-2">
          <RotateCcw size={12} />
          Start fresh
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss notice"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
