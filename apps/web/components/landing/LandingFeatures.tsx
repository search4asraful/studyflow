'use client';

import React, { useRef } from 'react';
import {
  Timer,
  LayoutGrid,
  Users2,
  LineChart,
  Command,
  Sparkles,
  Zap,
  Radio,
  Lock,
  Flame,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export const LandingFeatures: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: Timer,
      title: 'Authoritative Synchronized Pomodoro',
      badge: 'Zero Clock Drift',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
      description:
        'The backend server acts as the single authoritative source of truth. Survives client reloads, disconnections, and process interruptions without losing a single second.',
    },
    {
      icon: Radio,
      title: 'Ephemeral Socket-Only Live Chat',
      badge: 'Google Meet Style',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      description:
        'Real-time meeting chat and live room activities are broadcast instantly over WebSockets. Clean in-memory session management with zero persistent database clutter.',
    },
    {
      icon: LayoutGrid,
      title: 'Collaborative Kanban Task Workspace',
      badge: 'Real-Time Sync',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
      description:
        'Backlog, To Do, In Progress, and Completed columns. Tasks update across all connected teammates simultaneously with instant drag-and-drop feedback.',
    },
    {
      icon: Users2,
      title: 'Live Concurrency & Heartbeat Presence',
      badge: 'Active Roster',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
      description:
        'Role-based permissions (Owner, Moderator, Member), heartbeat-driven active participant tracking, and synchronized room entrance and exit notices.',
    },
    {
      icon: LineChart,
      title: 'Productivity Analytics & Habit Streaks',
      badge: 'True Metrics',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
      description:
        'True daily study streaks, focus duration distributions, and weekly trend graphs computed directly from completed focus sessions.',
    },
    {
      icon: Command,
      title: 'Spotlight Quick Command Palette',
      badge: '⌘K Hotkey',
      badgeColor: 'text-accent bg-accent/10 border-accent/25',
      description:
        'Search study rooms, trigger timer controls, jump to tasks, and toggle themes in milliseconds with full keyboard accessibility.',
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const cards = containerRef.current.querySelectorAll('.feature-card');

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.fromTo(
                cards,
                { y: 35, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.6,
                  stagger: 0.08,
                  ease: 'power2.out',
                }
              );
              observer.disconnect();
            }
          });
        },
        { threshold: 0.15 }
      );

      observer.observe(containerRef.current);

      return () => observer.disconnect();
    },
    { dependencies: [] }
  );

  return (
    <section
      id="features"
      ref={containerRef}
      className="py-24 border-t border-border-subtle bg-canvas transition-colors duration-200 relative overflow-hidden"
    >
      {/* Background ambient decorative mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="badge-base bg-surface-elevated border border-border px-3.5 py-1 mb-3.5 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
              Engineered for High-Performance Focus
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mt-2">
            Not just another timer. A shared digital workspace.
          </h2>
          <p className="text-sm sm:text-base text-foreground-secondary mt-4 leading-relaxed font-normal">
            Built with resilient distributed state management, authoritative WebSockets,
            and privacy-first ephemeral meeting communication.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="feature-card card-interactive p-6 flex flex-col justify-between group hover:border-accent/50 rounded-2xl bg-surface/85 backdrop-blur-md relative overflow-hidden"
              >
                {/* Subtle top card glow effect on hover */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-accent group-hover:scale-105 group-hover:bg-accent/15 group-hover:border-accent/40 transition-all shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${feature.badgeColor}`}
                    >
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
