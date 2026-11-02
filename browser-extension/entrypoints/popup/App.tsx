import React, { useState, useEffect, useCallback } from 'react';
import type { Bookmark, ActiveTabInfo, AppUser } from '../../src/types/index.js';
import { getSupabase } from '../../src/services/supabase-client.js';
import { AuthService } from '../../src/services/auth.service.js';
import { BrowserApiService } from '../../src/services/browser-api.service.js';
import { ProductionBookmarksService } from '../../src/services/production-bookmarks.service.js';
import { PendingQueueService } from '../../src/services/pending-queue.service.js';
import { Header } from '../../src/components/Header.js';
import { CurrentPageSection } from '../../src/components/CurrentPageSection.js';
import { ProductionRecentBookmarks } from '../../src/components/ProductionRecentBookmarks.js';
import { SignInSection } from '../../src/components/SignInSection.js';
import { StatusNotice } from '../../src/components/StatusNotice.js';
import { Toast } from '../../src/components/Toast.js';

export const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null);
  const [loadingTab, setLoadingTab] = useState(true);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  }, []);

  // 1. Initial Auth Check and Active Tab Query
  const refreshAuth = useCallback(async () => {
    try {
      const status = await AuthService.getAuthStatus();
      setIsAuthenticated(status.isAuthenticated);
      setUser(status.user);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loadBookmarks = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingBookmarks(true);
    try {
      const list = await ProductionBookmarksService.listRecentBookmarks(10);
      setBookmarks(list);
    } finally {
      setLoadingBookmarks(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshAuth();

    BrowserApiService.getActiveTab()
      .then((tab) => setActiveTab(tab))
      .catch(() => {})
      .finally(() => setLoadingTab(false));

    PendingQueueService.getCount()
      .then((cnt) => setPendingCount(cnt))
      .catch(() => {});
  }, [refreshAuth]);

  // 2. Load bookmarks when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBookmarks();
      // Drain any pending saves
      ProductionBookmarksService.processPendingQueue()
        .then((processed) => {
          if (processed > 0) {
            showToast(`Synced ${processed} pending bookmark(s)`);
            loadBookmarks();
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, loadBookmarks, showToast]);

  // 3. User-scoped Realtime while popup is open
  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabase();
    const channelName = `popup-user-${user.id}`;
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
          if (payload.eventType === 'INSERT') {
            const created = payload.new as Bookmark;
            setBookmarks((prev) => {
              if (prev.some((b) => b.id === created.id)) return prev;
              return [created, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Bookmark;
            setBookmarks((prev) =>
              prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string })?.id;
            if (deletedId) {
              setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Handle Save Current Page
  const handleSaveCurrentPage = async () => {
    if (!activeTab || !activeTab.isValid) {
      return { success: false, error: 'Cannot save invalid page' };
    }

    const res = await ProductionBookmarksService.saveBookmark({
      url: activeTab.url,
      title: activeTab.title,
      sourceType: 'page',
      faviconUrl: activeTab.faviconUrl
    });

    if (res.success) {
      if (res.isDuplicate) {
        showToast('Already saved in your library');
      } else if (res.isPendingOffline) {
        showToast('Saved locally. Sign in to sync.');
        const cnt = await PendingQueueService.getCount();
        setPendingCount(cnt);
      } else {
        showToast('Saved to BookMyMark ✓');
        // Refresh library list
        await loadBookmarks();
      }
    } else if (res.error) {
      showToast(res.error);
    }

    return res;
  };

  const handleSignInSuccess = async () => {
    await refreshAuth();
    showToast('Signed in successfully');
    await ProductionBookmarksService.processPendingQueue();
    await loadBookmarks();
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setBookmarks([]);
    showToast('Signed out');
  };

  const isAlreadySaved = Boolean(
    activeTab?.isValid &&
    bookmarks.some(
      (b) =>
        (b.normalized_url && activeTab.url.includes(b.normalized_url)) ||
        b.original_url === activeTab.url
    )
  );

  return (
    <div className="flex flex-col w-[380px] min-h-[480px] max-h-[600px] bg-[var(--bg-primary)]">
      <Header user={user} onSignOut={isAuthenticated ? handleSignOut : undefined} />

      {!authLoading && !isAuthenticated ? (
        <SignInSection onSignInSuccess={handleSignInSuccess} pendingCount={pendingCount} />
      ) : (
        <>
          <CurrentPageSection
            tab={activeTab}
            loading={loadingTab}
            isAuthenticated={isAuthenticated}
            onSaveCurrentPage={handleSaveCurrentPage}
            isAlreadySaved={isAlreadySaved}
          />

          <ProductionRecentBookmarks
            bookmarks={bookmarks}
            loading={loadingBookmarks}
            onRefresh={loadBookmarks}
            onNotify={showToast}
          />
        </>
      )}

      <StatusNotice isAuthenticated={isAuthenticated} />
      <Toast message={toastMessage} />
    </div>
  );
};
