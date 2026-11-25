'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await apiRequest<{ user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(res.user);
      triggerConfetti();
      toast.success(`Account created! Welcome to StudyFlow, ${res.user.name}.`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
          <img
            src="/studyflow.png"
            alt="StudyFlow Logo"
            className="w-12 h-12 rounded-2xl object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-2xl tracking-tight text-foreground">StudyFlow</span>
        </Link>

        <div className="w-full max-w-md card-elevated p-8 shadow-2xl relative z-10 border-accent/25">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Create your account</h2>
            <p className="text-xs text-foreground-secondary mt-1">
              Join group study sessions and start tracking shared focus time with zero clock drift.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Asraful Islam"
              {...register('name')}
              error={errors.name?.message}
            />

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
              placeholder="At least 6 characters"
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
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-foreground-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
