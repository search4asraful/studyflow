'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiRequest, invalidateApiCache } from '../../lib/api';
import { toast } from 'sonner';
import {
  Clock,
  Sparkles,
  Globe,
  Lock,
  Zap,
  Flame,
  Layers,
  Check,
  Timer,
  Sliders,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { triggerConfetti } from '../../lib/confetti';
import { StudyRoom } from '@studyflow/shared';

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

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (room: StudyRoom) => void;
}

interface Preset {
  id: string;
  name: string;
  badge: string;
  icon: React.ReactNode;
  focus: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
  description: string;
}

const PRESETS: Preset[] = [
  {
    id: 'classic',
    name: 'Classic',
    badge: 'Popular',
    icon: <Clock className="w-3.5 h-3.5 text-emerald-400" />,
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    cycles: 4,
    description: '25m / 5m • 4 sets',
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    badge: 'Intense',
    icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
    focus: 50,
    shortBreak: 10,
    longBreak: 20,
    cycles: 3,
    description: '50m / 10m • 3 sets',
  },
  {
    id: 'quick-sprint',
    name: 'Sprint',
    badge: 'Agile',
    icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
    focus: 15,
    shortBreak: 3,
    longBreak: 10,
    cycles: 4,
    description: '15m / 3m • 4 sets',
  },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const [activePreset, setActivePreset] = useState<string>('classic');
  const [showCustomIntervals, setShowCustomIntervals] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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

  const isPrivate = Boolean(watch('isPrivate'));
  const focusMinutes = Number(watch('focusMinutes')) || 25;
  const shortBreakMinutes = Number(watch('shortBreakMinutes')) || 5;
  const longBreakMinutes = Number(watch('longBreakMinutes')) || 15;
  const cyclesBeforeLongBreak = Number(watch('cyclesBeforeLongBreak')) || 4;
  const roomName = String(watch('name') || '');

  // Calculate full cycle duration block
  const cycleSummary = useMemo(() => {
    const focusTotal = focusMinutes * cyclesBeforeLongBreak;
    const shortBreaksTotal = shortBreakMinutes * Math.max(0, cyclesBeforeLongBreak - 1);
    const longBreakTotal = longBreakMinutes;
    const totalMinutes = focusTotal + shortBreaksTotal + longBreakTotal;

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeFormatted = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

    return {
      focusTotal,
      restTotal: shortBreaksTotal + longBreakTotal,
      totalMinutes,
      timeFormatted,
      focusPercent: Math.round((focusTotal / Math.max(1, totalMinutes)) * 100),
    };
  }, [focusMinutes, shortBreakMinutes, longBreakMinutes, cyclesBeforeLongBreak]);

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setValue('focusMinutes', preset.focus);
    setValue('shortBreakMinutes', preset.shortBreak);
    setValue('longBreakMinutes', preset.longBreak);
    setValue('cyclesBeforeLongBreak', preset.cycles);
  };

  const handleCustomIntervalChange = () => {
    setActivePreset('custom');
  };

  const onFormSubmit = async (data: CreateRoomOutput) => {
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

      const room = await apiRequest<StudyRoom>('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      invalidateApiCache('/rooms');
      triggerConfetti();
      toast.success(`Study Room "${room.name}" created!`);
      reset();
      onClose();

      if (onSuccess) {
        onSuccess(room);
      } else {
        router.push(`/rooms/${room.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onFormSubmit)();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Study Room"
      description="Configure synchronized Pomodoro workspace, intervals, and privacy."
      headerIcon={<Timer className="w-4 h-4 text-accent" />}
      className="max-w-lg p-4 sm:p-5"
    >
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        onKeyDown={handleKeyDown}
        className="space-y-3.5 mt-0.5"
      >
        {/* Room Name Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-foreground flex items-center gap-0.5">
              <span>Room Name</span>
              <span className="text-accent">*</span>
            </label>
            <span
              className={cn(
                'text-[9px] font-mono',
                roomName.length > 40 ? 'text-amber-400' : 'text-foreground-muted'
              )}
            >
              {roomName.length}/50
            </span>
          </div>
          <input
            {...register('name')}
            placeholder="e.g. Distributed Systems & Algorithms Study"
            autoFocus
            className={cn(
              'input-base text-xs py-2 px-3 font-medium placeholder:text-foreground-muted/60 transition-all rounded-lg',
              errors.name && 'border-rose-500/50 focus:border-rose-500'
            )}
          />
          {errors.name && (
            <p className="text-[10px] font-medium text-rose-400">{errors.name.message}</p>
          )}
        </div>

        {/* Room Description */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-secondary">
            <span>Description</span>
          </label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Focus objectives, target topics, or study goals..."
            className="input-base text-xs leading-relaxed py-1.5 px-3 rounded-lg resize-none placeholder:text-foreground-muted/60"
          />
        </div>

        {/* Pomodoro Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground-secondary flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" />
              <span>Interval Preset</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomIntervals(!showCustomIntervals)}
              className="text-[10px] text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>{showCustomIntervals ? 'Hide custom' : 'Custom minutes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={cn(
                    'p-2 sm:p-2.5 rounded-xl border text-left transition-all relative cursor-pointer select-none',
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-xs ring-1 ring-accent/30'
                      : 'border-border/70 bg-surface-subtle/50 hover:border-accent/40 hover:bg-surface-elevated'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="p-1 rounded-md bg-surface border border-border/80">
                      {p.icon}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-mono px-1 py-0.2 rounded border',
                        isSelected
                          ? 'border-accent/40 bg-accent/20 text-accent font-semibold'
                          : 'border-border/60 bg-surface text-foreground-muted'
                      )}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">{p.name}</h4>
                  <p className="text-[10px] font-mono text-foreground-muted mt-0.5">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Rhythm Preview Card */}
        <div className="p-2.5 rounded-xl border border-border/80 space-y-2 bg-surface-subtle/40">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground text-[11px] flex items-center gap-1">
              <Layers className="w-3 h-3 text-accent" />
              <span>Session Rhythm</span>
            </span>
            <span className="font-mono text-[10px] text-accent font-semibold">
              {cycleSummary.timeFormatted} ({cyclesBeforeLongBreak} sets)
            </span>
          </div>

          {/* Color-coded dynamic sequence bar */}
          <div className="space-y-1">
            <div className="h-2.5 w-full bg-surface rounded-full overflow-hidden flex border border-border/60 p-0.5 gap-0.5">
              {Array.from({ length: cyclesBeforeLongBreak }).map((_, idx) => (
                <React.Fragment key={idx}>
                  {/* Focus chunk */}
                  <div
                    style={{ flexGrow: focusMinutes }}
                    className="h-full bg-accent rounded-xs transition-all"
                    title={`Set ${idx + 1}: ${focusMinutes}m Focus`}
                  />
                  {/* Short Break or Long Break */}
                  {idx < cyclesBeforeLongBreak - 1 ? (
                    <div
                      style={{ flexGrow: shortBreakMinutes }}
                      className="h-full bg-amber-400/85 rounded-xs transition-all"
                      title={`Break: ${shortBreakMinutes}m`}
                    />
                  ) : (
                    <div
                      style={{ flexGrow: longBreakMinutes }}
                      className="h-full bg-purple-400/85 rounded-xs transition-all"
                      title={`Long Rest: ${longBreakMinutes}m`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center justify-between text-[9px] text-foreground-muted font-mono">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Focus ({focusMinutes}m)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Break ({shortBreakMinutes}m)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Long ({longBreakMinutes}m)
                </span>
              </div>
              <span className="text-foreground font-semibold">{cycleSummary.focusPercent}% Work</span>
            </div>
          </div>

          {/* Custom Duration Fields (Expandable) */}
          {showCustomIntervals && (
            <div className="pt-2 border-t border-border/60 grid grid-cols-4 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-foreground-secondary">
                  Focus (m)
                </label>
                <input
                  type="number"
                  {...register('focusMinutes', { onChange: handleCustomIntervalChange })}
                  min={1}
                  max={120}
                  className="input-base text-xs py-1 px-1.5 rounded-md font-mono text-center h-7"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-foreground-secondary">
                  Short (m)
                </label>
                <input
                  type="number"
                  {...register('shortBreakMinutes', { onChange: handleCustomIntervalChange })}
                  min={1}
                  max={30}
                  className="input-base text-xs py-1 px-1.5 rounded-md font-mono text-center h-7"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-foreground-secondary">
                  Long (m)
                </label>
                <input
                  type="number"
                  {...register('longBreakMinutes', { onChange: handleCustomIntervalChange })}
                  min={1}
                  max={60}
                  className="input-base text-xs py-1 px-1.5 rounded-md font-mono text-center h-7"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-foreground-secondary">
                  Sets
                </label>
                <input
                  type="number"
                  {...register('cyclesBeforeLongBreak', { onChange: handleCustomIntervalChange })}
                  min={1}
                  max={12}
                  className="input-base text-xs py-1 px-1.5 rounded-md font-mono text-center h-7"
                />
              </div>
            </div>
          )}
        </div>

        {/* Privacy Selector Cards */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-foreground-secondary">
            Access Control
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Public Option */}
            <div
              onClick={() => setValue('isPrivate', false)}
              className={cn(
                'p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 select-none',
                !isPrivate
                  ? 'border-emerald-500/40 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-border/70 bg-surface-subtle/50 hover:border-border hover:bg-surface-elevated'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg border shrink-0',
                  !isPrivate
                    ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                    : 'border-border/60 bg-surface text-foreground-muted'
                )}
              >
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Public</span>
                  {!isPrivate && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-foreground-muted leading-tight mt-0.5">
                  Visible in directory. 1-click join.
                </p>
              </div>
            </div>

            {/* Private Option */}
            <div
              onClick={() => setValue('isPrivate', true)}
              className={cn(
                'p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 select-none',
                isPrivate
                  ? 'border-accent/40 bg-accent/10 shadow-xs ring-1 ring-accent/30'
                  : 'border-border/70 bg-surface-subtle/50 hover:border-border hover:bg-surface-elevated'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg border shrink-0',
                  isPrivate
                    ? 'border-accent/30 bg-accent/20 text-accent'
                    : 'border-border/60 bg-surface text-foreground-muted'
                )}
              >
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Private</span>
                  {isPrivate && <Check className="w-3 h-3 text-accent shrink-0" />}
                </div>
                <p className="text-[10px] text-foreground-muted leading-tight mt-0.5">
                  Requires 8-character invite code.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
          <span className="text-xs text-foreground-muted hidden sm:inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-surface-subtle border border-border/80 rounded">
              ⌘↵
            </kbd>
            <span>launch</span>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-xs text-foreground-secondary hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="h-8 px-4 text-xs font-semibold shadow-xs shadow-accent/25 gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              <span>Launch Room</span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
