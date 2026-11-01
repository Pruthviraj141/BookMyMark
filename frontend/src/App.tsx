import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './theme/ThemeProvider.js';
import { ToastProvider } from './components/ui/Toast.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { BottomNavigation, type NavTab } from './components/BottomNavigation.js';
import { BookMyMarkLogo } from './components/BookMyMarkLogo.js';
import { Loader2 } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { bookmarkEvents } from './services/bookmarkEvents.js';
import type { Bookmark } from './types/index.js';

import { SearchScreen } from './screens/SearchScreen.js';
import { CategoriesScreen } from './screens/CategoriesScreen.js';
import { FavoritesScreen } from './screens/FavoritesScreen.js';
import { AddBookmarkModal } from './components/AddBookmarkModal.js';
import { BookmarkDetailModal } from './components/BookmarkDetailModal.js';

const PRIMARY_TABS: NavTab[] = ['home', 'search', 'categories'];

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  // Swipe navigation tracking refs (guarantee zero interference with vertical scrolling)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef<boolean>(false);
  const isVerticalScrollRef = useRef<boolean>(false);

  // Hardware Back Button listener for Android
  useEffect(() => {
    const backHandler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (selectedBookmark !== null) {
        setSelectedBookmark(null);
      } else if (isAddModalOpen) {
        setIsAddModalOpen(false);
      } else if (isFavoritesOpen) {
        setIsFavoritesOpen(false);
      } else if (currentTab !== 'home') {
        setCurrentTab('home');
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backHandler.then((h) => h.remove()).catch(() => {});
    };
  }, [selectedBookmark, isAddModalOpen, isFavoritesOpen, currentTab]);

  // Horizontal swipe gesture handlers (Home ↔ Search ↔ Categories)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectedBookmark || isAddModalOpen || isFavoritesOpen || e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('input') ||
        target.closest('textarea') ||
        target.closest('button') ||
        target.closest('[data-no-swipe]'))
    ) {
      touchStartRef.current = null;
      return;
    }

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    isSwipingRef.current = false;
    isVerticalScrollRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isVerticalScrollRef.current) return;

    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;

    if (!isSwipingRef.current && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
      if (Math.abs(dy) > Math.abs(dx) * 0.75) {
        // Vertical movement detected: pass through directly to native scroll
        isVerticalScrollRef.current = true;
        return;
      } else {
        isSwipingRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isVerticalScrollRef.current || !isSwipingRef.current) {
      touchStartRef.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    const threshold = 65;
    if (Math.abs(dx) > threshold && dt < 450) {
      const currentIndex = PRIMARY_TABS.indexOf(currentTab);
      if (dx < 0 && currentIndex < PRIMARY_TABS.length - 1) {
        // Swipe left -> advance tab
        setCurrentTab(PRIMARY_TABS[currentIndex + 1]);
      } else if (dx > 0 && currentIndex > 0) {
        // Swipe right -> retreat tab
        setCurrentTab(PRIMARY_TABS[currentIndex - 1]);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border">
          <BookMyMarkLogo className="w-6 h-6 text-foreground" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground" />
          <span>Opening library...</span>
        </div>
      </div>
    );
  }

  const isPreviewHome = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'home';

  if (!user && !isPreviewHome) {
    return <LoginScreen />;
  }

  const handleBookmarkCreated = (newBookmark: Bookmark) => {
    setSelectedBookmark(newBookmark);
    bookmarkEvents.emit('created', newBookmark);
  };

  const handleBookmarkUpdated = (updated: Bookmark) => {
    setSelectedBookmark(updated);
    bookmarkEvents.emit('updated', updated);
  };

  const handleBookmarkDeleted = (id: string) => {
    setSelectedBookmark(null);
    bookmarkEvents.emit('deleted', id);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none antialiased transition-colors"
    >
      {/* Active Screens (Instant 0ms keep-alive tab switching) */}
      <div className="flex-grow">
        {isFavoritesOpen ? (
          <FavoritesScreen
            onSelectBookmark={setSelectedBookmark}
            onBackToHome={() => setIsFavoritesOpen(false)}
          />
        ) : (
          <>
            <div className={currentTab === 'home' ? 'block' : 'hidden'}>
              <HomeScreen
                onSelectBookmark={setSelectedBookmark}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onOpenFavorites={() => setIsFavoritesOpen(true)}
              />
            </div>
            <div className={currentTab === 'search' ? 'block' : 'hidden'}>
              <SearchScreen
                onSelectBookmark={setSelectedBookmark}
                onBackToHome={() => setCurrentTab('home')}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            </div>
            <div className={currentTab === 'categories' ? 'block' : 'hidden'}>
              <CategoriesScreen
                onSelectBookmark={setSelectedBookmark}
                onBackToHome={() => setCurrentTab('home')}
              />
            </div>
          </>
        )}
      </div>

      {/* Slim 3-Destination Bottom Navigation: Home, Search, Categories */}
      {!isFavoritesOpen && (
        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />
      )}

      {/* Modals & Detail Bottom Sheet (Instant 0ms rendering) */}
      {isAddModalOpen && (
        <AddBookmarkModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onBookmarkCreated={handleBookmarkCreated}
        />
      )}

      {selectedBookmark !== null && (
        <BookmarkDetailModal
          bookmark={selectedBookmark}
          isOpen={selectedBookmark !== null}
          onClose={() => setSelectedBookmark(null)}
          onBookmarkUpdated={handleBookmarkUpdated}
          onBookmarkDeleted={handleBookmarkDeleted}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
