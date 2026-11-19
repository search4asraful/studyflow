'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '../../../components/layout/AppShell';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiRequest } from '../../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

const createRoomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(50),
  description: z.string().max(300).optional(),
  isPrivate: z.boolean().default(false),
  focusMinutes: z.coerce.number().min(1).max(120).default(25),
  shortBreakMinutes: z.coerce.number().min(1).max(30).default(5),
  longBreakMinutes: z.coerce.number().min(1).max(60).default(15),
  cyclesBeforeLongBreak: z.coerce.number().min(1).max(12).default(4),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

export default function CreateRoomPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      cyclesBeforeLongBreak: 4,
    },
  });

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        isPrivate: data.isPrivate,
        focusDuration: data.focusMinutes * 60,
        shortBreakDuration: data.shortBreakMinutes * 60,
        longBreakDuration: data.longBreakMinutes * 60,
        cyclesBeforeLongBreak: data.cyclesBeforeLongBreak,
      };

      const room = await apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Study room created successfully!');
      router.push(`/rooms/${room.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room');
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Study Rooms
        </Link>

        <div className="card-base p-8">
          <div className="mb-6 pb-6 divider-subtle">
            <h1 className="heading-page">
              Create a Study Room
            </h1>
            <p className="subheading-page">
              Configure your collaborative workspace, Pomodoro intervals, and access control.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Room Name *"
              placeholder="e.g. Distributed Systems & Algorithms Study"
              {...register('name')}
              error={errors.name?.message}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground-secondary">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="What is the group working on during this session?"
                className="input-base"
              />
              {errors.description && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Pomodoro Duration Settings */}
            <div className="space-y-3 pt-2 divider-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Pomodoro Duration Settings (Minutes)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label="Focus (min)"
                  type="number"
                  {...register('focusMinutes')}
                  error={errors.focusMinutes?.message}
                />
                <Input
                  label="Short Break"
                  type="number"
                  {...register('shortBreakMinutes')}
                  error={errors.shortBreakMinutes?.message}
                />
                <Input
                  label="Long Break"
                  type="number"
                  {...register('longBreakMinutes')}
                  error={errors.longBreakMinutes?.message}
                />
                <Input
                  label="Cycle Count"
                  type="number"
                  {...register('cyclesBeforeLongBreak')}
                  error={errors.cyclesBeforeLongBreak?.message}
                />
              </div>
            </div>

            {/* Room Visibility */}
            <div className="pt-2 divider-subtle">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isPrivate')}
                  className="mt-1 h-4 w-4 rounded border-border bg-surface-subtle text-accent focus:ring-accent"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Make this room private
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    Only invited members with your unique room code will be able to discover and join.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 divider-subtle">
              <Link href="/rooms">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Create &amp; Launch Room
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
