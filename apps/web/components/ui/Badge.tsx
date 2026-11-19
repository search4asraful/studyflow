'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'secondary' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variants = {
    default: 'bg-surface-elevated text-foreground-secondary border border-border',
    accent: 'bg-accent-muted text-accent border border-accent/30 font-medium',
    secondary: 'bg-surface text-foreground border border-border',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium',
    danger: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 font-medium',
    info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-medium',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
