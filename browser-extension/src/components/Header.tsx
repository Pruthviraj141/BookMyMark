import React from 'react';
import { LogOut, User } from 'lucide-react';
import type { AppUser } from '../types/index.js';

interface HeaderProps {
  user: AppUser | null;
  onSignOut?: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  return (
    <header className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]">
      <div className="flex items-center gap-2.5">
        {/* BookMyMark Official Vector Emblem */}
        <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 shadow-2xs">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-[var(--text-primary)]"
          >
            <rect x="8" y="4" width="32" height="40" rx="5" fill="currentColor" />
            <path d="M17 4H31V25L24 19.5L17 25V4Z" fill="var(--bg-primary)" />
            <rect x="16" y="30" width="16" height="2.5" rx="1.25" fill="var(--bg-primary)" />
            <rect x="16" y="35.5" width="10" height="2.5" rx="1.25" fill="var(--bg-primary)" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[13.5px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
            BookMyMark
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] font-normal tracking-normal mt-0.5 leading-none">
            {user ? 'Cloud Synchronised' : 'Desktop Companion'}
          </span>
        </div>
      </div>

      {user ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-3.5 h-3.5 rounded-full object-cover"
              />
            ) : (
              <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
            <span className="text-[11px] font-medium text-[var(--text-primary)] max-w-[90px] truncate" title={user.email || user.name}>
              {user.name || user.email?.split('@')[0]}
            </span>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[10.5px] font-medium text-[var(--text-secondary)] tracking-tight">
            Signed out
          </span>
        </div>
      )}
    </header>
  );
};
