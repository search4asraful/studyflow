'use client';

import React from 'react';
import Link from 'next/link';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-border bg-canvas py-12 px-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-foreground-muted">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs">
            SF
          </div>
          <span className="font-semibold text-foreground">StudyFlow</span>
          <span>— Collaborative Digital Study Environment</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Log In
          </Link>
          <Link href="/register" className="hover:text-foreground transition-colors">
            Register
          </Link>
          <Link href="/credits" className="hover:text-foreground transition-colors">
            Credits
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
    </footer>
  );
};
