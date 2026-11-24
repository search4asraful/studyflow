'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { Loader2 } from 'lucide-react';

interface GuestGuardProps {
  children: React.ReactNode;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (mounted && (user || isAuthenticated)) {
      router.replace('/dashboard');
    }
  }, [mounted, user, isAuthenticated, router]);

  // While mounting (hydration safety), verifying initial session, or redirecting authenticated users
  if (!mounted || user || isAuthenticated || (!isInitialized && isLoading)) {
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

  return <>{children}</>;
};
