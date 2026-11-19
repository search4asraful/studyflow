'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 p-2 rounded-xl text-foreground-secondary hover:text-foreground bg-surface-elevated/80 hover:bg-surface-elevated border border-border transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
      title={mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
      aria-label="Toggle color theme"
    >
      {mounted && theme === 'light' ? (
        <Moon className="w-4 h-4 text-accent transition-transform duration-200" />
      ) : (
        <Sun className="w-4 h-4 text-accent transition-transform duration-200" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {mounted ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : 'Theme'}
        </span>
      )}
    </button>
  );
};
