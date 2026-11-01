import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Tag as TagIcon, Loader2 } from 'lucide-react';
import { MasonryFeed } from '../components/MasonryFeed.js';
import { api } from '../services/api.js';
import type { Bookmark, TagCount } from '../types/index.js';

interface SearchScreenProps {
  onSelectBookmark: (bookmark: Bookmark) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectBookmark }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // Load top tags for search suggestion chips
    api.bookmarks.getTags().then(setTags).catch(() => {});
  }, []);

  // Debounced search effect
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
        setResults(res.items);
        setSearched(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-[#0d0e14]/95 backdrop-blur-md p-4 border-b border-[#1f222e] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search titles, summaries, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#161824] border border-zinc-700/80 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tag suggestion chips */}
      {!query && tags.length > 0 && (
        <div className="p-4">
          <span className="text-xs font-semibold text-zinc-400 block mb-2">Popular Tags</span>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 15).map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() => setQuery(t.tag)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#161822] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                <TagIcon className="w-3 h-3 text-violet-400" />
                <span>{t.tag}</span>
                <span className="text-[10px] text-zinc-500">({t.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <main className="mt-3 flex-grow">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-xs">Searching...</span>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-sm font-medium text-zinc-400">No bookmarks found for "{query}"</p>
            <p className="text-xs text-zinc-600 mt-1">Try another keyword or tag</p>
          </div>
        ) : (
          <MasonryFeed bookmarks={results} onSelectBookmark={onSelectBookmark} />
        )}
      </main>
    </div>
  );
};
