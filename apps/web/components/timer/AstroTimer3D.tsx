'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Coffee,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { triggerConfetti } from '../../lib/confetti';
import { cn } from '../../lib/utils';
import { useRoomStore } from '../../stores/roomStore';
import { useTimerStore } from '../../stores/timerStore';

interface AstroTimer3DProps {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onSkip?: (targetPhase?: string) => void;
  className?: string;
}

export const AstroTimer3D: React.FC<AstroTimer3DProps> = ({
  onStart,
  onPause,
  onResume,
  onSkip,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Authoritative Timer Store state
  const storeDisplaySeconds = useTimerStore((s) => s.displaySeconds);
  const storePhase = useTimerStore((s) => s.phase);
  const storeStatus = useTimerStore((s) => s.status);
  const storeCurrentCycle = useTimerStore((s) => s.currentCycle);
  const storeTotalDuration = useTimerStore((s) => s.totalPhaseDuration);
  const storePercentRemaining = useTimerStore((s) => s.percentRemaining);
  const authoritativeState = useTimerStore((s) => s.authoritativeState);

  // Room details
  const room = useRoomStore((s) => s.room);

  // Local fallback state
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const [isLocalRunning, setIsLocalRunning] = useState(false);
  const [localCycle, setLocalCycle] = useState(1);
  const [localPhase, setLocalPhase] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');

  const [isZenMode, setIsZenMode] = useState(false);

  const isAuthoritative = authoritativeState !== null;
  const cyclesTotal = room?.cyclesBeforeLongBreak || 4;

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

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs));
    const mins = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Local 1-second interval ticker for standalone/offline fallback
  useEffect(() => {
    if (isAuthoritative) return;

    let timer: NodeJS.Timeout;
    if (isLocalRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setLocalSeconds((prev) => {
          const cur = prev !== null ? prev : totalCycleSeconds;
          if (cur <= 1) {
            setIsLocalRunning(false);
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

  // Track phase transitions for celebration
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      if (prevPhaseRef.current === 'FOCUS') {
        triggerConfetti({ particleCount: 90 });
      }
      prevPhaseRef.current = phase;
    }
  }, [phase]);

  // Keyboard shortcut listener: Space to Toggle, S to Skip, Z for Zen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInputFocused) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer();
      } else if (e.code === 'KeyS' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSkip();
      } else if (e.code === 'KeyZ' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsZenMode((z) => !z);
      } else if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, isRunning, isPaused]);

  const handleToggleTimer = () => {
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

  const handleSkip = () => {
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

  const percentRemaining =
    isAuthoritative && storePercentRemaining !== undefined
      ? storePercentRemaining
      : totalCycleSeconds > 0
      ? (secondsRemaining / totalCycleSeconds) * 100
      : 100;

  const phaseLabel =
    phase === 'SHORT_BREAK'
      ? 'SHORT BREAK'
      : phase === 'LONG_BREAK'
      ? 'LONG BREAK'
      : 'FOCUS';

  return (
    <div ref={containerRef} className={cn('relative w-full shrink-0', className)}>
      <div className="relative rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 bg-surface/90 border border-border/80 shadow-xs backdrop-blur-xl overflow-hidden transition-all duration-200">
        <div className="flex items-center justify-between gap-3 sm:gap-6 relative z-10">
          {/* LEFT: Phase Badge, Status Indicator, and Cycle Dots */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Phase Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent/15 text-accent border border-accent/30 shadow-2xs">
              {phase === 'FOCUS' ? (
                <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              ) : (
                <Coffee className="w-3.5 h-3.5 text-accent animate-bounce" />
              )}
              <span>{phaseLabel}</span>
            </div>

            {/* Cycle indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: cyclesTotal }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    i + 1 === currentCycle
                      ? 'bg-accent scale-125 shadow-xs shadow-accent'
                      : i + 1 < currentCycle
                      ? 'bg-accent/70'
                      : 'bg-surface-elevated border border-border'
                  )}
                  title={`Cycle ${i + 1} of ${cyclesTotal}`}
                />
              ))}
              <span className="text-[10px] font-mono text-foreground-muted ml-1">
                {currentCycle}/{cyclesTotal}
              </span>
            </div>

            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isRunning ? 'bg-emerald-400 animate-ping' : isPaused ? 'bg-amber-400' : 'bg-foreground-muted'
                )}
              />
              <span className="font-semibold uppercase text-foreground-secondary">
                {isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'READY'}
              </span>
            </div>
          </div>

          {/* CENTER: Countdown Display & Mini Progress */}
          <div className="flex items-center gap-3">
            <span
              onClick={handleToggleTimer}
              className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground cursor-pointer select-none hover:text-accent transition-colors"
              title="Click to toggle"
            >
              {formatTime(secondsRemaining)}
            </span>

            {/* Mini Progress Track */}
            <div className="hidden md:flex flex-col gap-0.5 w-20 xl:w-28">
              <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-border/60">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 ease-linear"
                  style={{ width: `${percentRemaining}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-foreground-muted text-right">
                {Math.round(percentRemaining)}%
              </span>
            </div>
          </div>

          {/* RIGHT: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Play/Pause Button */}
            <button
              onClick={handleToggleTimer}
              className={cn(
                'h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg font-bold text-xs select-none transition-all duration-200 cursor-pointer shadow-xs active:scale-95',
                isRunning
                  ? 'bg-surface-elevated hover:bg-surface-subtle text-amber-400 border border-amber-500/30'
                  : 'bg-accent hover:bg-accent-hover text-white shadow-accent/25'
              )}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPaused ? 'Resume' : 'Start'}</span>
                </>
              )}
            </button>

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-subtle text-foreground-secondary hover:text-foreground border border-border transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Skip to next (S)"
              type="button"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Zen Mode Button */}
            <button
              onClick={() => setIsZenMode(true)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-subtle text-foreground-secondary hover:text-foreground border border-border transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Fullscreen Zen Mode (Z)"
              type="button"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Zen Mode Portal */}
      {isZenMode &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-canvas text-foreground flex flex-col items-center justify-between p-6 sm:p-12 animate-in fade-in duration-150 transform-gpu">
            <div className="flex items-center justify-between w-full max-w-4xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-accent to-sky-400 text-white flex items-center justify-center font-bold text-sm">
                  SF
                </div>
                <span className="text-sm font-bold text-foreground">
                  {room?.name ? `${room.name} — Zen Mode` : 'StudyFlow — Zen Mode'}
                </span>
              </div>

              <button
                onClick={() => setIsZenMode(false)}
                className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-subtle text-foreground border border-border transition-all cursor-pointer"
                title="Exit Zen Mode (Esc)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center my-auto">
              <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-accent/15 text-accent border border-accent/40 mb-4 inline-block">
                {phaseLabel}
              </span>
              <div className="text-7xl sm:text-9xl font-mono font-bold tracking-tighter text-foreground drop-shadow-2xl my-3">
                {formatTime(secondsRemaining)}
              </div>
              <p className="text-xs font-mono text-foreground-muted uppercase tracking-widest mt-2">
                {phase === 'SHORT_BREAK'
                  ? 'SHORT BREAK • RECHARGE'
                  : phase === 'LONG_BREAK'
                  ? 'LONG BREAK • EXTENDED REST'
                  : `CYCLE ${currentCycle} OF ${cyclesTotal}`}
              </p>

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={handleToggleTimer}
                  className="px-8 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  {isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
                </button>
                <button
                  onClick={handleSkip}
                  className="p-3.5 rounded-2xl bg-surface-elevated hover:bg-surface-subtle text-foreground border border-border transition-all cursor-pointer"
                  title="Skip"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-xs font-mono text-foreground-muted">
              Press <kbd className="px-1.5 py-0.5 rounded-sm bg-surface-elevated border border-border text-foreground">Space</kbd> to toggle • Press <kbd className="px-1.5 py-0.5 rounded-sm bg-surface-elevated border border-border text-foreground">Esc</kbd> to exit
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
