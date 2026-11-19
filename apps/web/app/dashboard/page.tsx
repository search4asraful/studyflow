'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { useAuthStore } from '../../stores/authStore';
import { apiRequest } from '../../lib/api';
import { AnalyticsSummary, StudyRoom, Task } from '@studyflow/shared';
import { formatMinutes } from '../../lib/utils';
import {
  Flame,
  Clock,
  CheckCircle2,
  Timer,
  ArrowRight,
  Plus,
  Users,
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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analyticsData, roomsData, tasksData] = await Promise.all([
          apiRequest<AnalyticsSummary>('/analytics/summary').catch(() => null),
          apiRequest<StudyRoom[]>('/rooms').catch(() => []),
          apiRequest<Task[]>('/tasks/my').catch(() => []),
        ]);

        if (analyticsData) setAnalytics(analyticsData);
        if (roomsData) setRooms(roomsData);
        if (tasksData) setTasks(tasksData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 divider-subtle">
          <div>
            <h1 className="heading-page">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="subheading-page">
              Ready to focus? Join an active study session or track your milestones today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/rooms">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Users className="w-4 h-4" />
                Browse Rooms
              </Button>
            </Link>
            <Link href="/rooms/create">
              <Button variant="primary" size="sm" className="gap-1.5 font-semibold">
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak Card */}
          <div className="card-subtle p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span>Study Streak</span>
              <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {analytics?.currentStreakDays ?? 0}
              </span>
              <span className="text-xs text-foreground-muted">days active</span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-2">
              Consecutive days with at least 1 focus session
            </p>
          </div>

          {/* Today's Focus Card */}
          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span>Today&apos;s Focus</span>
              <div className="w-7 h-7 rounded-lg bg-accent-muted text-accent flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {formatMinutes(analytics?.todayFocusMinutes ?? 0)}
              </span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-2">
              Week total: {formatMinutes(analytics?.weekFocusMinutes ?? 0)}
            </p>
          </div>

          {/* Completed Pomodoros */}
          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span>Completed Sessions</span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {analytics?.completedPomodorosCount ?? 0}
              </span>
              <span className="text-xs text-foreground-muted">pomodoros</span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-2">Full cycles completed in study rooms</p>
          </div>

          {/* Tasks Completed */}
          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-3">
              <span>Tasks Completed</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
            <p className="text-[11px] text-foreground-secondary mt-2">Collaborative action items resolved</p>
          </div>
        </div>

        {/* Weekly Productivity Chart */}
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Weekly Productivity Overview
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">Focus minutes per day this week</p>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
            >
              Detailed Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full">
            {analytics?.weeklyTrend && analytics.weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-base)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}
                    itemStyle={{ color: 'var(--text-secondary)' }}
                    formatter={(val: any) => [`${val} minutes`, 'Focus Time']}
                  />
                  <Bar dataKey="focusMinutes" fill="var(--accent)" radius={[6, 6, 0, 0]} />
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
          <div className="lg:col-span-7 card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Active Study Rooms
              </h3>
              <Link href="/rooms" className="text-xs text-accent hover:underline font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="text-center py-8 text-xs text-foreground-muted card-subtle border-dashed">
                  You are not in any study rooms yet. Create or join one to begin!
                </div>
              ) : (
                rooms.slice(0, 3).map((room) => (
                  <div
                    key={room.id}
                    className="card-subtle p-4 hover:border-accent/40 rounded-2xl transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{room.name}</h4>
                        {room.isPrivate && <Badge size="sm">Private</Badge>}
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
                        <span className="font-mono text-accent">Code: {room.inviteCode}</span>
                      </div>
                    </div>

                    <Link href={`/rooms/${room.id}`}>
                      <Button size="sm" variant="primary" className="whitespace-nowrap">
                        Enter Room
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Tasks (5 cols) */}
          <div className="lg:col-span-5 card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Assigned Tasks
              </h3>
              <Link href="/tasks" className="text-xs text-accent hover:underline font-medium">
                My Tasks
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-foreground-muted card-subtle border-dashed">
                  No pending tasks assigned to you.
                </div>
              ) : (
                tasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 card-subtle rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-600 dark:bg-emerald-400'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-accent'
                            : 'bg-amber-500 dark:bg-amber-400'
                        }`}
                      />
                      <span
                        className={`truncate ${
                          task.status === 'COMPLETED'
                            ? 'line-through text-foreground-muted'
                            : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <Badge size="sm" variant={task.priority === 'URGENT' ? 'danger' : 'default'}>
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
