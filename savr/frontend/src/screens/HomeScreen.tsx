import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, BookmarkPlus, Sparkles, AlertCircle } from 'lucide-react';
import { MasonryFeed } from '../components/MasonryFeed.js';
import { api } from '../services/api.js';
import type { Bookmark, Platform } from '../types/index.js';

interface HomeScreenProps {
  onSelectBookmark: (bookmark: Bookmark) => void;
  onOpenAddModal: () => void;
}

const PLATFORM_FILTERS: { id: string; label: string; platform?: Platform }[] = [
  { id: 'all', label: 'All' },
  { id: 'instagram', label: 'Instagram', platform: 'instagram' },
  { id: 'x', label: 'X / Twitter', platform: 'x' },
  { id: 'youtube', label: 'YouTube', platform: 'youtube' },
  { id: 'reddit', label: 'Reddit', platform: 'reddit' },
  { id: 'tiktok', label: 'TikTok', platform: 'tiktok' },
  { id: 'website', label: 'Websites', platform: 'website' }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectBookmark,
  onOpenAddModal
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const activePlatformFilter = PLATFORM_FILTERS.find((p) => p.id === selectedPlatform)?.platform;
      const res = await api.bookmarks.list({
        platform: activePlatformFilter,
        category: selectedCategory || undefined,
        limit: 50
      });
      setBookmarks(res.bookmarks);

      // Also refresh available categories
      const catRes = await api.bookmarks.getCategories();
      setCategories(catRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlatform, selectedCategory]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Poller for items still processing in background
  useEffect(() => {
    const hasUnfinished = bookmarks.some(
      (b) => b.ai_status === 'pending' || b.ai_status === 'processing'
    );
    if (!hasUnfinished) return;

    const interval = setInterval(() => {
      fetchBookmarks();
    }, 3500);

    return () => clearInterval(interval);
  }, [bookmarks, fetchBookmarks]);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-[#0d0e14]/90 backdrop-blur-md px-4 py-3 border-b border-[#1f222e] flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-900/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block leading-none">
              MyBookMark
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Visual Library</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchBookmarks(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
            title="Refresh library"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Platform Filter Horizontal Bar */}
      <div className="overflow-x-auto no-scrollbar py-2.5 px-3 flex items-center gap-1.5 border-b border-zinc-800/40">
        {PLATFORM_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedPlatform(item.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedPlatform === item.id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                : 'bg-[#181a24] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Category Pills (if categories exist) */}
      {categories.length > 0 && (
        <div className="overflow-x-auto no-scrollbar py-2 px-3 flex items-center gap-1.5 bg-[#12141c]">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              !selectedCategory
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() => setSelectedCategory(c.category === selectedCategory ? '' : c.category)}
              className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                selectedCategory === c.category
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {c.category} ({c.count})
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Feed */}
      <main className="mt-3 flex-grow">
        {!loading && bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-12 text-center max-w-xs mx-auto">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
              <BookmarkPlus className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-1">Your library is empty</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Share Reels or posts from Instagram, X, or YouTube with MyBookMark, or tap the button below to add a link.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform active:scale-95"
            >
              Add Your First Bookmark
            </button>
          </div>
        ) : (
          <MasonryFeed
            bookmarks={bookmarks}
            onSelectBookmark={onSelectBookmark}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};
