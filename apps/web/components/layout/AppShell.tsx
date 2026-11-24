'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, fullWidth = false }) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (mounted && isInitialized && !isLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isInitialized, isLoading, user, router]);

  // Show loading spinner while mounting (SSR match) or verifying auth when user is not cached
  if (!mounted || (!user && (isLoading || !isInitialized))) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <div className="absolute inset-0 w-10 h-10 rounded-full blur-md bg-accent/30 animate-pulse pointer-events-none" />
        </div>
        <p className="text-xs font-mono text-foreground-muted tracking-wider">
          Connecting to StudyFlow...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-canvas text-foreground flex flex-col transition-colors duration-200',
        fullWidth && 'h-screen overflow-hidden'
      )}
    >
      <Navbar variant="admin" />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <main
            className={
              fullWidth
                ? 'flex-1 p-2 sm:p-3 md:p-3.5 pb-20 md:pb-3.5 w-full flex flex-col min-h-0 overflow-hidden'
                : 'flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden'
            }
          >
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
};
