'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Clock,
    Layers,
    Pause,
    Play,
    Radio,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Volume2,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { playTaskCompletionSound } from '../../lib/audio';
import { triggerConfetti } from '../../lib/confetti';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';

export const LandingHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isUserLoggedIn = Boolean(user) || isAuthenticated;

  // Interactive Live Pomodoro Simulator
  const [simSeconds, setSimSeconds] = useState(1500); // 25:00
  const [simRunning, setSimRunning] = useState(false);
  const [simPhase, setSimPhase] = useState<'FOCUS' | 'SHORT_BREAK'>('FOCUS');
  const [simTasks, setSimTasks] = useState([
    { id: 1, text: 'Authoritative WebSocket Pomodoro synchronization', completed: true },
    { id: 2, text: 'Ephemeral socket-only live chat & room activity', completed: true },
    { id: 3, text: 'Distributed concurrency & presence heartbeat', completed: false },
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
            triggerConfetti({ particleCount: 35 });
            playTaskCompletionSound();
          }
          return { ...t, completed: next };
        }
        return t;
      })
    );
  };

  const handleSimPhaseChange = (phase: 'FOCUS' | 'SHORT_BREAK') => {
    setSimPhase(phase);
    setSimRunning(false);
    setSimSeconds(phase === 'FOCUS' ? 1500 : 300);
  };

  const formatSimTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // GSAP Choreographed Master Entrance Animation
  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const el = containerRef.current;
      const badge = el.querySelector('.hero-badge');
      const titleLines = el.querySelectorAll('.hero-title-line');
      const subtext = el.querySelector('.hero-subtext');
      const ctas = el.querySelector('.hero-cta');
      const featurePills = el.querySelector('.hero-feature-pills');
      const previewCard = el.querySelector('.hero-preview-card');

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        badge,
        { y: -24, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 }
      )
        .fromTo(
          titleLines,
          { y: 45, opacity: 0, rotateX: 12 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.12 },
          '-=0.3'
        )
        .fromTo(
          subtext,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          ctas,
          { y: 15, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5 },
          '-=0.3'
        )
        .fromTo(
          featurePills,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.2'
        )
        .fromTo(
          previewCard,
          { y: 60, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' },
          '-=0.3'
        );
    },
    { dependencies: [] }
  );

  return (
    <section
      ref={containerRef}
      className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden selection:bg-accent selection:text-white"
    >
      {/* Dynamic Ambient Background Glow Mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[500px] bg-linear-to-tr from-accent/20 via-blue-500/10 to-sky-400/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Product Status Pill */}
        <div className="hero-badge badge-base bg-surface-elevated/90 border border-border/80 px-3.5 py-1.5 mb-6 shadow-sm inline-flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-secondary font-medium">
            Next-Gen Synchronized Digital Study Environment
          </span>
          <span className="hidden sm:inline-block text-border">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-accent">
            <Radio className="w-3 h-3" /> Zero Clock Drift
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
          <span className="hero-title-line block">Make every study</span>
          <span className="hero-title-line block bg-clip-text text-transparent bg-linear-to-r from-accent via-blue-500 to-sky-400">
            session count.
          </span>
        </h1>

        {/* Hero Subtext */}
        <p className="hero-subtext text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
          Focus together with zero clock drift. Experience authoritative synchronized Pomodoro timers,
          real-time collaborative Kanban boards, and ephemeral live meeting activity without database clutter.
        </p>

        {/* CTAs */}
        <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-9">
          <Link href={isUserLoggedIn ? '/dashboard' : '/register'}>
            <Button
              size="lg"
              className="gap-2 px-8 py-3.5 text-sm sm:text-base font-semibold shadow-xl shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isUserLoggedIn ? 'Enter Dashboard Workspace' : 'Start Studying Free'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button
              variant="outline"
              size="lg"
              className="px-6 py-3.5 text-sm sm:text-base text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition-all"
            >
              Explore Architecture &amp; Features
            </Button>
          </a>
        </div>

        {/* Feature Micro-Badges */}
        <div className="hero-feature-pills flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-7 text-xs text-foreground-muted font-mono">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            Authoritative Server Ticker
          </span>
          <span className="hidden sm:inline-block text-border">•</span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Ephemeral Socket Stream
          </span>
          <span className="hidden sm:inline-block text-border">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Zero DB Activity Storage
          </span>
        </div>

        {/* Interactive Product Showcase Card (Live Simulator) */}
        <div className="hero-preview-card mt-12 max-w-4xl mx-auto card-glass p-5 sm:p-7 shadow-2xl relative border-accent/25 overflow-hidden rounded-3xl bg-surface/90 backdrop-blur-2xl">
          {/* Top Bar of the Mock Study Room */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/70 mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-foreground-muted flex items-center gap-2">
                studyflow.app / room / <span className="text-accent font-semibold">SD3ASTRO</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-accent bg-accent/15 border border-accent/30 px-2.5 py-1 rounded-full font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>3 Peers Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center text-left">
            {/* Interactive Pomodoro Mini Display */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 card-subtle rounded-2xl relative overflow-hidden border-border/80 bg-surface-subtle/60">
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={() => handleSimPhaseChange('FOCUS')}
                  className={cn(
                    'text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer',
                    simPhase === 'FOCUS'
                      ? 'bg-accent text-white border-accent shadow-xs font-bold'
                      : 'text-foreground-muted border-border hover:text-foreground'
                  )}
                >
                  Focus (25m)
                </button>
                <button
                  onClick={() => handleSimPhaseChange('SHORT_BREAK')}
                  className={cn(
                    'text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer',
                    simPhase === 'SHORT_BREAK'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs font-bold'
                      : 'text-foreground-muted border-border hover:text-foreground'
                  )}
                >
                  Break (5m)
                </button>
              </div>

              {/* Digital Timer Face */}
              <div className="text-5xl font-mono font-extrabold text-foreground my-2 tracking-tighter tabular-nums">
                {formatSimTime(simSeconds)}
              </div>

              {/* Interactive Controls */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant={simRunning ? 'secondary' : 'primary'}
                  onClick={() => setSimRunning(!simRunning)}
                  className="gap-1.5 text-xs px-4 rounded-xl shadow-xs cursor-pointer font-semibold"
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
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    playTaskCompletionSound();
                    triggerConfetti({ particleCount: 30 });
                  }}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-accent hover:bg-surface-elevated transition-colors cursor-pointer"
                  title="Test notification chime"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted mt-3">
                <Clock className="w-3 h-3 text-accent" />
                <span>Cycle 1 of 4</span>
                <span>•</span>
                <span className="text-foreground-secondary">1000ms Server Heartbeat</span>
              </div>
            </div>

            {/* Collaborative Tasks Interactive Demo */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent" /> Live Task Board
                </span>
                <span className="text-[10px] font-mono text-accent font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                  {simTasks.filter((t) => t.completed).length}/{simTasks.length} Completed
                </span>
              </div>

              <div className="space-y-1.5">
                {simTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={cn(
                      'p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all duration-150',
                      t.completed
                        ? 'opacity-65 bg-surface-subtle/40 border-border-subtle'
                        : 'bg-surface-subtle/90 border-border hover:border-accent/40 shadow-2xs'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <CheckCircle2
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          t.completed ? 'text-accent' : 'text-foreground-muted'
                        )}
                      />
                      <span
                        className={cn(
                          'truncate text-xs',
                          t.completed
                            ? 'line-through text-foreground-muted'
                            : 'text-foreground font-medium'
                        )}
                      >
                        {t.text}
                      </span>
                    </div>

                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-md font-mono shrink-0 font-semibold',
                        t.completed
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-accent/15 text-accent border border-accent/30'
                      )}
                    >
                      {t.completed ? 'Done' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-foreground-muted font-mono pt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent shrink-0" />
                <span>Interactive live preview: click any task to trigger sound &amp; real-time completion state!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
