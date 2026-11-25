'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTimerStore } from '../../stores/timerStore';
import { useRoomStore } from '../../stores/roomStore';
import { formatTimeRemaining, cn } from '../../lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  Sparkles,
  Coffee,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Shield,
  Target,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from '../../lib/confetti';
import { playTimerCountdownTick, playCompletionChime } from '../../lib/audio';

export interface PomodoroTimerProps {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onSkip?: (targetPhase?: string) => void;
  className?: string;
  activeTaskTitle?: string | null;
  onCompleteActiveTask?: () => void;
  onClearActiveTask?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onStart,
  onPause,
  onResume,
  onSkip,
  className = '',
  activeTaskTitle,
  onCompleteActiveTask,
  onClearActiveTask,
}) => {
  // Authoritative Timer Store
  const storeDisplaySeconds = useTimerStore((s) => s.displaySeconds);
  const storePhase = useTimerStore((s) => s.phase);
  const storeStatus = useTimerStore((s) => s.status);
  const storeCurrentCycle = useTimerStore((s) => s.currentCycle);
  const storeTotalDuration = useTimerStore((s) => s.totalPhaseDuration);
  const storePercentRemaining = useTimerStore((s) => s.percentRemaining);
  const authoritativeState = useTimerStore((s) => s.authoritativeState);

  // Room details & role
  const room = useRoomStore((s) => s.room);
  const role = useRoomStore((s) => s.role);

  const isAuthoritative = authoritativeState !== null;
  const canControl = role === 'OWNER' || role === 'MODERATOR' || !room;
  const cyclesTotal = room?.cyclesBeforeLongBreak || 4;

  // Local fallback state (offline / standalone)
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const [isLocalRunning, setIsLocalRunning] = useState(false);
  const [localCycle, setLocalCycle] = useState(1);
  const [localPhase, setLocalPhase] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');
  const [isZenMode, setIsZenMode] = useState(false);

  const getPhaseDuration = (p: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK') => {
    if (p === 'SHORT_BREAK') return room?.shortBreakDuration || 300;
    if (p === 'LONG_BREAK') return room?.longBreakDuration || 900;
    return room?.focusDuration || 1500;
  };

  const phase = isAuthoritative ? storePhase : localPhase;
  const isRunning = isAuthoritative ? storeStatus === 'RUNNING' : isLocalRunning;
  const isPaused = isAuthoritative
    ? storeStatus === 'PAUSED'
    : !isLocalRunning && localSeconds !== null && localSeconds < getPhaseDuration(phase);
  const currentCycle = isAuthoritative ? storeCurrentCycle : localCycle;

  const totalCycleSeconds =
    isAuthoritative && storeTotalDuration > 0
      ? storeTotalDuration
      : getPhaseDuration(phase);

  const secondsRemaining = isAuthoritative
    ? storeDisplaySeconds
    : localSeconds !== null
    ? localSeconds
    : totalCycleSeconds;

  const percentRemaining =
    isAuthoritative && storePercentRemaining !== undefined
      ? storePercentRemaining
      : totalCycleSeconds > 0
      ? Math.max(0, Math.min(100, (secondsRemaining / totalCycleSeconds) * 100))
      : 100;

  // Standalone offline interval ticker
  useEffect(() => {
    if (isAuthoritative) return;

    let timer: NodeJS.Timeout;
    if (isLocalRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setLocalSeconds((prev) => {
          const cur = prev !== null ? prev : totalCycleSeconds;
          if (cur <= 4 && cur > 1) {
            playTimerCountdownTick(cur - 1);
          }
          if (cur <= 1) {
            setIsLocalRunning(false);
            playCompletionChime();
            triggerConfetti({ particleCount: 90 });

            if (phase === 'FOCUS') {
              const isLongBreak = currentCycle >= cyclesTotal;
              const nextPhase = isLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK';
              setLocalPhase(nextPhase);
              return getPhaseDuration(nextPhase);
            } else {
              setLocalPhase('FOCUS');
              setLocalCycle((c) => (c < cyclesTotal ? c + 1 : 1));
              return getPhaseDuration('FOCUS');
            }
          }
          return cur - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAuthoritative, isLocalRunning, secondsRemaining, phase, currentCycle, cyclesTotal, totalCycleSeconds]);

  // Phase transition confetti & completion chime celebration
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      playCompletionChime();
      if (prevPhaseRef.current === 'FOCUS') {
        triggerConfetti({ particleCount: 90 });
      }
      prevPhaseRef.current = phase;
    }
  }, [phase]);

  const handleToggleTimer = () => {
    if (!canControl) return;

    if (isRunning) {
      if (onPause) {
        onPause();
      } else {
        setIsLocalRunning(false);
      }
    } else {
      if (isPaused && onResume) {
        onResume();
      } else if (onStart) {
        onStart();
      } else {
        setIsLocalRunning(true);
      }
    }
  };

  const handleSkipPhase = () => {
    if (!canControl) return;

    if (onSkip) {
      onSkip();
    } else {
      if (phase === 'FOCUS') {
        const isLong = currentCycle >= cyclesTotal;
        const nextPhase = isLong ? 'LONG_BREAK' : 'SHORT_BREAK';
        setLocalPhase(nextPhase);
        setLocalSeconds(getPhaseDuration(nextPhase));
      } else {
        setLocalPhase('FOCUS');
        const nextCycle = currentCycle < cyclesTotal ? currentCycle + 1 : 1;
        setLocalCycle(nextCycle);
        setLocalSeconds(getPhaseDuration('FOCUS'));
      }
      setIsLocalRunning(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSkipPhase();
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
  }, [isRunning, isPaused, canControl, isZenMode]);

  // Circular progress calculations: sleek hairline ring
  const radius = 138;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentRemaining / 100) * circumference;

  const phaseConfig = {
    FOCUS: {
      name: 'FOCUS',
      label: 'Focus Session',
      color: '#3F72AF',
      glow: 'rgba(63, 114, 175, 0.25)',
      dotClass: 'bg-accent',
      icon: <Sparkles className="w-3.5 h-3.5 text-accent" />,
    },
    SHORT_BREAK: {
      name: 'SHORT BREAK',
      label: 'Short Break',
      color: '#0EA5E9',
      glow: 'rgba(14, 165, 233, 0.25)',
      dotClass: 'bg-sky-400',
      icon: <Coffee className="w-3.5 h-3.5 text-sky-400" />,
    },
    LONG_BREAK: {
      name: 'LONG BREAK',
      label: 'Long Rest',
      color: '#8B5CF6',
      glow: 'rgba(139, 92, 246, 0.25)',
      dotClass: 'bg-purple-400',
      icon: <Coffee className="w-3.5 h-3.5 text-purple-400" />,
    },
  };

  const currentPhaseConfig = phaseConfig[phase] || phaseConfig.FOCUS;

  return (
    <>
      <div
        className={cn(
          'relative w-full flex flex-col items-center justify-center py-6 sm:py-8 transition-all duration-300 select-none',
          className
        )}
      >
        {/* Subtle, atmospheric ambient glow centered behind the clock */}
        <div
          className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-[90px] pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: currentPhaseConfig.color }}
        />

        {/* Phase Pill with clean typography */}
        <div className="relative z-10 flex items-center gap-2 mb-3 sm:mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-border/80 text-[11px] font-mono tracking-widest uppercase font-semibold text-foreground-secondary">
            <span className={cn('w-1.5 h-1.5 rounded-full', currentPhaseConfig.dotClass, isRunning && 'animate-pulse')} />
            <span>{currentPhaseConfig.name}</span>
          </span>

          {!canControl && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-subtle text-[10px] font-mono text-foreground-muted border border-border/60">
              <Shield className="w-3 h-3 text-accent" />
              <span>Host Synced</span>
            </span>
          )}
        </div>

        {/* Focal Centerpiece: Hairline Dial & Hero Numerals */}
        <div className="relative z-10 flex items-center justify-center my-1 select-none">
          <div className="relative w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 flex items-center justify-center">
            {/* Elegant SVG Hairline Dial */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
              {/* Background Hairline Track */}
              <circle
                cx="160"
                cy="160"
                r={radius}
                stroke="var(--border-subtle)"
                strokeWidth="4"
                fill="transparent"
                className="opacity-40"
              />
              {/* Animated Progress Sweep */}
              <motion.circle
                cx="160"
                cy="160"
                r={radius}
                stroke={currentPhaseConfig.color}
                strokeWidth="5"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'linear' }}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter: `drop-shadow(0 0 12px ${currentPhaseConfig.glow})`,
                }}
              />
            </svg>

            {/* Central Giant Typographic Digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <button
                type="button"
                onClick={handleToggleTimer}
                disabled={!canControl}
                className={cn(
                  'text-6xl sm:text-7xl md:text-8xl font-mono font-light tracking-tight tabular-nums text-foreground select-none transition-all duration-150',
                  canControl && 'cursor-pointer hover:text-accent active:scale-98'
                )}
                title={canControl ? (isRunning ? 'Pause (Space)' : 'Start (Space)') : undefined}
              >
                {formatTimeRemaining(secondsRemaining)}
              </button>

              {/* Cycle Tracker: Hairline Dots */}
              <div className="flex items-center gap-1.5 mt-3">
                {Array.from({ length: cyclesTotal }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      i + 1 === currentCycle
                        ? 'bg-accent scale-125 shadow-xs shadow-accent ring-2 ring-accent/30'
                        : i + 1 < currentCycle
                        ? 'bg-accent/70'
                        : 'bg-surface-elevated border border-border'
                    )}
                    title={`Interval ${i + 1} of ${cyclesTotal}`}
                  />
                ))}
              </div>

              <span className="text-[11px] font-mono uppercase tracking-widest text-foreground-muted mt-2">
                Interval {currentCycle} of {cyclesTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Active Focus Target Pill (Inline & Elegant) */}
        <div className="relative z-10 mt-3 mb-2 min-h-[34px] flex items-center justify-center">
          {activeTaskTitle ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-xs text-foreground max-w-sm sm:max-w-md animate-in fade-in duration-200 shadow-2xs">
              <Target className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="truncate font-medium">{activeTaskTitle}</span>
              {onCompleteActiveTask && (
                <button
                  type="button"
                  onClick={onCompleteActiveTask}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 pl-1 cursor-pointer shrink-0"
                  title="Mark task completed"
                >
                  <Check className="w-3 h-3" />
                  <span>Done</span>
                </button>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-mono text-foreground-muted tracking-wide">
              Press <kbd className="px-1.5 py-0.5 rounded-sm bg-surface-subtle border border-border text-foreground-secondary text-[10px]">Space</kbd> to {isRunning ? 'pause' : 'start focus'}
            </span>
          )}
        </div>

        {/* Minimal Control Pill Cluster */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 mt-2">
          {canControl ? (
            <>
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleToggleTimer}
                className={cn(
                  'h-11 px-6 rounded-full font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md select-none active:scale-95',
                  isRunning
                    ? 'bg-surface-elevated hover:bg-surface-subtle text-amber-400 border border-amber-500/40'
                    : 'bg-accent hover:bg-accent-hover text-white shadow-accent/25'
                )}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isPaused ? 'Resume' : 'Start Focus'}</span>
                  </>
                )}
              </button>

              {/* Skip Button */}
              <button
                type="button"
                onClick={handleSkipPhase}
                className="h-11 w-11 rounded-full inline-flex items-center justify-center text-foreground-secondary hover:text-foreground bg-surface-subtle hover:bg-surface-elevated border border-border transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Skip to next phase (S)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Zen Mode Button */}
              <button
                type="button"
                onClick={() => setIsZenMode(true)}
                className="h-11 w-11 rounded-full inline-flex items-center justify-center text-foreground-secondary hover:text-foreground bg-surface-subtle hover:bg-surface-elevated border border-border transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Fullscreen Zen Mode (Z)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="py-2 px-4 rounded-full bg-surface-subtle border border-border text-xs text-foreground-secondary flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>Synchronized with Room Host</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Zen Focus Mode Overlay */}
      {isZenMode &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-[#07111e] text-foreground flex flex-col items-center justify-between p-6 sm:p-12 animate-in fade-in duration-200">
            {/* Zen Header */}
            <div className="flex items-center justify-between w-full max-w-4xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xs shadow-md">
                  SF
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    {room?.name || 'Study Room'}
                  </h2>
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    Zen Focus
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsZenMode(false)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Exit Zen Mode (Esc)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Giant Zen Digits */}
            <div className="flex flex-col items-center justify-center text-center my-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-mono tracking-widest uppercase mb-4">
                <span className={cn('w-2 h-2 rounded-full', currentPhaseConfig.dotClass)} />
                <span>{currentPhaseConfig.name}</span>
              </span>

              <div className="text-8xl sm:text-9xl md:text-[11rem] font-mono font-light tracking-tighter tabular-nums text-white drop-shadow-2xl my-2">
                {formatTimeRemaining(secondsRemaining)}
              </div>

              {activeTaskTitle && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm mt-3">
                  <Target className="w-4 h-4 text-accent" />
                  <span>{activeTaskTitle}</span>
                </div>
              )}

              {/* Cycle dots */}
              <div className="flex items-center gap-2.5 mt-8">
                {Array.from({ length: cyclesTotal }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-3 h-3 rounded-full transition-all duration-300',
                      i + 1 === currentCycle
                        ? 'bg-accent scale-125 shadow-lg shadow-accent/50'
                        : i + 1 < currentCycle
                        ? 'bg-accent/70'
                        : 'bg-white/20'
                    )}
                  />
                ))}
              </div>

              <span className="text-xs font-mono uppercase tracking-widest text-white/50 mt-3">
                Interval {currentCycle} of {cyclesTotal}
              </span>

              {/* Zen Controls */}
              {canControl && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    onClick={handleToggleTimer}
                    className="px-8 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold text-sm shadow-xl active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>{isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start Focus'}</span>
                  </button>

                  <button
                    onClick={handleSkipPhase}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    title="Skip (S)"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Zen Footer */}
            <div className="text-xs font-mono text-white/40 flex items-center gap-3">
              <span>Space to toggle</span>
              <span>•</span>
              <span>S to skip</span>
              <span>•</span>
              <span>Esc to exit</span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
