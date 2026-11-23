'use client';

import React from 'react';
import { Timer, LayoutGrid, Users2, LineChart, ShieldCheck, Zap, Headphones, Command, Sparkles } from 'lucide-react';

export const LandingFeatures: React.FC = () => {
  const features = [
    {
      icon: Timer,
      title: 'Authoritative Group Pomodoro',
      badge: 'Zero Drift',
      description:
        'The backend server acts as the single source of truth for timer states. Survives browser reloads, disconnections, and process restarts without clock drift.',
    },
    {
      icon: LayoutGrid,
      title: 'Collaborative Task Board',
      badge: 'Real-Time Kanban',
      description:
        'Backlog, To Do, In Progress, and Completed columns. Instant real-time updates across all connected participants powered by WebSocket events.',
    },
    {
      icon: ShieldCheck,
      title: 'Robust Security & Permissions',
      badge: 'JWT & Cookies',
      description:
        'HTTP-only secure JWT cookies, bcrypt password hashing, and strict backend permission verification on every timer action and task modification.',
    },
    {
      icon: Users2,
      title: 'Multi-User Concurrency & Presence',
      badge: 'Live Heartbeat',
      description:
        'Role-based permissions (Owner, Moderator, Member), heartbeat-driven online presence tracking, and synchronized room activity logging.',
    },
    {
      icon: LineChart,
      title: 'Data-Driven Productivity Analytics',
      badge: 'Habit Metrics',
      description:
        'Real study streak calculations, daily and weekly focus trends, and task completion metrics derived from actual completed database records.',
    },
    {
      icon: Command,
      title: 'Speed-of-Thought Quick Command Palette',
      badge: 'Cmd + K',
      description:
        'Navigate across rooms, tasks, analytics, settings, and trigger actions with keyboard-first speed designed for power users.',
    },
  ];

  return (
    <section id="features" className="py-24 border-t border-border-subtle bg-canvas transition-colors duration-200 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="badge-base bg-surface-elevated border border-border px-3.5 py-1 mb-3 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
              Engineered for High-Performance Focus
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mt-3">
            Not just another timer. A shared digital workspace.
          </h2>
          <p className="text-sm sm:text-base text-foreground-secondary mt-4 leading-relaxed">
            Built with resilient full-stack architecture, distributed state management,
            and authoritative real-time WebSocket communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="card-interactive p-7 flex flex-col justify-between group hover:border-accent/60"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-accent group-hover:scale-110 group-hover:bg-accent/15 group-hover:border-accent/40 transition-all shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-foreground-muted">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-3 leading-relaxed">
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
