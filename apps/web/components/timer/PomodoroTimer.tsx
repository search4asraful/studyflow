'use client';

import React from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { useRoomStore } from '../../stores/roomStore';
import { formatTimeRemaining } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Play, Pause, SkipForward, Sparkles, Coffee, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const canControl = role === 'OWNER' || role === 'MODERATOR';
  const cyclesTotal = room?.cyclesBeforeLongBreak || 4;

  // Circular progress calculations (Radius = 135)
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentRemaining / 100) * circumference;

  const phaseConfig = {
    FOCUS: {
      label: 'Focus Session',
      accentColor: 'var(--accent)',
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      badgeVariant: 'accent' as const,
    },
    SHORT_BREAK: {
      label: 'Short Break',
      accentColor: '#0ea5e9',
      icon: <Coffee className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      badgeVariant: 'info' as const,
    },
    LONG_BREAK: {
      label: 'Long Rest',
      accentColor: '#8b5cf6',
      icon: <Coffee className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      badgeVariant: 'warning' as const,
    },
  };

  const currentPhaseConfig = phaseConfig[phase] || phaseConfig.FOCUS;

  return (
    <div className="card-elevated flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-xl">
      {/* Subtle background glow */}
      <div
        className="absolute w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-10 transition-colors duration-700"
        style={{ backgroundColor: currentPhaseConfig.accentColor }}
      />

      {/* Phase and Status Header */}
      <div className="flex items-center gap-3 mb-6 z-10">
        <Badge variant={currentPhaseConfig.badgeVariant} size="md" className="flex items-center gap-1.5 px-3 py-1">
          {currentPhaseConfig.icon}
          <span>{currentPhaseConfig.label}</span>
        </Badge>

        <span className="text-xs uppercase tracking-widest text-foreground-muted flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'RUNNING'
                ? 'bg-accent animate-ping'
                : status === 'PAUSED'
                ? 'bg-amber-500 dark:bg-amber-400'
                : 'bg-foreground-muted'
            }`}
          />
          {status}
        </span>
      </div>

      {/* Authoritative Circular Progress Timer */}
      <div className="relative flex items-center justify-center w-72 h-72 my-2 select-none z-10">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
          {/* Background track circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke="var(--border-subtle)"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Animated remaining progress stroke */}
          <motion.circle
            cx="160"
            cy="160"
            r={radius}
            stroke={currentPhaseConfig.accentColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'linear' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Central Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            key={displaySeconds}
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 1 }}
            className="text-6xl font-bold font-mono tracking-tighter text-foreground"
          >
            {formatTimeRemaining(displaySeconds)}
          </motion.div>

          {/* Cycle dots */}
          <div className="flex items-center gap-2 mt-4">
            {Array.from({ length: cyclesTotal }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < currentCycle
                    ? 'bg-accent scale-110 shadow-sm'
                    : 'bg-surface-subtle border border-border'
                }`}
                title={`Cycle ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-secondary mt-2">
            Cycle {currentCycle} of {cyclesTotal}
          </span>
        </div>
      </div>

      {/* Authoritative Controls */}
      <div className="mt-6 flex flex-col items-center gap-4 z-10 w-full max-w-xs">
        {canControl ? (
          <div className="flex items-center justify-center gap-3 w-full">
            {status === 'RUNNING' ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={onPause}
                className="flex-1 font-semibold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              >
                <Pause className="w-5 h-5 fill-current" />
                Pause
              </Button>
            ) : status === 'PAUSED' ? (
              <Button
                variant="primary"
                size="lg"
                onClick={onResume}
                className="flex-1 font-semibold"
              >
                <Play className="w-5 h-5 fill-current" />
                Resume
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={onStart}
                className="flex-1 font-semibold"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Focus
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => onSkip()}
              title="Skip to next phase"
              className="text-foreground-secondary hover:text-foreground px-3.5"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-foreground-secondary card-subtle px-4 py-2.5 text-center">
            <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
            <span>Synchronized to Room Host</span>
          </div>
        )}

        <div className="flex items-center justify-between w-full text-[11px] text-foreground-muted px-2">
          <span>Authoritative Timer</span>
          <span>•</span>
          <span>Zero Clock Drift</span>
        </div>
      </div>
    </div>
  );
};
