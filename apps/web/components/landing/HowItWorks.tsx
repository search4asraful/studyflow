'use client';

import React from 'react';
import { PlusCircle, PlayCircle, BarChart3 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Create or Join a Study Room',
      description:
        'Set up a public or private study room with customized Pomodoro durations (Focus, Short Break, Long Break) or join teammates with a unique 8-character invite code.',
      icon: PlusCircle,
    },
    {
      step: '02',
      title: 'Focus Together with Synchronized Timer',
      description:
        'The room host initiates the Pomodoro countdown. Every connected participant sees the exact same time remaining, phase transitions, and cycle progression in real time.',
      icon: PlayCircle,
    },
    {
      step: '03',
      title: 'Collaborate on Tasks & Track Progress',
      description:
        'Create and update shared room tasks on the collaborative board. As sessions complete, the backend records your focused minutes and builds comprehensive productivity analytics.',
      icon: BarChart3,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t border-border-subtle bg-surface-subtle transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-accent">
            Simple &amp; Disciplined Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-3">
            How StudyFlow Works
          </h2>
          <p className="text-sm text-foreground-secondary mt-4 leading-relaxed">
            Study together. Stay focused. Make progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="card-base p-7 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-mono font-bold text-accent opacity-90">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-foreground">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
