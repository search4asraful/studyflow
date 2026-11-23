'use client';

import React, { useRef } from 'react';
import { PlusCircle, PlayCircle, BarChart3, ArrowRight, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export const HowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isUserLoggedIn = Boolean(user) || isAuthenticated;

  const steps = [
    {
      step: '01',
      title: 'Create or Join a Study Room',
      description:
        'Set up a public or private study room with customized Pomodoro durations (Focus, Short Break, Long Break) or join teammates with an 8-character invite code.',
      icon: PlusCircle,
      detail: 'Instant room generation with zero login friction',
    },
    {
      step: '02',
      title: 'Focus with Authoritative Timers',
      description:
        'The host starts the countdown. Every connected participant sees the exact same remaining time, phase changes, and cycles without clock drift.',
      icon: PlayCircle,
      detail: 'Survives network drops & reloads with authoritative backend state',
    },
    {
      step: '03',
      title: 'Collaborate & Track Progress',
      description:
        'Organize shared tasks on the collaborative board and chat live. As sessions complete, StudyFlow records your focused minutes and builds analytics.',
      icon: BarChart3,
      detail: 'Automatic study streak calculations & weekly focus breakdown',
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const stepCards = containerRef.current.querySelectorAll('.step-card');
      gsap.fromTo(
        stepCards,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
        }
      );
    },
    { dependencies: [] }
  );

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="py-24 border-t border-border-subtle bg-canvas transition-colors duration-200 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="badge-base bg-surface-elevated border border-border px-3.5 py-1 mb-3.5 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
              Disciplined &amp; Simple Workflow
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mt-2">
            How StudyFlow Works
          </h2>
          <p className="text-sm sm:text-base text-foreground-secondary mt-4 leading-relaxed font-normal">
            Synchronized focus. Collaborative tasks. Zero distraction.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="step-card card-interactive p-7 relative overflow-hidden flex flex-col justify-between group rounded-2xl bg-surface/85 backdrop-blur-md border border-border hover:border-accent/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-mono font-black text-accent/80 group-hover:text-accent transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-foreground group-hover:scale-105 group-hover:border-accent/40 group-hover:text-accent transition-all shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-2.5 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border-subtle flex items-center gap-1.5 text-[11px] text-accent font-mono">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Call to Action Card */}
        <div className="mt-14 card-glass p-8 sm:p-10 rounded-3xl text-center flex flex-col sm:flex-row items-center justify-between gap-6 border-accent/25 bg-surface/90 shadow-xl">
          <div className="text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Ready to elevate your study routine?
            </h3>
            <p className="text-xs sm:text-sm text-foreground-secondary mt-1 max-w-lg">
              Join students and engineering teams staying focused and accountable with StudyFlow.
            </p>
          </div>
          <Link href={isUserLoggedIn ? '/dashboard' : '/register'} className="w-full sm:w-auto shrink-0">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 px-7 py-3 text-sm font-semibold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>{isUserLoggedIn ? 'Enter Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
