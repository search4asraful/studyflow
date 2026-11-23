'use client';

import React from 'react';
import { PlusCircle, PlayCircle, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Create or Join a Study Room',
      description:
        'Set up a public or private study room with customized Pomodoro durations (Focus, Short Break, Long Break) or join teammates with a unique 8-character invite code.',
      icon: PlusCircle,
      detail: 'Instant invite link generation with zero login friction.',
    },
    {
      step: '02',
      title: 'Focus Together with Synchronized Timer',
      description:
        'The room host initiates the Pomodoro countdown. Every connected participant sees the exact same time remaining, phase transitions, and cycle progression in real time.',
      icon: PlayCircle,
      detail: 'Survives network drops & reloads with authoritative backend state.',
    },
    {
      step: '03',
      title: 'Collaborate on Tasks & Track Progress',
      description:
        'Create and update shared room tasks on the collaborative board. As sessions complete, the backend records your focused minutes and builds comprehensive productivity analytics.',
      icon: BarChart3,
      detail: 'Automatic study streak calculations & weekly focus breakdown.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 border-t border-border-subtle bg-canvas transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
            Simple &amp; Disciplined Workflow
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mt-3">
            How StudyFlow Works
          </h2>
          <p className="text-sm sm:text-base text-foreground-secondary mt-4 leading-relaxed">
            Synchronized focus. Collaborative tasks. Uninterrupted progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="card-base p-8 relative overflow-hidden flex flex-col justify-between group hover:border-accent/50 hover:shadow-xl transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-4xl font-mono font-bold text-accent/80 group-hover:text-accent transition-colors">
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-foreground group-hover:scale-105 group-hover:border-accent/40 group-hover:text-accent transition-all shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 text-[11px] text-accent font-mono">
                  {item.detail}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 card-elevated p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6 border-accent/30">
          <div className="text-left">
            <h3 className="text-xl font-bold text-foreground">Ready to elevate your focus routine?</h3>
            <p className="text-xs text-foreground-secondary mt-1">
              Join thousands of students and engineers staying disciplined with StudyFlow.
            </p>
          </div>
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 px-6">
              Create Your Free Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
