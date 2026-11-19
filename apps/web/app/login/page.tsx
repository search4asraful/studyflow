'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import { apiRequest } from '../../lib/api';
import { toast } from 'sonner';
import { UserCheck } from 'lucide-react';

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
      toast.success(`Logged in as ${name}`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Quick login failed');
    } finally {
      setQuickLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-12 relative transition-colors duration-200">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-base shadow-md group-hover:scale-105 transition-transform">
          SF
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">StudyFlow</span>
      </Link>

      <div className="w-full max-w-md card-elevated p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-foreground-secondary mt-1">
            Access your collaborative study rooms and Pomodoro sessions.
          </p>
        </div>

        {/* One-Click Demo Logins */}
        <div className="mb-6 card-subtle p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>One-Click Demo Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={quickLoading === 'asraful@studyflow.dev'}
              onClick={() => handleQuickLogin('asraful@studyflow.dev', 'Demo Host (Asraful)')}
              className="text-[11px] py-1.5 justify-start text-left"
            >
              Demo Host
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={quickLoading === 'shakil@studyflow.dev'}
              onClick={() => handleQuickLogin('shakil@studyflow.dev', 'Demo Member (Shakil)')}
              className="text-[11px] py-1.5 justify-start text-left"
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

          <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-foreground-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-accent hover:underline font-medium">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
