'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] cursor-pointer';

    const variants = {
      primary:
        'bg-accent hover:bg-accent-hover text-white font-semibold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/35 border border-white/10',
      secondary:
        'bg-surface-elevated hover:bg-surface-subtle text-foreground border border-border shadow-2xs hover:border-accent/40',
      outline:
        'border border-border hover:border-accent/60 hover:bg-surface-elevated text-foreground shadow-2xs',
      ghost:
        'hover:bg-surface-elevated text-foreground-secondary hover:text-foreground',
      danger:
        'bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 border border-red-500/30 focus:ring-red-500 font-medium shadow-2xs',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
      md: 'text-sm px-4 py-2 rounded-xl gap-2',
      lg: 'text-base px-6 py-3 rounded-2xl gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
