import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Preferences } from '@capacitor/preferences';
import type { ThemeMode } from './tokens.js';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const THEME_STORAGE_KEY = 'savr_app_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('theme');
      if (p === 'light' || p === 'dark') return p;
      const localVal = localStorage.getItem(THEME_STORAGE_KEY);
      if (localVal === 'light' || localVal === 'dark') return localVal;
    }
    return 'dark';
  });

  // Load persisted theme on mount (strictly 'light' | 'dark')
  useEffect(() => {
    async function loadTheme() {
      const p = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('theme') : null;
      if (p === 'light' || p === 'dark') {
        setThemeState(p);
        return;
      }
      try {
        const { value } = await Preferences.get({ key: THEME_STORAGE_KEY });
        if (value === 'light' || value === 'dark') {
          setThemeState(value);
          return;
        }
      } catch {
        // Fallback to localStorage
      }
      const localVal = localStorage.getItem(THEME_STORAGE_KEY);
      if (localVal === 'light' || localVal === 'dark') {
        setThemeState(localVal);
        return;
      }
      // Check prefers-color-scheme initial default
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setThemeState('light');
      } else {
        setThemeState('dark');
      }
    }
    loadTheme();
  }, []);

  const isDark = theme === 'dark';

  // Apply dark class to documentElement and update status bar meta tag
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Update meta theme-color for Android navigation & status bar
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', isDark ? '#090909' : '#FFFFFF');
  }, [isDark]);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await Preferences.set({ key: THEME_STORAGE_KEY, value: mode });
    } catch {
      // Fallback
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
  };

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    isDark
  }), [theme, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
