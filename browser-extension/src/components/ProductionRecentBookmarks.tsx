import React, { useState } from 'react';
import { Copy, ExternalLink, Check, Sparkles, RefreshCw, Bookmark as BookmarkIcon } from 'lucide-react';
import type { Bookmark } from '../types/index.js';
import { truncateUrl } from '../utils/url-validator.js';
import { BrowserApiService } from '../services/browser-api.service.js';

interface ProductionRecentBookmarksProps {
  bookmarks: Bookmark[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string) => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString).getTime();
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 45) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
}

export const ProductionRecentBookmarks: React.FC<ProductionRecentBookmarksProps> = ({
  bookmarks,
  loading,
  onRefresh,
  onNotify
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleCopy = async (id: string, url: string) => {
    const success = await BrowserApiService.copyToClipboard(url);
    if (success) {
      setCopiedId(id);
      onNotify('URL copied to clipboard');
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 flex-1 flex flex-col min-h-0 bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Library Bookmarks
          </h2>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)]">
            {bookmarks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          title="Refresh library"
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && bookmarks.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] animate-pulse">
              <div className="h-3 bg-[var(--border-strong)] rounded w-1/4 mb-2" />
              <div className="h-3.5 bg-[var(--border-strong)] rounded w-3/4 mb-1" />
              <div className="h-2.5 bg-[var(--border-strong)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center px-4 rounded-lg border border-dashed border-[var(--border-subtle)] my-auto bg-[var(--bg-secondary)]">
          <div className="w-9 h-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] mb-2.5">
            <BookmarkIcon className="w-4 h-4" />
          </div>
          <p className="text-[12px] font-medium text-[var(--text-primary)]">
            No bookmarks in your library yet
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 max-w-[240px] leading-relaxed">
            Click "Save this page" above or right-click any link on the web to add it to BookMyMark.
          </p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[250px] pr-0.5">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => BrowserApiService.openTab(bm.original_url)}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9.5px] uppercase tracking-wider px-1.5 py-0.2 rounded font-medium bg-[var(--accent-badge-bg)] text-[var(--accent-badge-fg)]">
                      {bm.platform}
                    </span>

                    {bm.ai_status === 'completed' && (
                      <span className="flex items-center gap-0.5 text-[9.5px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>AI Ready</span>
                      </span>
                    )}

                    {bm.ai_status === 'processing' && (
                      <span className="flex items-center gap-0.5 text-[9.5px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Organising</span>
                      </span>
                    )}

                    <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                      {formatRelativeTime(bm.created_at)}
                    </span>
                  </div>

                  <h3 className="text-[12.5px] font-medium text-[var(--text-primary)] truncate leading-snug hover:underline">
                    {bm.title || bm.normalized_url}
                  </h3>

                  <p className="text-[10.5px] text-[var(--text-secondary)] truncate mt-0.5" title={bm.original_url}>
                    {truncateUrl(bm.original_url, 38)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleCopy(bm.id, bm.original_url)}
                    title="Copy URL"
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  >
                    {copiedId === bm.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => BrowserApiService.openTab(bm.original_url)}
                    title="Open in new tab"
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
