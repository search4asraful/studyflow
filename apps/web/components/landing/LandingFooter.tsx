'use client';

import React from 'react';
import Link from 'next/link';
import { Command, Heart } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface/60 backdrop-blur-md py-14 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent via-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-md">
                SF
              </div>
              <div>
                <span className="font-bold text-base text-foreground">StudyFlow</span>
                <span className="text-xs text-foreground-muted block">
                  Authoritative Digital Study Environment &amp; Collaborative Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Quick Keyboard shortcuts helper */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-foreground-muted bg-surface-subtle border border-border px-4 py-2 rounded-xl">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5 text-accent" /> Hotkeys:
            </span>
            <span><kbd className="px-1.5 py-0.5 rounded-sm bg-surface border border-border font-mono text-[10px]">⌘K</kbd> Command Palette</span>
            <span><kbd className="px-1.5 py-0.5 rounded-sm bg-surface border border-border font-mono text-[10px]">Space</kbd> Start/Pause</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-foreground-muted">
          <p className="flex items-center gap-1.5">
            Engineered with <Heart className="w-3.5 h-3.5 text-red-400 fill-current" /> by Group Astro • ECSE Department Section D
          </p>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/rooms" className="hover:text-foreground transition-colors">
              Rooms
            </Link>
            <Link href="/tasks" className="hover:text-foreground transition-colors">
              Tasks
            </Link>
            <Link href="/analytics" className="hover:text-foreground transition-colors">
              Analytics
            </Link>
            <Link href="/credits" className="hover:text-accent font-semibold transition-colors">
              Credits &amp; Architecture
            </Link>
            <a
              href="https://github.com/search4asraful/studyflow"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
