'use client';

import React from 'react';
import { Timer, LayoutGrid, Users2, LineChart, ShieldCheck, Zap } from 'lucide-react';

export const LandingFeatures: React.FC = () => {
  const features = [
    {
      icon: Timer,
      title: 'Authoritative Group Pomodoro',
      description:
        'The backend server acts as the single source of truth for timer states. Survives browser reloads, disconnections, and process restarts without clock drift.',
    },
    {
      icon: LayoutGrid,
      title: 'Collaborative Task Board',
      description:
        'Backlog, To Do, In Progress, and Completed columns. Instant real-time updates across all connected participants powered by WebSocket events.',
    },
    {
      icon: Users2,
      title: 'Multi-User Concurrency & Presence',
      description:
        'Role-based permissions (Owner, Moderator, Member), heartbeat-driven online presence tracking, and synchronized room activity logging.',
    },
    {
      icon: LineChart,
      title: 'Data-Driven Productivity Analytics',
      description:
        'Real study streak calculations, daily and weekly focus trends, and task completion metrics derived from actual completed database records.',
    },
    {
      icon: ShieldCheck,
      title: 'Robust Security & Authorization',
      description:
        'HTTP-only secure JWT cookies, bcrypt password hashing, and strict backend permission verification on every timer action and task modification.',
    },
    {
      icon: Zap,
      title: 'Low-Latency Socket Synchronization',
      description:
        'Optimistic frontend updates with automated server reconciliation to ensure sub-50ms latency across multiple concurrent browser windows.',
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-border-subtle bg-canvas transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-accent">
            Engineered for High-Performance Focus
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-3">
            Not just another timer. A shared digital workspace.
          </h2>
          <p className="text-sm text-foreground-secondary mt-4 leading-relaxed">
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
                className="card-interactive flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-accent mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-xs text-foreground-secondary mt-2.5 leading-relaxed">
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
