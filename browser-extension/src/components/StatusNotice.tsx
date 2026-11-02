import React from 'react';
import { ShieldCheck, Cloud, AlertCircle } from 'lucide-react';

interface StatusNoticeProps {
  isAuthenticated: boolean;
}

export const StatusNotice: React.FC<StatusNoticeProps> = ({ isAuthenticated }) => {
  return (
    <footer className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] mt-auto">
      <div className="flex items-start gap-2">
        {isAuthenticated ? (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-[var(--text-secondary)] leading-normal tracking-tight">
              <strong className="text-[var(--text-primary)] font-medium">Cloud Synchronised:</strong> saves sync in Realtime to your BookMyMark Android app.
            </p>
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[var(--text-secondary)] leading-normal tracking-tight">
              <strong className="text-[var(--text-primary)] font-medium">Preview mode:</strong> sign in with your Google account to sync with your Android app.
            </p>
          </>
        )}
      </div>
    </footer>
  );
};
