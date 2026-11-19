'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from '../ui/Button';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const LandingHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  useGSAP(
    () => {
      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-badge', {
        y: -20,
        opacity: 0,
        duration: 0.6,
      })
        .from(
          '.hero-title-line',
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
          },
          '-=0.3'
        )
        .from(
          '.hero-subtext',
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
          },
          '-=0.4'
        )
        .from(
          '.hero-cta',
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
          },
          '-=0.3'
        )
        .from(
          '.hero-preview-card',
          {
            y: 50,
            opacity: 0,
            duration: 1,
            scale: 0.98,
          },
          '-=0.3'
        );
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Product Status Badge */}
        <div className="hero-badge badge-base bg-surface border border-border px-4 py-1.5 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-foreground-secondary">
            Authoritative Real-Time Collaborative Study Platform
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
          <span className="hero-title-line block">Make every study</span>
          <span className="hero-title-line block text-accent">session count.</span>
        </h1>

        {/* Hero Subtext */}
        <p className="hero-subtext text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto mt-6 leading-relaxed">
          Focus together, stay accountable, and turn your study goals into measurable progress.
          Authoritative real-time synchronized Pomodoro sessions and collaborative task boards.
        </p>

        {/* CTAs */}
        <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href={user ? '/dashboard' : '/register'}>
            <Button size="lg" className="gap-2 px-8 py-3.5 text-base font-semibold">
              {user ? 'Enter Dashboard' : 'Start studying'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="px-7 py-3.5 text-base text-foreground-secondary hover:text-foreground">
              Explore how it works
            </Button>
          </a>
        </div>

        {/* Product Preview Card */}
        <div className="hero-preview-card mt-16 max-w-4xl mx-auto card-elevated p-6 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between pb-5 border-b border-border-subtle mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-foreground-muted">
                studyflow.app / room / FOCUS2026
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-accent bg-accent-muted border border-accent/25 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              3 Students Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center text-left">
            {/* Interactive Pomodoro Mini Display */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 card-subtle">
              <span className="text-xs uppercase tracking-widest text-accent font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Focus Session
              </span>
              <div className="text-5xl font-mono font-bold text-foreground my-3">
                24:45
              </div>
              <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span>Cycle 1 of 4</span>
                <span>•</span>
                <span className="text-foreground-secondary">Authoritative Server State</span>
              </div>
            </div>

            {/* Collaborative Tasks & Activity Stream Mini Preview */}
            <div className="md:col-span-7 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Shared Room Tasks
              </div>

              <div className="space-y-2">
                <div className="p-3 card-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span className="text-foreground line-through opacity-60">
                      Configure PostgreSQL schema & relations
                    </span>
                  </div>
                  <span className="text-[10px] bg-surface-elevated text-foreground-secondary border border-border px-2 py-0.5 rounded">
                    Done
                  </span>
                </div>

                <div className="p-3 card-subtle border-accent/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-accent" />
                    <span className="text-foreground font-medium">
                      Authoritative group Pomodoro timer synchronization
                    </span>
                  </div>
                  <span className="text-[10px] bg-accent-muted text-accent font-medium px-2 py-0.5 rounded border border-accent/20">
                    In Progress
                  </span>
                </div>

                <div className="p-3 card-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-foreground-muted" />
                    <span className="text-foreground-secondary">
                      Multi-client concurrency & WebSocket reconnection
                    </span>
                  </div>
                  <span className="text-[10px] bg-surface-elevated text-foreground-muted px-2 py-0.5 rounded border border-border">
                    To Do
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
