'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  Headphones,
  Sparkles,
  Search,
  X,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { triggerConfetti } from '../../lib/confetti';
import { cn } from '../../lib/utils';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Tools';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Go to Dashboard',
      subtitle: 'Overview of focus streak, weekly trends & active rooms',
      icon: <LayoutDashboard className="w-4 h-4 text-accent" />,
      shortcut: 'G D',
      action: () => router.push('/dashboard'),
    },
    {
      id: 'nav-rooms',
      category: 'Navigation',
      title: 'Browse Study Rooms',
      subtitle: 'Join public rooms or enter with an invite code',
      icon: <Timer className="w-4 h-4 text-accent" />,
      shortcut: 'G R',
      action: () => router.push('/rooms'),
    },
    {
      id: 'nav-tasks',
      category: 'Navigation',
      title: 'View My Tasks',
      subtitle: 'Manage and update your personal and room action items',
      icon: <CheckSquare className="w-4 h-4 text-accent" />,
      shortcut: 'G T',
      action: () => router.push('/tasks'),
    },
    {
      id: 'nav-analytics',
      category: 'Navigation',
      title: 'View Productivity Analytics',
      subtitle: 'Detailed charts, streak statistics & focus allocations',
      icon: <BarChart3 className="w-4 h-4 text-accent" />,
      shortcut: 'G A',
      action: () => router.push('/analytics'),
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Settings & Profile',
      subtitle: 'Personalize sound chimes, targets and security',
      icon: <Settings className="w-4 h-4 text-accent" />,
      shortcut: 'G S',
      action: () => router.push('/settings'),
    },
    {
      id: 'act-create-room',
      category: 'Actions',
      title: 'Create a New Study Room',
      subtitle: 'Configure Pomodoro intervals and private access',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      shortcut: 'C R',
      action: () => router.push('/rooms/create'),
    },
    {
      id: 'act-toggle-theme',
      category: 'Actions',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: 'Toggle between Midnight Navy and Ice-Blue theme',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      shortcut: 'T',
      action: () => toggleTheme(),
    },
    {
      id: 'act-confetti',
      category: 'Tools',
      title: 'Celebrate with Confetti Burst',
      subtitle: 'Sparkling particle animation reward',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => triggerConfetti({ particleCount: 100 }),
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(search.toLowerCase())) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 transform-gpu"
      />

      {/* Palette Dialog Box */}
      <div className="relative w-full max-w-xl card-elevated p-0 overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 border-accent/30 transform-gpu">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-elevated/50">
          <Search className="w-5 h-5 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search (e.g. rooms, tasks, theme)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-muted focus:outline-hidden"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="text-foreground-muted hover:text-foreground p-1 rounded-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-foreground-muted bg-surface-subtle border border-border rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-10 text-xs text-foreground-muted">
              No matching commands or destinations found.
            </div>
          ) : (
            filteredCommands.map((command, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer',
                    isSelected
                      ? 'bg-accent/15 border border-accent/40 text-foreground'
                      : 'hover:bg-surface-subtle text-foreground-secondary hover:text-foreground border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center border shrink-0',
                        isSelected
                          ? 'bg-accent/25 border-accent text-accent'
                          : 'bg-surface-subtle border-border'
                      )}
                    >
                      {command.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">{command.title}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-xs bg-surface-subtle border border-border text-foreground-muted">
                          {command.category}
                        </span>
                      </div>
                      {command.subtitle && (
                        <p className="text-[11px] text-foreground-muted truncate mt-0.5">
                          {command.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {command.shortcut && (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-foreground-muted bg-surface-subtle border border-border rounded-md">
                        {command.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        isSelected ? 'text-accent translate-x-0.5' : 'text-transparent'
                      )}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-surface-subtle/80 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-sm bg-surface border border-border font-mono text-[10px]">↑↓</kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-sm bg-surface border border-border font-mono text-[10px]">↵</kbd>{' '}
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-sm bg-surface border border-border font-mono text-[10px]">ESC</kbd>{' '}
              Close
            </span>
          </div>

          <span className="font-mono text-accent text-[10px]">StudyFlow Quick Command</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
