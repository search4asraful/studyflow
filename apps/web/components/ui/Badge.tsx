'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'secondary' | 'warning' | 'danger' | 'info' | 'success';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  const variants = {
    default: 'bg-surface-elevated text-foreground-secondary border border-border',
    accent: 'bg-accent/15 text-accent border border-accent/35 font-medium shadow-xs',
    secondary: 'bg-surface text-foreground border border-border',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35 font-medium',
    danger: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/35 font-medium',
    info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/35 font-medium',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 font-medium',
  };

  const dotColors = {
    default: 'bg-foreground-muted',
    accent: 'bg-accent animate-pulse',
    secondary: 'bg-foreground-secondary',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    success: 'bg-emerald-500',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium tracking-wide uppercase font-mono',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
