'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RoomMember, TASK_PRIORITIES, TASK_STATUSES } from '@studyflow/shared';
import {
  CheckSquare,
  Sparkles,
  Calendar,
  User,
  Flag,
  Layers,
  FolderOpen,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, addDays } from 'date-fns';

const taskFormSchema = z.object({
  roomId: z.string().optional().nullable(),
  title: z.string().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().max(1000).optional(),
  priority: z.enum([
    TASK_PRIORITIES.LOW,
    TASK_PRIORITIES.MEDIUM,
    TASK_PRIORITIES.HIGH,
    TASK_PRIORITIES.URGENT,
  ]),
  status: z.enum([
    TASK_STATUSES.BACKLOG,
    TASK_STATUSES.TODO,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.COMPLETED,
  ]),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  members?: RoomMember[];
  rooms?: { id: string; name: string }[];
}

const PRIORITY_OPTIONS = [
  {
    value: 'LOW' as const,
    label: 'Low',
    dot: 'bg-slate-400',
    activeStyles:
      'bg-slate-100 dark:bg-slate-500/20 border-slate-400 dark:border-slate-500/60 text-slate-800 dark:text-slate-100 font-semibold ring-1 ring-slate-400/40',
    idleStyles:
      'border-border/70 bg-surface-subtle/50 text-foreground-secondary hover:text-foreground hover:border-slate-400/40 hover:bg-surface-elevated',
  },
  {
    value: 'MEDIUM' as const,
    label: 'Medium',
    dot: 'bg-sky-500',
    activeStyles:
      'bg-sky-50 dark:bg-sky-500/20 border-sky-500/70 dark:border-sky-400/70 text-sky-800 dark:text-sky-200 font-semibold ring-1 ring-sky-500/40',
    idleStyles:
      'border-border/70 bg-surface-subtle/50 text-foreground-secondary hover:text-foreground hover:border-sky-400/40 hover:bg-surface-elevated',
  },
  {
    value: 'HIGH' as const,
    label: 'High',
    dot: 'bg-amber-500',
    activeStyles:
      'bg-amber-50 dark:bg-amber-500/20 border-amber-500/70 dark:border-amber-400/70 text-amber-900 dark:text-amber-200 font-semibold ring-1 ring-amber-500/40',
    idleStyles:
      'border-border/70 bg-surface-subtle/50 text-foreground-secondary hover:text-foreground hover:border-amber-400/40 hover:bg-surface-elevated',
  },
  {
    value: 'URGENT' as const,
    label: 'Urgent',
    dot: 'bg-rose-500 animate-pulse',
    activeStyles:
      'bg-rose-50 dark:bg-rose-500/20 border-rose-500/70 dark:border-rose-400/70 text-rose-800 dark:text-rose-200 font-semibold ring-1 ring-rose-500/40',
    idleStyles:
      'border-border/70 bg-surface-subtle/50 text-foreground-secondary hover:text-foreground hover:border-rose-400/40 hover:bg-surface-elevated',
  },
];

const STATUS_OPTIONS = [
  { value: 'BACKLOG' as const, label: 'Backlog', icon: '📥' },
  { value: 'TODO' as const, label: 'To Do', icon: '📋' },
  { value: 'IN_PROGRESS' as const, label: 'In Progress', icon: '⚡' },
  { value: 'COMPLETED' as const, label: 'Done', icon: '✅' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  members = [],
  rooms,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      roomId: rooms?.[0]?.id || null,
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: null,
      dueDate: '',
    },
  });

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');
  const selectedDueDate = watch('dueDate');
  const titleValue = watch('title') || '';

  const setQuickDate = (daysFromNow: number | null) => {
    if (daysFromNow === null) {
      setValue('dueDate', '');
    } else {
      const targetDate = addDays(new Date(), daysFromNow);
      setValue('dueDate', format(targetDate, 'yyyy-MM-dd'));
    }
  };

  const onFormSubmit = (data: TaskFormData) => {
    onSubmit({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      assigneeId: data.assigneeId || null,
    });
    reset();
    onClose();
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
      title="New Task"
      description="Plan and assign objectives for your study group."
      headerIcon={<CheckSquare className="w-4 h-4 text-accent" />}
      className="max-w-md p-4 sm:p-5"
    >
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        onKeyDown={handleKeyDown}
        className="space-y-3 mt-0.5"
      >
        {/* Workspace selector if multiple rooms available */}
        {rooms && rooms.length > 0 && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground-secondary flex items-center gap-1">
              <FolderOpen className="w-3 h-3 text-accent" />
              <span>Workspace</span>
            </label>
            <select
              {...register('roomId', { required: true })}
              className="input-base bg-surface-subtle text-foreground text-xs font-medium py-1.5 px-2.5 rounded-lg border-border/80"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-surface text-foreground">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Task Title Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-foreground flex items-center gap-0.5">
              <span>Title</span>
              <span className="text-accent">*</span>
            </label>
            <span
              className={cn(
                'text-[9px] font-mono',
                titleValue.length > 100 ? 'text-amber-400' : 'text-foreground-muted'
              )}
            >
              {titleValue.length}/120
            </span>
          </div>
          <input
            {...register('title')}
            placeholder="e.g. Solve dynamic programming problem set"
            autoFocus
            className={cn(
              'input-base text-xs py-2 px-3 font-medium placeholder:text-foreground-muted/60 transition-all rounded-lg',
              errors.title && 'border-rose-500/50 focus:border-rose-500'
            )}
          />
          {errors.title && (
            <p className="text-[10px] font-medium text-rose-400">{errors.title.message}</p>
          )}
        </div>

        {/* Description textarea */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-secondary">
            <span>Description</span>
          </label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Notes, acceptance criteria, or links..."
            className="input-base text-xs leading-relaxed py-1.5 px-3 rounded-lg resize-none placeholder:text-foreground-muted/60"
          />
        </div>

        {/* Priority Selector Row */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-secondary flex items-center gap-1">
            <Flag className="w-3 h-3 text-accent" />
            <span>Priority</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => {
              const isSelected = selectedPriority === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('priority', opt.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs transition-all cursor-pointer select-none active:scale-[0.98]',
                    isSelected ? opt.activeStyles : opt.idleStyles
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0 transition-transform',
                      opt.dot,
                      isSelected && 'scale-110'
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Selector Row */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-secondary flex items-center gap-1">
            <Layers className="w-3 h-3 text-accent" />
            <span>Status</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {STATUS_OPTIONS.map((st) => {
              const isSelected = selectedStatus === st.value;
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setValue('status', st.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs transition-all cursor-pointer select-none active:scale-[0.98]',
                    isSelected
                      ? 'bg-accent/15 border-accent text-accent font-semibold ring-1 ring-accent/30'
                      : 'border-border/70 bg-surface-subtle/50 text-foreground-secondary hover:text-foreground hover:border-border'
                  )}
                >
                  <span className="text-[11px]">{st.icon}</span>
                  <span className="truncate">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee & Due Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground-secondary flex items-center gap-1">
              <User className="w-3 h-3 text-accent" />
              <span>Assignee</span>
            </label>
            <select
              {...register('assigneeId')}
              className="input-base bg-surface-subtle text-foreground text-xs py-1.5 px-2.5 rounded-lg border-border/80 h-8"
            >
              <option value="" className="bg-surface text-foreground-muted">
                Unassigned
              </option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId} className="bg-surface text-foreground">
                  {m.user.name} ({m.role.toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date with Quick Chips */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-foreground-secondary flex items-center gap-1">
                <Calendar className="w-3 h-3 text-accent" />
                <span>Due Date</span>
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="text-foreground-muted hover:text-accent transition-colors"
                >
                  Today
                </button>
                <span className="text-border">•</span>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="text-foreground-muted hover:text-accent transition-colors"
                >
                  +1d
                </button>
                {selectedDueDate && (
                  <>
                    <span className="text-border">•</span>
                    <button
                      type="button"
                      onClick={() => setQuickDate(null)}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            <input
              type="date"
              {...register('dueDate')}
              className="input-base text-xs py-1.5 px-2.5 rounded-lg border-border/80 h-8"
            />
          </div>
        </div>

        {/* Compact Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
          <span className="text-[10px] text-foreground-muted hidden sm:inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-surface-subtle border border-border/80 rounded">
              ⌘↵
            </kbd>
            <span>save</span>
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
              <span>Create Task</span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
