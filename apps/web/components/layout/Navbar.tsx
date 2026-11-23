'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../stores/authStore';
import {
  LogOut,
  Plus,
  Search,
  Command,
  LayoutDashboard,
  User,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { CommandPalette } from '../ui/CommandPalette';

export const Navbar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const logout = useAuthStore((s) => s.logout);

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration safety & background session verification
  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

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

  const isUserLoggedIn = mounted && (Boolean(user) || isAuthenticated);

  return (
    <>
      <header className="h-16 border-b border-border bg-surface/85 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
        {/* Brand Logo & Search Shortcut */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href={isUserLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent via-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-md shadow-accent/20 group-hover:scale-105 group-hover:shadow-accent/40 transition-all duration-200">
              SF
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-foreground">
                StudyFlow
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent">
                <Sparkles className="w-2.5 h-2.5" />
                Live Sync
              </span>
            </div>
          </Link>

          {/* Quick Search Trigger Button (Cmd+K) */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-foreground-muted bg-surface-subtle/80 hover:bg-surface-elevated border border-border hover:border-accent/40 rounded-xl transition-all cursor-pointer"
            title="Search & Quick Commands (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-accent" />
            <span className="text-foreground-secondary">Quick Search...</span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-foreground-muted bg-surface border border-border rounded-md shadow-2xs">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
        </div>

        {/* Right side controls: Theme, Actions, User Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Color Theme Toggle */}
          <ThemeToggle />

          {/* Render authenticated vs unauthenticated states smoothly */}
          {!mounted ? (
            // Skeleton pill while mounting to prevent layout jump or auth button flash
            <div className="h-8 w-24 bg-surface-subtle animate-pulse rounded-xl" />
          ) : isUserLoggedIn ? (
            // Authenticated controls: Dashboard button, New Room, Avatar & Logout
            <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-border">
              <Link href="/dashboard">
                <Button
                  size="sm"
                  variant="primary"
                  className="gap-1.5 text-xs font-semibold px-3 py-1.5 shadow-sm shadow-accent/20"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Dashboard</span>
                </Button>
              </Link>

              <Link href="/rooms/create">
                <Button size="sm" variant="secondary" className="hidden md:inline-flex gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5 text-accent" />
                  <span>New Room</span>
                </Button>
              </Link>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-surface-subtle border border-border">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-6 h-6 rounded-lg object-cover border border-accent/40 ring-1 ring-accent/20 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline-block text-xs font-medium text-foreground truncate max-w-[110px]">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>

                <button
                  onClick={() => logout()}
                  className="text-foreground-muted hover:text-red-500 hover:bg-red-500/10 p-1 rounded-md transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            // Unauthenticated controls: Sign in & Register
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-xs font-medium">
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
      </header>

      {/* Global Command Palette Spotlight Dialog */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
