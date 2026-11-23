'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from '../ui/Button';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Headphones,
  Command,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { playTaskCompletionSound } from '../../lib/audio';
import { triggerConfetti } from '../../lib/confetti';
import { cn } from '../../lib/utils';

export const LandingHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  // Interactive Live Pomodoro Simulator state
  const [simSeconds, setSimSeconds] = useState(1500); // 25:00
  const [simRunning, setSimRunning] = useState(false);
  const [simPhase, setSimPhase] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [simTasks, setSimTasks] = useState([
    { id: 1, text: 'Design PostgreSQL schema & relation indexes', completed: true },
    { id: 2, text: 'Authoritative WebSocket Pomodoro synchronization', completed: false },
    { id: 3, text: 'Review distributed concurrency & presence heartbeat', completed: false },
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simRunning && simSeconds > 0) {
      interval = setInterval(() => {
        setSimSeconds((s) => s - 1);
      }, 1000);
    } else if (simRunning && simSeconds === 0) {
      setSimRunning(false);
      triggerConfetti();
    }
    return () => clearInterval(interval);
  }, [simRunning, simSeconds]);

  const toggleTask = (id: number) => {
    setSimTasks((tasks) =>
      tasks.map((t) => {
        if (t.id === id) {
          const next = !t.completed;
          if (next) {
            triggerConfetti({ particleCount: 40 });
            playTaskCompletionSound();
          }
          return { ...t, completed: next };
        }
        return t;
      })
    );
  };

  const handleSimPhaseChange = (phase: 'FOCUS' | 'BREAK') => {
    setSimPhase(phase);
    setSimRunning(false);
    setSimSeconds(phase === 'FOCUS' ? 1500 : 300);
  };

  const formatSimTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const el = containerRef.current;
      const badge = el.querySelector('.hero-badge');
      const lines = el.querySelectorAll('.hero-title-line');
      const subtext = el.querySelector('.hero-subtext');
      const cta = el.querySelector('.hero-cta');
      const preview = el.querySelector('.hero-preview-card');

      if (!badge || lines.length === 0 || !subtext || !cta || !preview) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(badge, {
        y: -20,
        opacity: 0,
        duration: 0.6,
      })
        .from(
          lines,
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
          },
          '-=0.3'
        )
        .from(
          subtext,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
          },
          '-=0.4'
        )
        .from(
          cta,
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
          },
          '-=0.3'
        )
        .from(
          preview,
          {
            y: 50,
            opacity: 0,
            duration: 1,
            scale: 0.98,
          },
          '-=0.3'
        );
    },
    { dependencies: [] }
  );

  return (
    <section ref={containerRef} className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background ambient radial glow mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-accent/20 via-sky-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Product Status Pill */}
        <div className="hero-badge badge-base bg-surface-elevated/90 border border-border px-4 py-1.5 mb-8 shadow-xs inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-xs font-mono uppercase tracking-wider text-foreground-secondary">
            Authoritative Synchronized Digital Study Environment
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
          <span className="hero-title-line block">Make every study</span>
          <span className="hero-title-line block text-gradient-accent">session count.</span>
        </h1>

        {/* Hero Subtext */}
        <p className="hero-subtext text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto mt-6 leading-relaxed">
          Focus together, eliminate clock drift, and turn your academic milestones into measurable progress.
          Authoritative real-time synchronized Pomodoro sessions, interactive task boards, and built-in focus soundscapes.
        </p>

        {/* CTAs */}
        <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href={user ? '/dashboard' : '/register'}>
            <Button size="lg" className="gap-2 px-8 py-3.5 text-base font-semibold shadow-xl shadow-accent/25">
              {user ? 'Enter Dashboard' : 'Start Studying Free'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="px-7 py-3.5 text-base text-foreground-secondary hover:text-foreground">
              Explore Architecture &amp; Workflow
            </Button>
          </a>
        </div>

        {/* Quick Pro-Tips Bar */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            Zero Clock Drift
          </span>
          <span className="hidden sm:inline-block">•</span>
          <span className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-accent" />
            Press ⌘K for Command Palette
          </span>
        </div>

        {/* Interactive Product Preview Card (Live Simulator) */}
        <div className="hero-preview-card mt-14 max-w-4xl mx-auto card-elevated p-6 sm:p-8 shadow-2xl relative border-accent/30 overflow-hidden">
          {/* Top Bar of the Mock Study Room */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-border-subtle mb-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 text-xs font-mono text-foreground-muted flex items-center gap-2">
                studyflow.app / room / <span className="text-accent font-semibold">FOCUS2026</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-accent bg-accent/15 border border-accent/30 px-3 py-1 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                3 Students Active
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left">
            {/* Interactive Pomodoro Mini Display */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 card-subtle rounded-2xl relative overflow-hidden border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleSimPhaseChange('FOCUS')}
                  className={cn(
                    'text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border transition-all',
                    simPhase === 'FOCUS'
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'text-foreground-muted border-border hover:text-foreground'
                  )}
                >
                  Focus (25m)
                </button>
                <button
                  onClick={() => handleSimPhaseChange('BREAK')}
                  className={cn(
                    'text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border transition-all',
                    simPhase === 'BREAK'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : 'text-foreground-muted border-border hover:text-foreground'
                  )}
                >
                  Break (5m)
                </button>
              </div>

              <div className="text-5xl font-mono font-bold text-foreground my-3 tracking-tighter">
                {formatSimTime(simSeconds)}
              </div>

              {/* Interactive Controls */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant={simRunning ? 'secondary' : 'primary'}
                  onClick={() => setSimRunning(!simRunning)}
                  className="gap-1.5 text-xs px-4"
                >
                  {simRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Focus
                    </>
                  )}
                </Button>
                <button
                  onClick={() => {
                    setSimRunning(false);
                    setSimSeconds(simPhase === 'FOCUS' ? 1500 : 300);
                  }}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    playTaskCompletionSound();
                    triggerConfetti();
                  }}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-accent hover:bg-surface-elevated transition-colors"
                  title="Test task celebration sound"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted mt-4">
                <span>Cycle 1 of 4</span>
                <span>•</span>
                <span className="text-foreground-secondary">Authoritative Engine</span>
              </div>
            </div>

            {/* Collaborative Tasks & Activity Stream Mini Preview */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Interactive Room Tasks (Click to Complete)
                </span>
                <span className="text-[10px] font-mono text-accent">
                  {simTasks.filter((t) => t.completed).length}/{simTasks.length} Done
                </span>
              </div>

              <div className="space-y-2">
                {simTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={cn(
                      'p-3 card-subtle flex items-center justify-between text-xs cursor-pointer transition-all hover:border-accent/50',
                      t.completed ? 'opacity-70 bg-surface-subtle/50' : 'bg-surface-subtle'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <CheckCircle2
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          t.completed ? 'text-accent' : 'text-foreground-muted'
                        )}
                      />
                      <span
                        className={cn(
                          'truncate',
                          t.completed ? 'line-through text-foreground-muted' : 'text-foreground font-medium'
                        )}
                      >
                        {t.text}
                      </span>
                    </div>

                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-sm font-mono shrink-0',
                        t.completed
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-accent/15 text-accent border border-accent/30'
                      )}
                    >
                      {t.completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-foreground-muted pt-1">
                ⚡ Try clicking the tasks above or testing the timer. All state is designed for instantaneous multi-client reconciliation!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
