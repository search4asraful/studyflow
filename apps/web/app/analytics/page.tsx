'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import {
  apiRequest,
  cachedApiRequest,
  subscribeToRevalidation,
} from '../../lib/api';
import { AnalyticsSummary } from '@studyflow/shared';
import { formatMinutes } from '../../lib/utils';
import {
  Flame,
  Clock,
  Timer,
  CheckCircle2,
  Calendar,
  Loader2,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        const summary = await cachedApiRequest<AnalyticsSummary>('/analytics/summary');
        if (active) {
          setData(summary);
          setLoading(false);
        }
      } catch {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadAnalytics();

    const unsub = subscribeToRevalidation<AnalyticsSummary>('/analytics/summary', (fresh) => {
      if (active && fresh) setData(fresh);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const PIE_COLORS = ['#3F72AF', '#0EA5E9', '#10B981', '#8B5CF6'];

  // Calculate a composite "Flow Index Score" (0-100)
  const streak = data?.currentStreakDays ?? 0;
  const pomodoros = data?.completedPomodorosCount ?? 0;
  const taskRate = data?.taskCompletionRate ?? 0;
  const flowScore = Math.min(100, Math.round(streak * 8 + pomodoros * 5 + taskRate * 0.4));

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="heading-page">Productivity Analytics</h1>
            <p className="subheading-page">
              Derived from completed Pomodoro sessions, focus durations, and resolved collaborative tasks.
            </p>
          </div>
          <div className="flex items-center gap-2 card-subtle px-4 py-2 text-xs font-mono text-foreground-secondary border-accent/30">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>Past 30 Days Telemetry</span>
          </div>
        </div>

        {/* Productivity Flow Score Highlight Banner */}
        <div className="card-glass p-6 sm:p-8 relative overflow-hidden border-accent/25">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
                  Cognitive Velocity Score
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Flow Index: <span className="text-accent">{flowScore}/100</span>
              </h2>
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                {flowScore > 75
                  ? 'Outstanding focus discipline! Your consecutive session streak and high completion rate place you in peak study flow.'
                  : flowScore > 40
                  ? 'Consistent progress! Keep completing full 25-minute Pomodoro cycles to build an unbreakable study habit.'
                  : 'Start your study streak today! Join an active room to begin recording authoritative focus minutes.'}
              </p>
            </div>

            <div className="card-subtle p-4 rounded-2xl flex items-center gap-4 bg-surface-elevated/90 border-accent/30 shadow-xs">
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted block">
                  30-Day Completion
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {data?.taskCompletionRate ?? 0}%
                </span>
                <span className="text-[10px] text-foreground-muted block">
                  {data?.tasksCompletedCount ?? 0} tasks resolved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-interactive p-5 group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span className="font-semibold">Current Streak</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {data?.currentStreakDays ?? 0}{' '}
              <span className="text-xs font-sans text-foreground-muted font-normal">days</span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">Unbroken daily focus habit</p>
          </div>

          <div className="card-interactive p-5 group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span className="font-semibold">Month&apos;s Focus Time</span>
              <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {formatMinutes(data?.monthFocusMinutes ?? 0)}
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">
              Today: {formatMinutes(data?.todayFocusMinutes ?? 0)}
            </p>
          </div>

          <div className="card-interactive p-5 group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span className="font-semibold">Completed Sessions</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {data?.completedPomodorosCount ?? 0}
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">Full Pomodoro cycles</p>
          </div>

          <div className="card-interactive p-5 group">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span className="font-semibold">Task Resolution Rate</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {data?.taskCompletionRate ?? 0}%
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">
              {data?.tasksCompletedCount ?? 0} tasks finished
            </p>
          </div>
        </div>

        {/* Charts Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Trend Area Chart */}
            <div className="card-base p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Daily Focus Trend (Past 7 Days)
                  </h3>
                  <p className="text-xs text-foreground-muted mt-1">
                    Minutes focused per day in collaborative study rooms
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                {data?.dailyTrend && data.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.dailyTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
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
                      <Area
                        type="monotone"
                        dataKey="focusMinutes"
                        stroke="var(--accent)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#focusGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-foreground-muted">
                    No historical sessions found.
                  </div>
                )}
              </div>
            </div>

            {/* Two-Column Grid: Weekly Day Breakdown + Focus vs Break Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Weekly Day Distribution (7 cols) */}
              <div className="lg:col-span-7 card-base p-6 sm:p-7">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">
                  Weekly Day Distribution
                </h3>
                <p className="text-xs text-foreground-muted mb-6">Total focused minutes by day of week</p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="m" />
                      <Tooltip
                        cursor={false}
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
                      <Bar
                        dataKey="focusMinutes"
                        fill="var(--accent)"
                        radius={[8, 8, 0, 0]}
                        activeBar={{ fill: 'var(--accent-hover, #5084c3)' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Focus vs Breaks Ratio (5 cols) */}
              <div className="lg:col-span-5 card-base p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">
                    Focus vs Break Allocation
                  </h3>
                  <p className="text-xs text-foreground-muted mb-4">Minutes allocated in study rooms</p>

                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.focusDistribution || []}
                          dataKey="minutes"
                          nameKey="phase"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={6}
                        >
                          {(data?.focusDistribution || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
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
                          formatter={(val: any) => [`${val} minutes`, 'Duration']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-foreground-secondary">Focus Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500" />
                    <span className="text-foreground-secondary">Break Time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
