'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  };

  useEffect(() => {
    setMounted(true);
    let initialTheme: Theme = 'dark';
    try {
      const stored = localStorage.getItem('studyflow-theme') as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        initialTheme = stored;
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        initialTheme = 'light';
      }
    } catch (e) {
      // Ignore local storage error in sandboxed/iframe contexts
    }

    setThemeState(initialTheme);
    applyTheme(initialTheme);

    const handleThemeChange = (e: CustomEvent<Theme>) => {
      setThemeState(e.detail);
      applyTheme(e.detail);
    };

    window.addEventListener('theme-change' as any, handleThemeChange);
    return () => window.removeEventListener('theme-change' as any, handleThemeChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('studyflow-theme', newTheme);
    } catch (e) {}
    applyTheme(newTheme);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}
