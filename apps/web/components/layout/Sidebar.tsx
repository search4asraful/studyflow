'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { prefetchApi } from '../../lib/api';
import { OnlineActivityStatus } from './OnlineActivityStatus';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/rooms', label: 'Study Rooms', icon: Timer },
    { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  // Pre-warms Next.js route chunks and API cache before user clicks (perceived 0ms transition)
  const handlePrefetch = useCallback((href: string) => {
    try {
      router.prefetch(href);
      if (href === '/dashboard') {
        prefetchApi('/analytics/summary');
        prefetchApi('/rooms');
        prefetchApi('/tasks/my');
      } else if (href === '/rooms') {
        prefetchApi('/rooms');
      } else if (href === '/tasks') {
        prefetchApi('/tasks/my');
        prefetchApi('/rooms');
      } else if (href === '/analytics') {
        prefetchApi('/analytics/summary');
      }
    } catch {
      // Handled silently
    }
  }, [router]);

  return (
    <aside className="w-64 border-r border-border bg-surface/95 backdrop-blur-md hidden md:flex flex-col justify-between p-4 fixed top-16 left-0 bottom-0 z-30 transition-colors duration-200 overflow-y-auto">
      <div className="space-y-4">
        {/* Navigation Section */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted px-3 mb-2 block">
            Navigation
          </span>

          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => handlePrefetch(link.href)}
                  onTouchStart={() => handlePrefetch(link.href)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative',
                    isActive
                      ? 'bg-accent/15 text-accent font-semibold border border-accent/30 shadow-xs'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-surface-subtle'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-transform group-hover:scale-110',
                        isActive ? 'text-accent' : 'text-foreground-muted'
                      )}
                    />
                    <span>{link.label}</span>
                  </div>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-xs shadow-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Activity Status & Sign Out */}
      <div className="space-y-3 pt-3">
        {/* Quick Room Action */}
        <Link
          href="/rooms/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/35 transition-all group active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
          <span>New Room</span>
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium text-red-500 hover:text-red-600 dark:text-white hover:bg-red-500/10 dark:bg-red-500/30 border border-red-500/20 hover:border-red-500/30 transition-all cursor-pointer shadow-2xs group"
          title="Sign out of StudyFlow"
          type="button"
        >
          <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Sign Out</span>
        </button>

        {/* Dynamic Online Activity & Peer Reachability Card */}
        <OnlineActivityStatus />
      </div>
    </aside>
  );
};
