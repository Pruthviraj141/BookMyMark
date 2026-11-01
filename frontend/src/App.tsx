import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { SearchScreen } from './screens/SearchScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { RegisterScreen } from './screens/RegisterScreen.js';
import { BottomNavigation, type NavTab } from './components/BottomNavigation.js';
import { AddBookmarkModal } from './components/AddBookmarkModal.js';
import { BookmarkDetailModal } from './components/BookmarkDetailModal.js';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Bookmark } from './types/index.js';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
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
    if (authView === 'login') {
      return <LoginScreen onNavigateToRegister={() => setAuthView('register')} />;
    }
    return <RegisterScreen onNavigateToLogin={() => setAuthView('login')} />;
  }

  const handleBookmarkCreated = (newBookmark: Bookmark) => {
    // Optionally open the newly created bookmark
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
        {currentTab === 'search' && (
          <SearchScreen onSelectBookmark={setSelectedBookmark} />
        )}
        {currentTab === 'settings' && <SettingsScreen />}
      </div>

      {/* Floating Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBookmarkCreated={handleBookmarkCreated}
      />

      {/* Bookmark Detail Modal */}
      <BookmarkDetailModal
        bookmark={selectedBookmark}
        isOpen={selectedBookmark !== null}
        onClose={() => setSelectedBookmark(null)}
        onBookmarkUpdated={handleBookmarkUpdated}
        onBookmarkDeleted={handleBookmarkDeleted}
      />
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
