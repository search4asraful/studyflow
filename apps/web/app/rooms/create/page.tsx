'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '../../../components/layout/AppShell';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiRequest } from '../../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Clock, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { triggerConfetti } from '../../../lib/confetti';

const createRoomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(50),
  description: z.string().max(300).optional(),
  isPrivate: z.boolean(),
  focusMinutes: z.coerce.number().min(1, 'At least 1 min').max(120, 'Max 120 mins'),
  shortBreakMinutes: z.coerce.number().min(1, 'At least 1 min').max(30, 'Max 30 mins'),
  longBreakMinutes: z.coerce.number().min(1, 'At least 1 min').max(60, 'Max 60 mins'),
  cyclesBeforeLongBreak: z.coerce.number().min(1, 'At least 1 cycle').max(12, 'Max 12 cycles'),
});

type CreateRoomInput = z.input<typeof createRoomSchema>;
type CreateRoomOutput = z.output<typeof createRoomSchema>;

export default function CreateRoomPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomInput, any, CreateRoomOutput>({
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

  const isPrivate = watch('isPrivate');

  // Quick Preset Helper
  const applyPreset = (focus: number, shortBreak: number, longBreak: number, cycles: number) => {
    setValue('focusMinutes', focus);
    setValue('shortBreakMinutes', shortBreak);
    setValue('longBreakMinutes', longBreak);
    setValue('cyclesBeforeLongBreak', cycles);
    toast.info(`Applied interval: ${focus}m Focus / ${shortBreak}m Break`);
  };

  const onSubmit = async (data: CreateRoomOutput) => {
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

      const room = await apiRequest<any>('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      triggerConfetti();
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

        <div className="card-elevated p-6 sm:p-8 border-accent/25">
          <div className="mb-6">
            <h1 className="heading-page">Create a Study Room</h1>
            <p className="subheading-page">
              Configure your collaborative digital workspace, Pomodoro intervals, and access control.
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
                placeholder="What is the group focusing on during this session?"
                className="input-base"
              />
              {errors.description && (
                <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>
              )}
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Quick Pomodoro Presets
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => applyPreset(25, 5, 15, 4)}
                  className="p-2.5 rounded-xl border border-border bg-surface-subtle hover:border-accent/40 text-left transition-all"
                >
                  <span className="text-xs font-bold text-foreground block">Classic Pomodoro</span>
                  <span className="text-[10px] font-mono text-foreground-muted">25m Focus • 5m Rest</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset(50, 10, 20, 3)}
                  className="p-2.5 rounded-xl border border-border bg-surface-subtle hover:border-accent/40 text-left transition-all"
                >
                  <span className="text-xs font-bold text-foreground block">Deep Work</span>
                  <span className="text-[10px] font-mono text-foreground-muted">50m Focus • 10m Rest</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset(15, 3, 10, 4)}
                  className="p-2.5 rounded-xl border border-border bg-surface-subtle hover:border-accent/40 text-left transition-all"
                >
                  <span className="text-xs font-bold text-foreground block">Quick Sprint</span>
                  <span className="text-[10px] font-mono text-foreground-muted">15m Focus • 3m Rest</span>
                </button>
              </div>
            </div>

            {/* Pomodoro Duration Settings */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Custom Duration Settings (Minutes)
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
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl card-subtle cursor-pointer hover:border-accent/40 transition-colors">
                <input
                  type="checkbox"
                  {...register('isPrivate')}
                  className="mt-1 h-4 w-4 rounded-sm border-border bg-surface-subtle text-accent focus:ring-accent"
                />
                <div>
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    {isPrivate ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Globe className="w-3.5 h-3.5 text-accent" />}
                    {isPrivate ? 'Private Room (Invite Code Required)' : 'Public Room (Visible in Directory)'}
                  </span>
                  <span className="text-[11px] text-foreground-muted block mt-0.5">
                    {isPrivate
                      ? 'Only teammates with your secret 8-character invite code will be able to discover and join.'
                      : 'Anyone on StudyFlow can browse and join this session from the public directory.'}
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link href="/rooms">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="font-semibold px-6 shadow-md shadow-accent/25"
              >
                Create &amp; Launch Room
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
