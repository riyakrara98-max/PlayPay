'use client';

import React, { createContext, useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { ThemeMode, ThemeContextType } from '@/types/theme';

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'playpay_theme_preference';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

const emptySubscribe = () => () => {};

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      return stored || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const isServer = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true
  );

  // Helper to get system dark state
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const resolvedTheme: 'light' | 'dark' = isServer
    ? 'light'
    : theme === 'system'
    ? getSystemTheme()
    : theme;

  // Set theme preference
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Toggle theme helper
  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  // Synchronize class on <html> element
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        const isDark = mediaQuery.matches;
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
