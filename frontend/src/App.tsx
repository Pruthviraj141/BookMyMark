import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { BottomNavigation, type NavTab } from './components/BottomNavigation.js';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Bookmark } from './types/index.js';

// Lazy-loaded secondary screens and modals for code splitting
const SearchScreen = lazy(() =>
  import('./screens/SearchScreen.js').then((m) => ({ default: m.SearchScreen }))
);
const SettingsScreen = lazy(() =>
  import('./screens/SettingsScreen.js').then((m) => ({ default: m.SettingsScreen }))
);
const AddBookmarkModal = lazy(() =>
  import('./components/AddBookmarkModal.js').then((m) => ({ default: m.AddBookmarkModal }))
);
const BookmarkDetailModal = lazy(() =>
  import('./components/BookmarkDetailModal.js').then((m) => ({ default: m.BookmarkDetailModal }))
);

const ScreenSkeleton: React.FC = () => (
  <div className="flex-grow flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
  </div>
);

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e14] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-900/40 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          <span>Starting MyBookMark...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const handleBookmarkCreated = (newBookmark: Bookmark) => {
    setSelectedBookmark(newBookmark);
  };

  const handleBookmarkUpdated = (updated: Bookmark) => {
    setSelectedBookmark(updated);
  };

  const handleBookmarkDeleted = (_id: string) => {
    setSelectedBookmark(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0e14] text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Active Screen */}
      <div className="flex-grow">
        {currentTab === 'home' && (
          <HomeScreen
            onSelectBookmark={setSelectedBookmark}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}
        <Suspense fallback={<ScreenSkeleton />}>
          {currentTab === 'search' && (
            <SearchScreen onSelectBookmark={setSelectedBookmark} />
          )}
          {currentTab === 'settings' && <SettingsScreen />}
        </Suspense>
      </div>

      {/* Floating Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Modals with Suspense */}
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
