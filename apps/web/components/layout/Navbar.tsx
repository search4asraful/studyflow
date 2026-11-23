'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../stores/authStore';
import { LogOut, Plus, Search, Command } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { CommandPalette } from '../ui/CommandPalette';

export const Navbar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global hotkey listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
        {/* Brand Logo & Navigation Quick Search */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent via-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-md group-hover:scale-105 group-hover:shadow-accent/40 transition-all">
              SF
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              StudyFlow
            </span>
          </Link>

          {/* Quick Search Trigger Button (Cmd+K) */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-foreground-muted bg-surface-subtle/80 hover:bg-surface-elevated border border-border hover:border-accent/40 rounded-xl transition-all"
            title="Search & Quick Commands (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-accent" />
            <span className="text-foreground-secondary">Quick Search...</span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-foreground-muted bg-surface border border-border rounded-md shadow-2xs">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
        </div>

        {/* Right side controls: Theme, User actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Color Theme Toggle */}
          <ThemeToggle />

          {/* Quick Create Room Button */}
          <Link href="/rooms/create">
            <Button size="sm" variant="secondary" className="hidden sm:inline-flex gap-1.5">
              <Plus className="w-3.5 h-3.5 text-accent" />
              New Room
            </Button>
          </Link>

          {/* User Profile / Auth State */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            {user ? (
              <>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-border ring-1 ring-accent/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border text-accent flex items-center justify-center font-bold text-xs ring-1 ring-accent/20">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[130px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-foreground-muted truncate max-w-[130px]">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => logout()}
                  className="text-foreground-muted hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="ghost" className="text-xs">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="primary" className="text-xs font-semibold shadow-xs">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette Spotlight Dialog */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
