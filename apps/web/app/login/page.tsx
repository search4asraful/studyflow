'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { GuestGuard } from '../../components/layout/GuestGuard';
import { apiRequest } from '../../lib/api';
import { triggerConfetti } from '../../lib/confetti';
import { useAuthStore } from '../../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await apiRequest<{ user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(res.user);
      triggerConfetti({ particleCount: 50 });
      toast.success(`Welcome back, ${res.user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleQuickLogin = async (email: string, name: string) => {
    setQuickLoading(email);
    try {
      const res = await apiRequest<{ user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'password123' }),
      });
      setUser(res.user);
      triggerConfetti({ particleCount: 50 });
      toast.success(`Logged in as ${name}`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Quick login failed');
    } finally {
      setQuickLoading(null);
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-12 relative transition-colors duration-200 overflow-hidden">
        {/* Background ambient radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Controls */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <ThemeToggle />
        </div>

        <Link href="/" className="flex items-center gap-2.5 mb-8 group relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-accent via-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-accent/25 group-hover:scale-105 transition-all">
            SF
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground">StudyFlow</span>
        </Link>

        <div className="w-full max-w-md card-elevated p-8 shadow-2xl relative z-10 border-accent/25">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-foreground-secondary mt-1">
              Access your collaborative study rooms, Pomodoro timers, and shared tasks.
            </p>
          </div>

          {/* One-Click Demo Logins */}
          <div className="mb-6 card-subtle p-4 space-y-2.5 border-accent/20">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Instant Demo Access</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={quickLoading === 'asraful@studyflow.dev'}
                onClick={() => handleQuickLogin('asraful@studyflow.dev', 'Demo Host (Asraful)')}
                className="text-xs py-2 justify-center text-center font-medium"
              >
                Demo Host
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={quickLoading === 'shakil@studyflow.dev'}
                onClick={() => handleQuickLogin('shakil@studyflow.dev', 'Demo Member (Shakil)')}
                className="text-xs py-2 justify-center text-center font-medium"
              >
                Demo Member
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@university.edu"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-3 font-semibold shadow-md shadow-accent/25"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-foreground-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-accent hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
