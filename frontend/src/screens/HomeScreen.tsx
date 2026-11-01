import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookmarkPlus, Sun, Moon, RotateCw, Heart } from 'lucide-react';
import { MasonryFeed } from '../components/MasonryFeed.js';
import { BookMyMarkBrand } from '../components/BookMyMarkLogo.js';
import { AccountModal } from '../components/AccountModal.js';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from '../components/ui/AlertDialog.js';
import { api } from '../services/api.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { supabase } from '../config/supabase.js';
import { LocalDbService } from '../services/local-db.service.js';
import { useToast } from '../components/ui/Toast.js';
import { App as CapacitorApp } from '@capacitor/app';
import { bookmarkEvents } from '../services/bookmarkEvents.js';
import type { Bookmark, Platform } from '../types/index.js';

interface HomeScreenProps {
  onSelectBookmark: (bookmark: Bookmark) => void;
  onOpenAddModal: () => void;
  onOpenFavorites: () => void;
}

const ALL_PLATFORMS: { id: string; label: string; platform?: Platform }[] = [
  { id: 'all', label: 'All' },
  { id: 'instagram', label: 'Instagram', platform: 'instagram' },
  { id: 'x', label: 'X', platform: 'x' },
  { id: 'youtube', label: 'YouTube', platform: 'youtube' },
  { id: 'reddit', label: 'Reddit', platform: 'reddit' },
  { id: 'tiktok', label: 'TikTok', platform: 'tiktok' },
  { id: 'website', label: 'Web', platform: 'website' }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectBookmark,
  onOpenAddModal,
  onOpenFavorites
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [availablePlatforms, setAvailablePlatforms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Initialize available platforms from local cache
  useEffect(() => {
    if (!user?.id) return;
    const cached = LocalDbService.getBookmarks(user.id);
    if (cached.length > 0) {
      const set = new Set<string>();
      cached.forEach((b) => {
        if (b.platform) set.add(b.platform);
      });
      setAvailablePlatforms(set);
    }
  }, [user?.id]);

  const fetchBookmarks = useCallback(async () => {
    setError(null);
    try {
      // 1. Process pending native shares if any
      const pendingShares = await NativeSessionBridge.getPendingShares();
      if (pendingShares.length > 0) {
        for (const item of pendingShares) {
          if (item.url) {
            await api.bookmarks.create({
              url: item.url,
              sharedText: item.sharedText
            }).catch(() => {});
          }
        }
        await NativeSessionBridge.clearPendingShares();
      }

      // 2. Fetch fresh bookmarks
      const activePlatformFilter = ALL_PLATFORMS.find((p) => p.id === selectedPlatform)?.platform;
      const res = await api.bookmarks.list({
        platform: activePlatformFilter,
        limit: 50
      });
      setBookmarks(res.bookmarks);

      // Accumulate existing platforms
      setAvailablePlatforms((prev) => {
        const next = new Set(prev);
        res.bookmarks.forEach((b) => {
          if (b.platform) next.add(b.platform);
        });
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks();
  };

  // Realtime subscription for automatic instant sync & AI updates
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `bookmarks-user-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Bookmark;
            setBookmarks((prev) =>
              prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
            );
            LocalDbService.upsertBookmark(user.id, updated);
          } else if (payload.eventType === 'INSERT') {
            const created = payload.new as Bookmark;
            setBookmarks((prev) => {
              if (prev.some((b) => b.id === created.id)) return prev;
              return [created, ...prev];
            });
            LocalDbService.upsertBookmark(user.id, created);
            if (created.platform) {
              setAvailablePlatforms((prev) => new Set(prev).add(created.platform!));
            }
            toast({
              title: 'Bookmark Saved',
              description: created.title || 'New item added',
              variant: 'default'
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string })?.id;
            if (deletedId) {
              setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
              LocalDbService.removeBookmark(user.id, deletedId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  // In-app instant bookmark events (0ms optimistic UI updates on add/edit/delete)
  useEffect(() => {
    const unsubCreated = bookmarkEvents.on('created', (created) => {
      setBookmarks((prev) => {
        if (prev.some((b) => b.id === created.id)) return prev;
        return [created, ...prev];
      });
      if (created.platform) {
        setAvailablePlatforms((prev) => new Set(prev).add(created.platform!));
      }
    });

    const unsubUpdated = bookmarkEvents.on('updated', (updated) => {
      setBookmarks((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );
    });

    const unsubDeleted = bookmarkEvents.on('deleted', (deletedId) => {
      setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
    });

    const unsubRefresh = bookmarkEvents.on('refresh', () => {
      fetchBookmarks();
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
      unsubRefresh();
    };
  }, [fetchBookmarks]);

  // Auto-refresh when app resumes from background (after native share from Instagram, X, YouTube, etc.)
  useEffect(() => {
    let appStateHandle: any = null;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        fetchBookmarks();
      }
    }).then((handle) => {
      appStateHandle = handle;
    }).catch(() => {});

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBookmarks();
      }
    };

    const onFocus = () => {
      fetchBookmarks();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      if (appStateHandle) {
        appStateHandle.remove();
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchBookmarks]);

  // Dynamic platform filter calculation: only show platforms with existing bookmarks!
  const visiblePlatforms = useMemo(() => {
    return ALL_PLATFORMS.filter(
      (p) => p.id === 'all' || availablePlatforms.has(p.id)
    );
  }, [availablePlatforms]);

  // Direct toggle between light and dark (no toast message, no system theme)
  const handleToggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(nextTheme);
  };

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    const newFav = !bookmark.is_favorite;
    setBookmarks((prev) =>
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
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmark.id ? { ...b, is_favorite: !newFav } : b))
      );
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen pb-20 bg-background transition-colors">
        {/* Top Header: Extremely minimal, editorial Swiss aesthetic */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl px-4 py-3 border-b border-border flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]">
          {/* Left: BookMyMark branding (tap to open account details) */}
          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center text-left bg-transparent border-none p-0 cursor-pointer active:opacity-75 transition-opacity"
            title="Account"
            aria-label="Account details"
          >
            <BookMyMarkBrand subtitle="Library" />
          </button>

          {/* Right: Favorites button, Refresh button & Light/Dark Theme toggle */}
          <div className="flex items-center gap-1.5">
            {/* Favorites button at top */}
            <button
              type="button"
              onClick={onOpenFavorites}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 transition-colors cursor-pointer active:scale-95"
              title="Favorites"
              aria-label="Favorites"
            >
              <Heart className="w-4 h-4 text-foreground" />
            </button>

            {/* Refresh button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 transition-colors cursor-pointer active:scale-95"
              title="Refresh library"
              aria-label="Refresh library"
            >
              <RotateCw className={`w-4 h-4 text-foreground ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Theme toggle: Light / Dark directly */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 transition-colors cursor-pointer active:scale-95"
              title={`Theme: ${theme === 'dark' ? 'Dark' : 'Light'}. Tap to switch`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-foreground" />
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Platform Filters (only platforms with existing bookmarks) */}
        {visiblePlatforms.length > 1 && (
          <div className="overflow-x-auto no-scrollbar py-2 px-3.5 flex items-center gap-1.5 border-b border-border/60 bg-background">
            {visiblePlatforms.map((item) => {
              const isSelected = selectedPlatform === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPlatform(item.id)}
                  className={`whitespace-nowrap px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
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

        {/* Error state */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Editorial Masonry Feed */}
        <main className="mt-3 flex-grow">
          {!loading && bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 mt-16 text-center max-w-xs mx-auto">
              <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center mb-3 text-foreground">
                <BookmarkPlus className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">Your library is empty</h3>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                Share any Reel, post, video, or link with BookMyMark using Android's share menu.
              </p>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-lg bg-foreground hover:opacity-90 text-xs font-medium text-background transition-transform active:scale-95 cursor-pointer"
              >
                Add Link Manually
              </button>
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

      {/* Account Sheet Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onRequestLogout={() => setIsLogoutDialogOpen(true)}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog isOpen={isLogoutDialogOpen} onClose={() => setIsLogoutDialogOpen(false)}>
        <AlertDialogBackdrop onClick={() => setIsLogoutDialogOpen(false)} />
        <AlertDialogContent>
          <AlertDialogHeader>Sign Out of BookMyMark</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to sign out? Your saved bookmarks remain securely preserved.
          </AlertDialogBody>
          <AlertDialogFooter>
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogoutDialogOpen(false);
                logout();
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
