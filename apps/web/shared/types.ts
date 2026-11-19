import {
  ROOM_ROLES,
  TIMER_PHASES,
  TIMER_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from './constants';

export type RoomRole = (typeof ROOM_ROLES)[keyof typeof ROOM_ROLES];
export type TimerPhase = (typeof TIMER_PHASES)[keyof typeof TIMER_PHASES];
export type TimerStatus = (typeof TIMER_STATUSES)[keyof typeof TIMER_STATUSES];
export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];
export type TaskPriority = (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES];

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  dailyGoalMinutes: number;
  timezone: string;
  themePreference: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface StudyRoom {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  isPrivate: boolean;
  focusDuration: number; // in seconds
  shortBreakDuration: number; // in seconds
  longBreakDuration: number; // in seconds
  cyclesBeforeLongBreak: number;
  ownerId: string;
  owner?: SafeUser;
  members?: RoomMember[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: RoomRole;
  user: SafeUser;
  joinedAt: string;
  isOnline?: boolean;
  lastActiveAt?: string;
}

export interface AuthoritativeTimerState {
  roomId: string;
  sessionId?: string | null;
  phase: TimerPhase;
  status: TimerStatus;
  startedAt: string | null; // ISO timestamp
  pausedAt: string | null; // ISO timestamp
  remainingSeconds: number; // remaining at pausedAt or duration
  totalPhaseDuration: number; // in seconds
  currentCycle: number; // 1 to 4
  serverTimestamp: number; // Date.now() on the server
}

export interface PomodoroRecord {
  id: string;
  userId: string;
  roomId?: string | null;
  sessionId?: string | null;
  phase: TimerPhase;
  durationMinutes: number;
  completedAt: string;
}

export interface Task {
  id: string;
  roomId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assignee?: SafeUser | null;
  createdById: string;
  createdBy?: SafeUser;
  dueDate?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  user?: SafeUser;
  action: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface RoomActivity {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface RoomStatePayload {
  room: StudyRoom;
  role: RoomRole;
  members: RoomMember[];
  timerState: AuthoritativeTimerState;
  tasks: Task[];
  recentActivities: RoomActivity[];
}

export interface AnalyticsSummary {
  todayFocusMinutes: number;
  weekFocusMinutes: number;
  monthFocusMinutes: number;
  completedPomodorosCount: number;
  tasksCompletedCount: number;
  currentStreakDays: number;
  dailyTrend: {
    date: string;
    focusMinutes: number;
    completedPomodoros: number;
  }[];
  weeklyTrend: {
    day: string;
    focusMinutes: number;
  }[];
  taskCompletionRate: number;
  focusDistribution: {
    phase: string;
    minutes: number;
  }[];
}
