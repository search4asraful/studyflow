'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface/50 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Main Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10">
          {/* Brand & Identity */}
          <div className="space-y-3 max-w-md">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent via-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-accent/20 group-hover:scale-105 transition-transform">
                SF
              </div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                StudyFlow
              </span>
            </Link>

            <p className="text-xs text-foreground-secondary leading-relaxed font-normal">
              The authoritative digital study environment. Real-time synchronized Pomodoro sessions,
              collaborative Kanban tasks, and ephemeral live meeting streams.
            </p>

            {/* Operational Status Dot */}
            <div className="flex items-center gap-2 pt-1 text-xs text-foreground-muted">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-[11px] text-foreground-secondary">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Navigation (Strictly Credits & Architecture, GitHub) */}
          <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-3 sm:gap-4">
            <Link
              href="/credits"
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-border hover:border-accent/40 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-all duration-150 shadow-2xs hover:shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Credits &amp; Architecture</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <a
              href="https://github.com/search4asraful/studyflow"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-border hover:border-accent/40 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-all duration-150 shadow-2xs hover:shadow-xs"
            >
              <svg className="w-4 h-4 fill-current text-foreground-secondary group-hover:text-foreground transition-colors" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Bottom Attribution & Copyright */}
        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <p className="font-normal text-center sm:text-left">
            Engineered by <span className="text-foreground font-medium">Group Astro</span> • ECSE Department Section D
          </p>

          <p className="font-mono text-[11px] text-foreground-muted/80">
            © 2026 StudyFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
