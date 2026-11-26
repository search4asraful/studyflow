import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES, TIMER_PHASES } from './constants';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(250).optional(),
  avatarUrl: z.string().url().nullable().optional().or(z.literal('')),
  dailyGoalMinutes: z.number().int().min(10).max(1440).optional(),
  timezone: z.string().optional(),
  themePreference: z.enum(['dark', 'light', 'system']).optional(),
  soundEnabled: z.boolean().optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartPomodoros: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const createRoomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters').max(50),
  description: z.string().max(300).optional(),
  isPrivate: z.boolean().default(false),
  focusDuration: z.number().int().min(60).max(7200).default(25 * 60), // 1m - 120m
  shortBreakDuration: z.number().int().min(60).max(3600).default(5 * 60),
  longBreakDuration: z.number().int().min(60).max(3600).default(15 * 60),
  cyclesBeforeLongBreak: z.number().int().min(1).max(12).default(4),
});

export const updateRoomSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().max(300).optional(),
  isPrivate: z.boolean().optional(),
  focusDuration: z.number().int().min(60).max(7200).optional(),
  shortBreakDuration: z.number().int().min(60).max(3600).optional(),
  longBreakDuration: z.number().int().min(60).max(3600).optional(),
  cyclesBeforeLongBreak: z.number().int().min(1).max(12).optional(),
});

export const joinRoomSchema = z.object({
  inviteCode: z.string().min(4).max(12).toUpperCase(),
});

export const createTaskSchema = z.object({
  roomId: z.string().uuid(),
  title: z.string().min(2, 'Task title must be at least 2 characters').max(120),
  description: z.string().max(1000).optional(),
  priority: z.enum([
    TASK_PRIORITIES.LOW,
    TASK_PRIORITIES.MEDIUM,
    TASK_PRIORITIES.HIGH,
    TASK_PRIORITIES.URGENT,
  ]).default(TASK_PRIORITIES.MEDIUM),
  status: z.enum([
    TASK_STATUSES.BACKLOG,
    TASK_STATUSES.TODO,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.COMPLETED,
  ]).default(TASK_STATUSES.TODO),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  position: z.number().int().optional().default(0),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  priority: z.enum([
    TASK_PRIORITIES.LOW,
    TASK_PRIORITIES.MEDIUM,
    TASK_PRIORITIES.HIGH,
    TASK_PRIORITIES.URGENT,
  ]).optional(),
  status: z.enum([
    TASK_STATUSES.BACKLOG,
    TASK_STATUSES.TODO,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.COMPLETED,
  ]).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  position: z.number().int().optional(),
});

export const timerActionPayloadSchema = z.object({
  roomId: z.string().uuid(),
});

export const timerSkipPayloadSchema = z.object({
  roomId: z.string().uuid(),
  targetPhase: z.enum([
    TIMER_PHASES.FOCUS,
    TIMER_PHASES.SHORT_BREAK,
    TIMER_PHASES.LONG_BREAK,
  ]).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
