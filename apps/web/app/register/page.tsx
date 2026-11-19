'use client';

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
      toast.success(`Account created! Welcome to StudyFlow, ${res.user.name}.`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
          <h2 className="text-xl font-bold text-foreground tracking-tight">Create your account</h2>
          <p className="text-xs text-foreground-secondary mt-1">
            Join group study sessions and start tracking shared focus time.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Md. Asraful Islam"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Email address"
            type="email"
            placeholder="asraful@university.edu"
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

          <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-foreground-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
