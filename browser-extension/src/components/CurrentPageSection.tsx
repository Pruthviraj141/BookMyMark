import React, { useState } from 'react';
import { Globe, Bookmark, Check, AlertCircle } from 'lucide-react';
import type { ActiveTabInfo } from '../types/index.js';
import { truncateUrl } from '../utils/url-validator.js';

interface CurrentPageSectionProps {
  tab: ActiveTabInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  onSaveCurrentPage: () => Promise<{ success: boolean; isDuplicate?: boolean; isPendingOffline?: boolean; error?: string }>;
  isAlreadySaved?: boolean;
}

export const CurrentPageSection: React.FC<CurrentPageSectionProps> = ({
  tab,
  loading,
  isAuthenticated,
  onSaveCurrentPage,
  isAlreadySaved = false
}) => {
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleSave = async () => {
    if (saving || !tab?.isValid) return;
    setSaving(true);
    setIsDuplicate(false);
    try {
      const res = await onSaveCurrentPage();
      if (res.success) {
        if (res.isDuplicate) {
          setIsDuplicate(true);
        } else {
          setJustSaved(true);
        }
        setTimeout(() => {
          setJustSaved(false);
          setIsDuplicate(false);
        }, 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] animate-pulse">
        <div className="h-4 bg-[var(--border-strong)] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[var(--border-strong)] rounded w-1/2 mb-4" />
        <div className="h-9 bg-[var(--border-strong)] rounded w-full" />
      </div>
    );
  }

  if (!tab || !tab.isValid) {
    return (
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <AlertCircle className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-[var(--text-primary)]">
              Restricted Browser Page
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              {tab?.invalidReason || 'Internal browser pages (chrome://, about:) cannot be bookmarked.'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const showSavedState = justSaved || isAlreadySaved;

  return (
    <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      {/* Current Page Metadata Card */}
      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] mb-3">
        <div className="flex items-start gap-2.5">
          {tab.faviconUrl && !imgError ? (
            <img
              src={tab.faviconUrl}
              alt=""
              className="w-4 h-4 rounded shrink-0 mt-0.5 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <Globe className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
              {tab.title || 'Untitled Page'}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)] tracking-tight">
                {tab.domain}
              </span>
              <span className="text-[10.5px] text-[var(--text-muted)] truncate" title={tab.url}>
                {truncateUrl(tab.url, 38)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Save Action Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 px-4 rounded-lg font-medium text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xs ${
          showSavedState || isDuplicate
            ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-strong)]'
            : 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:opacity-90'
        }`}
      >
        {isDuplicate ? (
          <>
            <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
            <span>Already in BookMyMark</span>
          </>
        ) : showSavedState ? (
          <>
            <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
            <span>Saved to BookMyMark</span>
          </>
        ) : saving ? (
          <span>Saving to BookMyMark...</span>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            <span>{isAuthenticated ? 'Save this page' : 'Save locally (Sign in to sync)'}</span>
            <kbd className="ml-auto text-[10px] font-mono opacity-60 bg-[rgba(255,255,255,0.15)] dark:bg-[rgba(0,0,0,0.2)] px-1.5 py-0.5 rounded">
              Alt+Shift+B
            </kbd>
          </>
        )}
      </button>
    </div>
  );
};
