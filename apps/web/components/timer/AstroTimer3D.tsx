'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  SkipForward,
  Sparkles,
  Coffee,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import gsap from 'gsap';
import { triggerConfetti } from '../../lib/confetti';
import { useTimerStore } from '../../stores/timerStore';
import { useRoomStore } from '../../stores/roomStore';
import { cn } from '../../lib/utils';

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
  const cardRef = useRef<HTMLDivElement>(null);
  const circleStageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);

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

  // Local fallback state (used if authoritative socket is not connected)
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const [isLocalRunning, setIsLocalRunning] = useState(false);
  const [localCycle, setLocalCycle] = useState(1);
  const [localPhase, setLocalPhase] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');

  const [isZenMode, setIsZenMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isAuthoritative = authoritativeState !== null;

  // Total cycles configured for the room (defaults to 4)
  const cyclesTotal = room?.cyclesBeforeLongBreak || 4;

  // Helper to determine duration based on phase
  const getPhaseDuration = (p: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK') => {
    if (p === 'SHORT_BREAK') return room?.shortBreakDuration || 300; // 5 min
    if (p === 'LONG_BREAK') return room?.longBreakDuration || 900; // 15 min
    return room?.focusDuration || 1500; // room's configured focus duration
  };

  const phase = isAuthoritative ? storePhase : localPhase;
  const isRunning = isAuthoritative ? storeStatus === 'RUNNING' : isLocalRunning;
  const isPaused = isAuthoritative
    ? storeStatus === 'PAUSED'
    : !isLocalRunning && localSeconds !== null && localSeconds < getPhaseDuration(phase);
  const currentCycle = isAuthoritative ? storeCurrentCycle : localCycle;

  // Exact duration for the active cycle/phase (never hardcoded to 25!)
  const totalCycleSeconds =
    isAuthoritative && storeTotalDuration > 0
      ? storeTotalDuration
      : getPhaseDuration(phase);

  const secondsRemaining = isAuthoritative
    ? storeDisplaySeconds
    : localSeconds !== null
    ? localSeconds
    : totalCycleSeconds;

  // Format MM:SS
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

            // Cycle transition
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
  }, [isAuthoritative, isLocalRunning, secondsRemaining, phase, currentCycle, cyclesTotal]);

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

  // Pointer-driven 3D tilt & parallax physics applied directly to the timer circle
  const handleCircleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!circleStageRef.current) return;
    const rect = circleStageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const normX = Math.max(-1, Math.min(1, x / (rect.width / 2)));
    const normY = Math.max(-1, Math.min(1, y / (rect.height / 2)));

    setMousePos({ x: normX, y: normY });

    gsap.to(circleStageRef.current, {
      rotateY: normX * 18,
      rotateX: -normY * 18,
      transformPerspective: 1000,
      scale: 1.04,
      duration: 0.35,
      ease: 'power2.out',
    });
  };

  const handleCircleMouseLeave = () => {
    if (!circleStageRef.current) return;
    setMousePos({ x: 0, y: 0 });
    gsap.to(circleStageRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.6,
      ease: 'power3.out',
    });
  };

  // Keyboard shortcut listener (Space = Toggle, S = Skip, Z = Zen)
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
        handleSkip();
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setIsZenMode((z) => !z);
      } else if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
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
      // Local fallback transition
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

  // Circular progress calculations (Radius = 125)
  const radius = 125;
  const circumference = 2 * Math.PI * radius;
  const percentRemaining =
    isAuthoritative && storePercentRemaining !== undefined
      ? storePercentRemaining
      : totalCycleSeconds > 0
      ? (secondsRemaining / totalCycleSeconds) * 100
      : 100;
  const strokeDashoffset = circumference - (percentRemaining / 100) * circumference;

  // Phase label
  const phaseLabel =
    phase === 'SHORT_BREAK'
      ? 'SHORT BREAK'
      : phase === 'LONG_BREAK'
      ? 'LONG RECOVERY BREAK'
      : 'DEEP FOCUS SESSION';

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Outer Card: Stable, grounded, adhering to global theme */}
      <div
        ref={cardRef}
        className="card-glass relative rounded-3xl p-6 sm:p-7 bg-surface/90 border border-border shadow-xl backdrop-blur-xl overflow-hidden transition-colors duration-200"
      >
        {/* Layered Specular Glow Backdrop inside Card */}
        <div
          className="absolute w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-25 dark:opacity-20 transition-all duration-700 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: isRunning
              ? 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)'
              : 'radial-gradient(circle, var(--color-accent-hover) 0%, transparent 70%)',
            top: '35%',
            left: '50%',
          }}
        />

        {/* Top Header Strip: Phase Badge, PAUSED/RUNNING Badge, Expand Button */}
        <div className="flex items-center justify-between w-full mb-3 z-10 relative">
          {/* Phase Badge (dynamic per cycle/phase) */}
          <div className="badge-accent bg-accent-muted text-accent border border-accent/40 shadow-xs">
            {phase === 'FOCUS' ? (
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-accent animate-bounce" />
            )}
            <span>{phaseLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* PAUSED / RUNNING Status Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border shadow-xs transition-colors',
                isRunning
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                  : isPaused
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                  : 'bg-surface-elevated text-foreground-muted border-border'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isRunning
                    ? 'bg-emerald-400 animate-ping'
                    : isPaused
                    ? 'bg-amber-400'
                    : 'bg-foreground-muted'
                )}
              />
              {isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'READY'}
            </span>

            {/* Expand / Zen Mode Button */}
            <button
              onClick={() => setIsZenMode(true)}
              className="p-1.5 rounded-xl bg-surface-elevated hover:bg-surface-subtle text-foreground-secondary hover:text-foreground border border-border transition-all cursor-pointer shadow-xs active:scale-95"
              title="Fullscreen Zen Mode (Z)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pointer-Driven 3D Spatial Gyroscopic Timer Circle Stage */}
        <div
          ref={circleStageRef}
          onMouseMove={handleCircleMouseMove}
          onMouseLeave={handleCircleMouseLeave}
          className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 mx-auto my-2 select-none cursor-pointer rounded-full"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* SVG Progress Ring Stage */}
          <svg
            ref={ringRef}
            className="w-full h-full -rotate-90 transform drop-shadow-xl pointer-events-none transition-all duration-75"
            viewBox="0 0 300 300"
            style={{
              transform: `translateZ(45px)`,
              filter: `drop-shadow(${-mousePos.x * 10}px ${-mousePos.y * 10}px 14px rgba(63, 114, 175, 0.4))`,
            }}
          >
            {/* Background Track Circle */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              className="text-border-subtle opacity-40 dark:opacity-20"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="url(#timerThemeAccentGrad)"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-linear"
            />
            <defs>
              <linearGradient id="timerThemeAccentGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-accent-hover)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Readout & Step Dots with Elevated 3D Parallax */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate3d(${mousePos.x * 6}px, ${mousePos.y * 6}px, 65px)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Countdown Clock (dynamically shows accurate time for the current cycle) */}
            <div className="text-6xl sm:text-7xl font-bold font-mono tracking-tighter text-foreground drop-shadow-md">
              {formatTime(secondsRemaining)}
            </div>

            {/* CYCLE Step Dots (dynamic per room settings) */}
            <div className="flex items-center gap-2.5 mt-3">
              {Array.from({ length: cyclesTotal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all duration-300',
                    i + 1 === currentCycle
                      ? 'bg-accent scale-125 shadow-md shadow-accent/50'
                      : i + 1 < currentCycle
                      ? 'bg-accent/75'
                      : 'bg-surface-elevated border border-border'
                  )}
                  title={`Cycle ${i + 1} of ${cyclesTotal}`}
                />
              ))}
            </div>

            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-foreground-muted mt-2">
              {phase === 'SHORT_BREAK'
                ? 'SHORT BREAK • RECHARGE'
                : phase === 'LONG_BREAK'
                ? 'LONG BREAK • EXTENDED REST'
                : `CYCLE ${currentCycle} OF ${cyclesTotal}`}
            </span>
          </div>
        </div>

        {/* Controls: Resume / Pause CTA Button + Skip / Next Button */}
        <div className="mt-3 flex flex-col items-center gap-3 z-10 relative w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-3 w-full">
            {/* Resume / Pause / Start CTA */}
            <button
              onClick={handleToggleTimer}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm select-none transition-all duration-200 cursor-pointer shadow-md active:scale-95',
                isRunning
                  ? 'btn-secondary bg-surface-elevated hover:bg-surface-subtle text-amber-400 border border-amber-500/30'
                  : 'btn-primary bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/25'
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
                  <span>{isPaused ? 'Resume' : 'Start'}</span>
                </>
              )}
            </button>

            {/* Skip / Next Step Button */}
            <button
              onClick={handleSkip}
              className="p-3 rounded-2xl btn-secondary bg-surface-elevated hover:bg-surface-subtle text-foreground-secondary hover:text-foreground border border-border transition-all cursor-pointer shadow-xs active:scale-95"
              title="Skip to next interval (S)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Caption */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-foreground-muted uppercase tracking-wider">
            <span>Authoritative Engine</span>
            <span>•</span>
            <span>Zero Clock Drift</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Zen Mode Portal */}
      {isZenMode &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-canvas text-foreground flex flex-col items-center justify-between p-8 sm:p-12 animate-in fade-in duration-150 transform-gpu">
            <div className="flex items-center justify-between w-full max-w-4xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-sky-400 text-white flex items-center justify-center font-bold text-sm">
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
              <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full badge-accent bg-accent-muted text-accent border border-accent/40 mb-4 inline-block">
                {phaseLabel}
              </span>
              <div className="text-8xl sm:text-9xl font-mono font-bold tracking-tighter text-foreground drop-shadow-2xl my-3">
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
                  className="px-8 py-3.5 rounded-2xl btn-primary bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  {isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
                </button>
                <button
                  onClick={handleSkip}
                  className="p-3.5 rounded-2xl btn-secondary bg-surface-elevated hover:bg-surface-subtle text-foreground border border-border transition-all cursor-pointer"
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
