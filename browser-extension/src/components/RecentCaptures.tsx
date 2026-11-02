import React, { useState } from 'react';
import { Trash2, Inbox } from 'lucide-react';
import type { LocalCaptureDraft } from '../types/index.js';
import { CaptureItem } from './CaptureItem.js';

interface RecentCapturesProps {
  captures: LocalCaptureDraft[];
  onDeleteCapture: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onNotify: (msg: string) => void;
}

export const RecentCaptures: React.FC<RecentCapturesProps> = ({
  captures,
  onDeleteCapture,
  onClearAll,
  onNotify
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    await onClearAll();
    setConfirmClear(false);
    onNotify('Cleared all local captures');
  };

  return (
    <div className="p-4 flex-1 flex flex-col min-h-0 bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Recent Captures
          </h2>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)]">
            {captures.length}/20
          </span>
        </div>

        {captures.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className={`text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded ${
              confirmClear
                ? 'bg-red-500/10 text-red-500 font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            <span>{confirmClear ? 'Confirm clear?' : 'Clear all'}</span>
          </button>
        )}
      </div>

      {captures.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-[var(--border-subtle)] my-auto bg-[var(--bg-secondary)]">
          <div className="w-9 h-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-2.5">
            <Inbox className="w-4 h-4" />
          </div>
          <p className="text-[12px] font-medium text-[var(--text-primary)]">
            No local captures yet
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 max-w-[240px] leading-relaxed">
            Right-click any link or page, or press <kbd className="font-mono px-1 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded text-[10px]">Alt+Shift+B</kbd> to save.
          </p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[260px] pr-0.5">
          {captures.map((item) => (
            <CaptureItem
              key={item.id}
              capture={item}
              onDelete={onDeleteCapture}
              onNotify={onNotify}
            />
          ))}
        </div>
      )}
    </div>
  );
};
