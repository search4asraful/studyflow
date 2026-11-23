'use client';

import React, { useState, useEffect } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { useRoomStore } from '../../stores/roomStore';
import { formatTimeRemaining } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Play,
  Pause,
  SkipForward,
  Sparkles,
  Coffee,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Headphones,
  Volume2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from '../../lib/confetti';
import { cn } from '../../lib/utils';

interface PomodoroTimerProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: (targetPhase?: string) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onStart,
  onPause,
  onResume,
  onSkip,
}) => {
  const displaySeconds = useTimerStore((s) => s.displaySeconds);
  const phase = useTimerStore((s) => s.phase);
  const status = useTimerStore((s) => s.status);
  const currentCycle = useTimerStore((s) => s.currentCycle);
  const percentRemaining = useTimerStore((s) => s.percentRemaining);

  const room = useRoomStore((s) => s.room);
  const role = useRoomStore((s) => s.role);

  const [isZenMode, setIsZenMode] = useState(false);
  const canControl = role === 'OWNER' || role === 'MODERATOR';
  const cyclesTotal = room?.cyclesBeforeLongBreak || 4;

  // Track previous phase to trigger celebration confetti on transition
  const prevPhaseRef = React.useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      if (prevPhaseRef.current === 'FOCUS') {
        // Focus phase just ended -> Completed session!
        triggerConfetti({ particleCount: 90 });
      }
      prevPhaseRef.current = phase;
    }
  }, [phase]);

  // Global hotkeys for Timer (Space = Play/Pause, S = Skip, Z = Zen mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (canControl) {
          if (status === 'RUNNING') onPause();
          else if (status === 'PAUSED') onResume();
          else onStart();
        }
      } else if (e.key.toLowerCase() === 's' && canControl) {
        e.preventDefault();
        onSkip();
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        setIsZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, canControl, isZenMode, onPause, onResume, onStart, onSkip]);

  // Circular progress calculations
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentRemaining / 100) * circumference;

  const phaseConfig = {
    FOCUS: {
      label: 'Deep Focus Session',
      accentColor: '#3F72AF',
      glowColor: 'rgba(63, 114, 175, 0.35)',
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      badgeVariant: 'accent' as const,
    },
    SHORT_BREAK: {
      label: 'Short Refresh Break',
      accentColor: '#0EA5E9',
      glowColor: 'rgba(14, 165, 233, 0.35)',
      icon: <Coffee className="w-4 h-4 text-sky-400" />,
      badgeVariant: 'info' as const,
    },
    LONG_BREAK: {
      label: 'Extended Rest Period',
      accentColor: '#8B5CF6',
      glowColor: 'rgba(139, 92, 246, 0.35)',
      icon: <Coffee className="w-4 h-4 text-purple-400" />,
      badgeVariant: 'warning' as const,
    },
  };

  const currentPhaseConfig = phaseConfig[phase] || phaseConfig.FOCUS;

  return (
    <>
      <div className="card-elevated flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden shadow-2xl border-accent/20">
        {/* Dynamic ambient background glow */}
        <div
          className="absolute w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-25 transition-all duration-700"
          style={{ backgroundColor: currentPhaseConfig.accentColor }}
        />

        {/* Top Status & Zen Mode Trigger */}
        <div className="flex items-center justify-between w-full mb-6 z-10">
          <Badge
            variant={currentPhaseConfig.badgeVariant}
            size="md"
            className="flex items-center gap-1.5 px-3 py-1.5 shadow-xs"
          >
            {currentPhaseConfig.icon}
            <span>{currentPhaseConfig.label}</span>
          </Badge>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest text-foreground-muted flex items-center gap-1.5 bg-surface-subtle px-2.5 py-1 rounded-full border border-border">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'RUNNING'
                    ? 'bg-emerald-400 animate-ping'
                    : status === 'PAUSED'
                    ? 'bg-amber-400'
                    : 'bg-foreground-muted'
                }`}
              />
              {status}
            </span>

            {/* Zen Mode Button */}
            <button
              onClick={() => setIsZenMode(true)}
              className="p-1.5 rounded-lg text-foreground-muted hover:text-accent hover:bg-surface-elevated transition-colors"
              title="Fullscreen Zen Mode (Z)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Authoritative Circular Progress Timer */}
        <div className="relative flex items-center justify-center w-72 h-72 my-2 select-none z-10">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="var(--border-subtle)"
              strokeWidth="8"
              fill="transparent"
            />
            <motion.circle
              cx="160"
              cy="160"
              r={radius}
              stroke={currentPhaseConfig.accentColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'linear' }}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: `drop-shadow(0 0 8px ${currentPhaseConfig.glowColor})` }}
            />
          </svg>

          {/* Central Time Remaining Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <motion.div
              key={displaySeconds}
              initial={{ scale: 0.98, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="text-6xl font-bold font-mono tracking-tighter text-foreground"
            >
              {formatTimeRemaining(displaySeconds)}
            </motion.div>

            {/* Cycle indicator dots */}
            <div className="flex items-center gap-2 mt-4">
              {Array.from({ length: cyclesTotal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all duration-300',
                    i < currentCycle
                      ? 'bg-accent scale-110 shadow-xs shadow-accent'
                      : 'bg-surface-subtle border border-border'
                  )}
                  title={`Interval ${i + 1} of ${cyclesTotal}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary mt-2">
              Cycle {currentCycle} of {cyclesTotal}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col items-center gap-4 z-10 w-full max-w-xs">
          {canControl ? (
            <div className="flex items-center justify-center gap-3 w-full">
              {status === 'RUNNING' ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    onPause();
                  }}
                  className="flex-1 font-semibold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 shadow-md"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  Pause
                </Button>
              ) : status === 'PAUSED' ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    onResume();
                  }}
                  className="flex-1 font-semibold shadow-md shadow-accent/25"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Resume
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    onStart();
                  }}
                  className="flex-1 font-semibold shadow-md shadow-accent/25"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Focus
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  onSkip();
                }}
                title="Skip to next phase (S)"
                className="text-foreground-secondary hover:text-foreground px-3.5"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-foreground-secondary card-subtle px-4 py-2.5 text-center w-full justify-center">
              <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
              <span>Synchronized to Room Host</span>
            </div>
          )}

          <div className="flex items-center justify-between w-full text-[11px] text-foreground-muted px-2 font-mono">
            <span>Authoritative Engine</span>
            <span>•</span>
            <span>Zero Clock Drift</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Zen Focus Mode Overlay */}
      <AnimatePresence>
        {isZenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#081321] text-foreground flex flex-col items-center justify-between p-8 sm:p-12"
          >
            {/* Zen Mode Header */}
            <div className="flex items-center justify-between w-full max-w-4xl">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xs">
                  SF
                </div>
                <span className="text-sm font-bold tracking-tight text-white/90">
                  {room?.name} • Zen Focus Mode
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsZenMode(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                  title="Exit Zen Mode (Esc)"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Zen Mode Giant Central Timer */}
            <div className="flex flex-col items-center justify-center text-center my-auto">
              <div className="mb-4">
                <Badge variant={currentPhaseConfig.badgeVariant} size="md" className="px-4 py-1.5 text-sm">
                  {currentPhaseConfig.icon}
                  <span>{currentPhaseConfig.label}</span>
                </Badge>
              </div>

              <div className="text-8xl sm:text-9xl font-mono font-bold tracking-tighter text-white drop-shadow-2xl">
                {formatTimeRemaining(displaySeconds)}
              </div>

              {/* Cycle dots */}
              <div className="flex items-center gap-3 mt-8">
                {Array.from({ length: cyclesTotal }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full transition-all duration-300',
                      i < currentCycle
                        ? 'bg-accent scale-110 shadow-lg shadow-accent/50'
                        : 'bg-white/15'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-white/60 mt-3">
                Cycle {currentCycle} of {cyclesTotal}
              </span>

              {/* Controls in Zen mode */}
              {canControl && (
                <div className="mt-10 flex items-center gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      if (status === 'RUNNING') onPause();
                      else if (status === 'PAUSED') onResume();
                      else onStart();
                    }}
                    className="px-8 py-3.5 text-base gap-2"
                  >
                    {status === 'RUNNING' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    <span>{status === 'RUNNING' ? 'Pause' : status === 'PAUSED' ? 'Resume' : 'Start Focus'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      onSkip();
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                    title="Skip phase (S)"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Zen Mode Footer Hint */}
            <div className="text-xs font-mono text-white/40 flex items-center gap-4">
              <span>Press <kbd className="px-1.5 py-0.5 rounded-sm bg-white/10 text-white/80">Space</kbd> to toggle</span>
              <span>•</span>
              <span>Press <kbd className="px-1.5 py-0.5 rounded-sm bg-white/10 text-white/80">Esc</kbd> to exit</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
