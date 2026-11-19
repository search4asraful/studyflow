'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/rooms', label: 'Study Rooms', icon: Timer },
    { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-surface hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-64px)] transition-colors duration-200">
      <div className="space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted px-3 mb-2 block">
          Navigation
        </span>

        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-surface-elevated text-accent font-semibold border border-border shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface-subtle'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-accent' : 'text-foreground-muted')} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Workspace Status Card */}
      <div className="card-subtle space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>StudyFlow Pro</span>
        </div>
        <p className="text-[11px] text-foreground-muted leading-relaxed">
          Authoritative real-time rooms, shared task boards, and synchronized Pomodoro.
        </p>
        <div className="text-[10px] text-foreground-secondary pt-1.5 divider-subtle flex items-center justify-between">
          <Link href="/credits" className="hover:text-accent transition-colors">
            Credits &amp; Team
          </Link>
          <span className="text-foreground-muted font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
