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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { prefetchApi } from '../../lib/api';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/rooms', label: 'Rooms', icon: Timer },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

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
      // Ignore
    }
  }, [router]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border px-3 py-2 shadow-2xl transition-colors duration-200">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              onTouchStart={() => handlePrefetch(link.href)}
              onMouseEnter={() => handlePrefetch(link.href)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all',
                isActive
                  ? 'text-accent font-semibold'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  isActive ? 'bg-accent/20 border border-accent/40 shadow-xs' : 'bg-transparent'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-accent' : 'text-foreground-muted')} />
              </div>
              <span className="mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
