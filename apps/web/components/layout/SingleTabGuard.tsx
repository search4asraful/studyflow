'use client';

import React, { useEffect, useState } from 'react';
import { useActiveTabStore, initTabSync } from '../../lib/tabSync';
import { Layers, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { Button } from '../ui/Button';

export const SingleTabGuard: React.FC = () => {
  const isActiveTab = useActiveTabStore((s) => s.isActiveTab);
  const claimActiveTab = useActiveTabStore((s) => s.claimActiveTab);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cleanup = initTabSync();
    return cleanup;
  }, []);

  if (!mounted || isActiveTab) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Another tab is active"
      className="fixed inset-0 z-9999 flex items-center justify-center bg-canvas/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="card-glass max-w-md w-full p-6 sm:p-8 space-y-6 text-center border-accent/40 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-inner">
          <Layers className="w-7 h-7 animate-pulse" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] font-mono font-medium text-accent uppercase tracking-wider mb-1">
            <Cpu className="w-3 h-3" />
            <span>Single Tab Guard</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            StudyFlow is open in another tab
          </h2>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            To prevent desynchronized Pomodoro timers, drop duplicate WebSocket connections,
            and conserve server memory, only one active tab can control your session at a time.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={claimActiveTab}
            size="lg"
            variant="primary"
            className="w-full gap-2 text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 py-3"
          >
            <span>Use StudyFlow Here</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-foreground-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Your timer and progress remain authoritatively synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
};
