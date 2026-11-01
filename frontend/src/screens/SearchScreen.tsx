import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Tag as TagIcon, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { MasonryFeed } from '../components/MasonryFeed.js';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.js';
import { bookmarkEvents } from '../services/bookmarkEvents.js';
import type { Bookmark, TagCount, Platform } from '../types/index.js';

interface SearchScreenProps {
  onSelectBookmark: (bookmark: Bookmark) => void;
  onBackToHome?: () => void;
  onOpenAddModal?: () => void;
}

const PLATFORMS: { id: string; label: string; platform?: Platform }[] = [
  { id: 'all', label: 'All' },
  { id: 'instagram', label: 'Instagram', platform: 'instagram' },
  { id: 'x', label: 'X', platform: 'x' },
  { id: 'youtube', label: 'YouTube', platform: 'youtube' },
  { id: 'reddit', label: 'Reddit', platform: 'reddit' },
  { id: 'tiktok', label: 'TikTok', platform: 'tiktok' },
  { id: 'website', label: 'Web', platform: 'website' }
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onSelectBookmark,
  onBackToHome,
  onOpenAddModal
}) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Synchronize with global bookmark mutations
  useEffect(() => {
    const unsubDeleted = bookmarkEvents.on('deleted', (deletedId) => {
      setResults((prev) => prev.filter((b) => b.id !== deletedId));
    });

    const unsubUpdated = bookmarkEvents.on('updated', (updated) => {
      setResults((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );
    });

    return () => {
      unsubDeleted();
      unsubUpdated();
    };
  }, []);

  useEffect(() => {
    api.bookmarks.getTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.bookmarks.search(trimmed);
        let items = res.items;
        if (selectedPlatform !== 'all') {
          items = items.filter((b) => b.platform === selectedPlatform);
        }
        setResults(items);
        setSearched(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(handler);
  }, [query, selectedPlatform]);

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    const newFav = !bookmark.is_favorite;
    setResults((prev) =>
      prev.map((b) => (b.id === bookmark.id ? { ...b, is_favorite: newFav } : b))
    );
    try {
      await api.bookmarks.update(bookmark.id, { is_favorite: newFav });
      toast({
        title: newFav ? 'Added to Favorites' : 'Removed from Favorites',
        variant: 'default',
        duration: 2000
      });
    } catch {
      setResults((prev) =>
        prev.map((b) => (b.id === bookmark.id ? { ...b, is_favorite: !newFav } : b))
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background transition-colors">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl p-3.5 border-b border-border pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 mb-2.5">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
              title="Back to library"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <span className="text-sm font-medium text-foreground tracking-tight">Search Library</span>

          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md bg-card hover:bg-muted text-foreground border border-border text-xs font-medium active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-foreground" />
              <span>Add URL</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <SearchIcon className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search titles, summaries, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Platform filter chips when query active */}
        {query && (
          <div className="overflow-x-auto no-scrollbar pt-2 flex items-center gap-1.5">
            {PLATFORMS.map((item) => {
              const isSelected = selectedPlatform === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPlatform(item.id)}
                  className={`whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:text-foreground bg-transparent border border-border/70 font-normal'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Tags */}
      {!query && tags.length > 0 && (
        <div className="p-4">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-2">Saved Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 15).map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() => setQuery(t.tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-card hover:bg-muted text-foreground border border-border transition-all cursor-pointer active:scale-95"
              >
                <TagIcon className="w-3 h-3 text-muted-foreground" />
                <span>{t.tag}</span>
                <span className="text-[10px] text-muted-foreground">({t.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <main className="mt-2 flex-grow">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
            <span className="text-xs font-mono">Searching...</span>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-xs font-medium text-foreground">No bookmarks matching "{query}"</p>
            <p className="text-[11px] text-muted-foreground mt-1">Try another keyword, platform, or tag</p>
          </div>
        ) : (
          <MasonryFeed
            bookmarks={results}
            onSelectBookmark={onSelectBookmark}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>
    </div>
  );
};
