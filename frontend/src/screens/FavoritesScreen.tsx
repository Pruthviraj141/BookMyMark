import React, { useState, useEffect, useCallback } from 'react';
import { Heart, ArrowLeft, AlertCircle } from 'lucide-react';
import { MasonryFeed } from '../components/MasonryFeed.js';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.js';
import { bookmarkEvents } from '../services/bookmarkEvents.js';
import type { Bookmark } from '../types/index.js';

interface FavoritesScreenProps {
  onSelectBookmark: (bookmark: Bookmark) => void;
  onBackToHome?: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onSelectBookmark,
  onBackToHome
}) => {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setError(null);
    try {
      const res = await api.bookmarks.list({ is_favorite: true, limit: 50 });
      setBookmarks(res.bookmarks);
    } catch (err: any) {
      setError(err?.message || 'Failed to load favorite bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Synchronize with global bookmark mutations
  useEffect(() => {
    const unsubDeleted = bookmarkEvents.on('deleted', (deletedId) => {
      setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
    });

    const unsubUpdated = bookmarkEvents.on('updated', (updated) => {
      setBookmarks((prev) => {
        if (!updated.is_favorite) {
          return prev.filter((b) => b.id !== updated.id);
        }
        const exists = prev.some((b) => b.id === updated.id);
        if (exists) {
          return prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b));
        }
        return [updated, ...prev];
      });
    });

    const unsubCreated = bookmarkEvents.on('created', (created) => {
      if (created.is_favorite) {
        setBookmarks((prev) => [created, ...prev]);
      }
    });

    return () => {
      unsubDeleted();
      unsubUpdated();
      unsubCreated();
    };
  }, []);

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    const newFav = !bookmark.is_favorite;
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
    try {
      await api.bookmarks.update(bookmark.id, { is_favorite: newFav });
      toast({
        title: 'Removed from Favorites',
        variant: 'default',
        duration: 2000
      });
    } catch {
      fetchFavorites();
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl px-4 py-3 border-b border-border flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
              title="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-medium text-foreground tracking-tight leading-none">
                Favorites
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                {bookmarks.length}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-normal">Pinned bookmarks</span>
          </div>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      <main className="mt-3 flex-grow">
        {!loading && bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-16 text-center max-w-xs mx-auto">
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center mb-3 text-foreground">
              <Heart className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">No favorites yet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tap the heart on any bookmark card to save it to your favorites.
            </p>
          </div>
        ) : (
          <MasonryFeed
            bookmarks={bookmarks}
            onSelectBookmark={onSelectBookmark}
            onToggleFavorite={handleToggleFavorite}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};
