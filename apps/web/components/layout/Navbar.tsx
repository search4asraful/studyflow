'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Globe,
  ArrowUpRight,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { CommandPalette } from '../ui/CommandPalette';
import { ThemeToggle } from '../ui/ThemeToggle';
import { cn } from '../../lib/utils';

export interface NavbarProps {
  variant?: 'auto' | 'frontend' | 'admin';
}

export const Navbar: React.FC<NavbarProps> = ({ variant = 'auto' }) => {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const logout = useAuthStore((s) => s.logout);

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Determine if we are rendering in the Admin Panel or Frontend
  const isAdminPanel =
    variant === 'admin' ||
    (variant !== 'frontend' &&
      pathname !== null &&
      (pathname.startsWith('/dashboard') ||
        pathname.startsWith('/rooms') ||
        pathname.startsWith('/tasks') ||
        pathname.startsWith('/analytics') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/admin')));

  // Hydration safety & background session verification
  useEffect(() => {
    setMounted(true);
    checkAuth();
    if (typeof window !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, [checkAuth]);

  // Global hotkey listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isUserLoggedIn = mounted && (Boolean(user) || isAuthenticated);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/85 backdrop-blur-xl transition-all duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* LEFT: Brand */}
          <div className="flex items-center shrink-0">
            <Link
              href={isAdminPanel ? '/dashboard' : '/'}
              className="flex items-center gap-2.5 group select-none"
              title={isAdminPanel ? 'StudyFlow Dashboard' : 'StudyFlow Home'}
            >
              <img
                src="/studyflow.png"
                alt="StudyFlow Logo"
                className="w-10 h-10 rounded-xl object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <span className="font-extrabold text-base tracking-tight text-foreground">
                StudyFlow
              </span>
            </Link>
          </div>

          {/* RIGHT: Quick Search (Ctrl/Command + K), Theme Toggle, Dashboard/Website View, User Profile / Auth */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Search Button: Border divided between icon and text, no white text background */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="h-9 px-2.5 sm:px-3 hidden sm:inline-flex items-center rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-border hover:border-accent/40 transition-all cursor-pointer shadow-2xs group"
              title={`Quick Search (${isMac ? '⌘ + K' : 'Ctrl + K'})`}
              type="button"
            >
              {/* Search Icon */}
              <div className="flex items-center justify-center sm:pr-2">
                <Search className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform duration-150" />
              </div>

              {/* Vertical Border Divider */}
              <div className="h-4 w-px bg-border group-hover:bg-accent/40 transition-colors block" />

              {/* Text with no background */}
              <div className="pl-2 flex items-center font-mono text-[11px] font-medium text-foreground-secondary group-hover:text-foreground transition-colors tracking-tight select-none ">
                <span>{isMac ? '⌘' : 'Ctrl'}</span>
                <span className="text-foreground-muted/70 mx-1 font-normal">+</span>
                <span>K</span>
              </div>
            </button>

            {/* Theme Toggle (Explicit h-9 w-9) */}
            <ThemeToggle />

            {/* Dashboard / Website View Toggle (Explicit h-9) */}
            {isAdminPanel ? (
              // When in Admin Panel: Button to switch to Website
              <Link
                href="/"
                className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-foreground-secondary hover:text-foreground bg-surface-subtle hover:bg-surface-elevated border border-border hover:border-accent/40 transition-all shadow-2xs"
                title="View Website"
              >
                <Globe className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">Website</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 hidden md:inline" />
              </Link>
            ) : isUserLoggedIn ? (
              // When on Frontend & Logged in: Button to go to Dashboard (Explicit h-9)
              <Link
                href="/dashboard"
                className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover border border-white/10 shadow-sm shadow-accent/25 transition-all active:scale-[0.98]"
                title="Go to Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
                <ArrowRight className="w-3 h-3 hidden md:inline" />
              </Link>
            ) : null}

            {/* User if logged in else Sign-in / Register (All Explicit h-9) */}
            {!mounted ? (
              <div className="h-9 w-20 bg-surface-subtle animate-pulse rounded-xl" />
            ) : isUserLoggedIn ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* User Profile Pill (Explicit h-9) */}
                <Link
                  href="/settings"
                  className="h-9 px-2 sm:px-2.5 inline-flex items-center gap-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-border hover:border-accent/40 transition-all select-none"
                  title="Account Settings"
                >
                  <div className="relative">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || 'User'}
                        className="w-5 h-5 rounded-lg object-cover border border-accent/40 ring-1 ring-accent/20 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-lg bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-bold text-[11px] shrink-0">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-surface" />
                  </div>

                  <span className="hidden sm:inline-block text-xs font-medium text-foreground truncate max-w-27.5">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </Link>

                {/* Mobile View Sign Out Button (Also visible on frontend pages without sidebar) */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className={cn(
                    'h-9 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95 shadow-2xs group',
                    isAdminPanel ? 'md:hidden' : ''
                  )}
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                  <span className="hidden xs:inline md:hidden text-[11px]">Sign Out</span>
                </button>
              </div>
            ) : (
              // Unauthenticated: Sign in & Register (Explicit h-9)
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center rounded-xl text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="h-9 px-3 sm:px-3.5 inline-flex items-center justify-center rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover shadow-sm shadow-accent/25 transition-all"
                >
                  Register
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
