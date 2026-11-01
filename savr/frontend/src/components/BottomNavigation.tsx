import React from 'react';
import { Bookmark, Search, Plus, Settings } from 'lucide-react';

export type NavTab = 'home' | 'search' | 'add' | 'settings';

interface BottomNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#12131a]/95 backdrop-blur-lg border-t border-[#252836] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {/* Home */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'home' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Bookmark className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Library</span>
        </button>

        {/* Search */}
        <button
          type="button"
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'search' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Search className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Search</span>
        </button>

        {/* Add (+) Primary Action Button */}
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-12 h-12 -mt-4 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-violet-900/40 border border-violet-400/30 transition-transform"
            aria-label="Add Bookmark"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Settings */}
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'settings' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};
