import React from 'react';
import { Home, Search, LayoutGrid } from 'lucide-react';

export type NavTab = 'home' | 'search' | 'categories';

interface BottomNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab
}) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'categories', label: 'Categories', icon: LayoutGrid }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-around h-13 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg transition-all duration-150 select-none cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground font-normal'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 stroke-[1.75]" />
              <span className="text-xs tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
