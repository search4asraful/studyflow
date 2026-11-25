'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { useAuthStore } from '../../stores/authStore';
import {
  apiRequest,
  cachedApiRequest,
  mutateApiCache,
  invalidateApiCache,
  subscribeToRevalidation,
} from '../../lib/api';
import { AnalyticsSummary, StudyRoom, Task } from '@studyflow/shared';
import { formatMinutes } from '../../lib/utils';
import { triggerConfetti } from '../../lib/confetti';
import { playTaskCompletionSound } from '../../lib/audio';
import {
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  Timer,
  ArrowRight,
  Plus,
  Users,
  Sparkles,
  TrendingUp,
  Target,
  Copy,
  Check,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        const [analyticsData, roomsData, tasksData] = await Promise.all([
          cachedApiRequest<AnalyticsSummary>('/analytics/summary').catch(() => null),
          cachedApiRequest<StudyRoom[]>('/rooms').catch(() => []),
          cachedApiRequest<Task[]>('/tasks/my').catch(() => []),
        ]);

        if (active) {
          if (analyticsData) setAnalytics(analyticsData);
          if (roomsData) setRooms(roomsData);
          if (tasksData) setTasks(tasksData);
        }
      } catch {
        // Handled silently
      }
    }

    loadDashboardData();

    // SWR real-time revalidation listeners (keep UI in sync when revalidation finishes)
    const unsub1 = subscribeToRevalidation<AnalyticsSummary>('/analytics/summary', (data) => {
      if (active && data) setAnalytics(data);
    });
    const unsub2 = subscribeToRevalidation<StudyRoom[]>('/rooms', (data) => {
      if (active && data) setRooms(data);
    });
    const unsub3 = subscribeToRevalidation<Task[]>('/tasks/my', (data) => {
      if (active && data) setTasks(data);
    });

    return () => {
      active = false;
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Daily target calculation
  const targetMinutes = profile?.dailyGoalMinutes || 120;
  const todayMinutes = analytics?.todayFocusMinutes ?? 0;
  const targetPercent = Math.min(100, Math.round((todayMinutes / targetMinutes) * 100));

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Invite code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const previousTasks = [...tasks];

    // 1. Instant 0ms Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    // 2. Instant Sensory Feedback
    if (nextStatus === 'COMPLETED') {
      playTaskCompletionSound();
      triggerConfetti({ particleCount: 50 });
      toast.success('Task marked as completed! 🎉');
    } else {
      toast.info('Task reopened');
    }

    // 3. Optimistic Cache Mutation
    mutateApiCache<Task[]>('/tasks/my', (cached) =>
      cached ? cached.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)) : []
    );

    // 4. Background Sync with server & rollback on failure
    try {
      const updated = await apiRequest<Task>(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      invalidateApiCache('/analytics/summary');
    } catch (err: any) {
      // Revert optimistic changes on network error
      setTasks(previousTasks);
      mutateApiCache<Task[]>('/tasks/my', () => previousTasks);
      toast.error(err.message || 'Failed to update task');
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Hero Banner with Daily Target Ring */}
        <div className="card-glass p-6 sm:p-8 relative overflow-hidden border-accent/25">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/15 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-start-safe gap-6 relative z-10">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
                  StudyFlow Workspace Active
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {greeting}, {user?.name ? user.name.split(' ')[0] : 'there'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                Stay disciplined. Dive into an active study room or tackle your pending collaborative tasks today.
              </p>
            </div>

            {/* Daily Target Progress Pill */}
            <div className="card-subtle p-4 rounded-2xl flex items-center gap-4 bg-surface-elevated/80 border-accent/30 shadow-xs">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-border-subtle"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-accent transition-all duration-700 ease-out"
                    strokeDasharray={`${targetPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-mono font-bold text-foreground">
                  {targetPercent}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted block">
                  Daily Focus Goal
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatMinutes(todayMinutes)} / {formatMinutes(targetMinutes)}
                </span>
                <p className="text-[10px] text-accent mt-0.5 font-medium">
                  {targetPercent >= 100 ? '🎉 Target Achieved!' : `${targetMinutes - todayMinutes}m remaining`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col items-center gap-3 w-full sm:w-auto">
              <Link href="/rooms" className="flex-1 sm:flex-initial">
                <Button variant="secondary" size="md" className="w-full gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  Browse Rooms
                </Button>
              </Link>
              <Link href="/rooms/create" className="flex-1 sm:flex-initial">
                <Button variant="primary" size="md" className="w-full gap-2 font-semibold">
                  <Plus className="w-4 h-4" />
                  New Room
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak Card */}
          <div className="card-interactive p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span className="font-semibold">Current Streak</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {analytics?.currentStreakDays ?? 0}
              </span>
              <span className="text-xs text-foreground-muted">days streak</span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-400" />
              Consecutive days with at least 1 study cycle
            </p>
          </div>

          {/* Today's Focus Card */}
          <div className="card-interactive p-5 group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span className="font-semibold">Today&apos;s Focus Time</span>
              <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {formatMinutes(analytics?.todayFocusMinutes ?? 0)}
              </span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-accent" />
              Week total: {formatMinutes(analytics?.weekFocusMinutes ?? 0)}
            </p>
          </div>

          {/* Completed Pomodoros */}
          <div className="card-interactive p-5 group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span className="font-semibold">Pomodoro Cycles</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {analytics?.completedPomodorosCount ?? 0}
              </span>
              <span className="text-xs text-foreground-muted">intervals</span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-2">
              Authoritative synchronized sessions
            </p>
          </div>

          {/* Tasks Completed */}
          <div className="card-interactive p-5 group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span className="font-semibold">Tasks Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {analytics?.tasksCompletedCount ?? 0}
              </span>
              <span className="text-xs text-foreground-muted">
                ({analytics?.taskCompletionRate ?? 0}% rate)
              </span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-2">
              Collaborative action items completed
            </p>
          </div>
        </div>

        {/* Weekly Productivity Chart */}
        <div className="card-base p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Weekly Focus Velocity
                </h3>
                <span className="text-[10px] text-nowrap hidden sm:inline-block font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                  Real Time
                </span>
              </div>
              <p className="text-xs text-foreground-muted mt-1">Focus minutes recorded per day</p>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-nowrap text-accent hover:underline flex items-center gap-1.5 font-semibold group"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {analytics?.weeklyTrend && analytics.weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-base)',
                      borderRadius: '14px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '2px' }}
                    itemStyle={{ color: 'var(--accent)' }}
                    formatter={(val: any) => [`${val} minutes`, 'Focus Time']}
                  />
                  <Bar dataKey="focusMinutes" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-foreground-muted">
                No study sessions recorded yet this week
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Active Rooms & Upcoming Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Study Rooms (7 cols) */}
          <div className="lg:col-span-7 card-base p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Your Study Rooms
                </h3>
              </div>
              <Link href="/rooms" className="text-xs text-accent hover:underline font-semibold">
                View All Rooms
              </Link>
            </div>

            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="text-center py-10 text-xs text-foreground-muted card-subtle border-dashed">
                  <p className="text-sm text-foreground-secondary mb-1">No study rooms joined yet.</p>
                  <p className="text-xs text-foreground-muted">Create a study room or join one with an invite code!</p>
                </div>
              ) : (
                rooms.slice(0, 3).map((room) => (
                  <div
                    key={room.id}
                    className="card-subtle p-4 hover:border-accent/40 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                          {room.name}
                        </h4>
                        <Badge size="sm" variant={room.isPrivate ? 'default' : 'accent'}>
                          {room.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-secondary mt-1 line-clamp-1">
                        {room.description || 'Collaborative Pomodoro room'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-foreground-muted mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {room.memberCount || 1} members
                        </span>
                        <span>•</span>
                        <button
                          onClick={(e) => handleCopyCode(room.inviteCode, e)}
                          className="flex items-center gap-1 font-mono text-accent hover:underline cursor-pointer"
                          title="Click to copy invite code"
                        >
                          {copiedCode === room.inviteCode ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Code: {room.inviteCode}</span>
                        </button>
                      </div>
                    </div>

                    <Link href={`/rooms/${room.id}`} className="shrink-0">
                      <Button size="sm" variant="primary" className="whitespace-nowrap w-full sm:w-auto">
                        Enter Room
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Tasks (5 cols) */}
          <div className="lg:col-span-5 card-base p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Pending Tasks
                </h3>
              </div>
              <Link href="/tasks" className="text-xs text-accent hover:underline font-semibold">
                Manage All
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <div className="text-center py-10 text-xs text-foreground-muted card-subtle border-dashed">
                  No pending action items assigned to you.
                </div>
              ) : (
                tasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 card-subtle rounded-xl flex items-center justify-between text-xs gap-3 hover:border-accent/40 transition-all"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="text-foreground-muted hover:text-accent transition-colors shrink-0"
                        title={task.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Completed'}
                      >
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <span
                        className={`truncate ${
                          task.status === 'COMPLETED'
                            ? 'line-through text-foreground-muted'
                            : 'text-foreground font-medium'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <Badge
                      size="sm"
                      variant={
                        task.priority === 'URGENT'
                          ? 'danger'
                          : task.priority === 'HIGH'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
