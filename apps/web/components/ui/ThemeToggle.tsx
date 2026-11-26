'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

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
      className={cn(
        'inline-flex items-center justify-center h-9 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-border hover:border-accent/40 transition-all shadow-2xs text-foreground-secondary hover:text-foreground duration-150 shrink-0 cursor-pointer',
        showLabel ? 'px-3 gap-2' : 'w-9',
        className
      )}
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
