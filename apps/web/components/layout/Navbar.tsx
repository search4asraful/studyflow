'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../stores/authStore';
import { LogOut, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Navbar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="h-16 border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-md group-hover:scale-105 transition-transform">
            SF
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">StudyFlow</span>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {user ? (
          <>
            <Link href="/rooms/create">
              <Button size="sm" variant="secondary" className="hidden sm:inline-flex gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Room
              </Button>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-border">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-subtle border border-border text-accent flex items-center justify-center font-semibold text-xs">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-foreground leading-tight truncate max-w-[120px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-foreground-muted truncate max-w-[120px]">{user.email}</p>
              </div>

              <button
                onClick={() => logout()}
                className="text-foreground-muted hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg transition-colors ml-1"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
