'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Loader2 } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, fullWidth = false }) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
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
    <div className="min-h-screen bg-canvas text-foreground flex flex-col transition-colors duration-200">
      <Navbar variant="admin" />
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <main
            className={
              fullWidth
                ? 'flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 w-full flex flex-col'
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
