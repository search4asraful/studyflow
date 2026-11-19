'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { apiRequest } from '../../lib/api';
import { AnalyticsSummary } from '@studyflow/shared';
import { formatMinutes } from '../../lib/utils';
import { Flame, Clock, Timer, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
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
    async function loadAnalytics() {
      try {
        const summary = await apiRequest<AnalyticsSummary>('/analytics/summary');
        setData(summary);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const PIE_COLORS = ['#3F72AF', '#0EA5E9', '#10B981'];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 divider-subtle">
          <div>
            <h1 className="heading-page">
              Productivity Analytics
            </h1>
            <p className="subheading-page">
              Real-time calculations based on completed Pomodoro sessions and resolved tasks.
            </p>
          </div>
          <div className="flex items-center gap-2 card-subtle px-4 py-2 text-xs font-mono text-foreground-secondary">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>Last 30 Days Activity</span>
          </div>
        </div>

        {/* 4 Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span>Current Streak</span>
              <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {data?.currentStreakDays ?? 0}{' '}
              <span className="text-xs font-sans text-foreground-muted">days</span>
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">Unbroken daily focus habit</p>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span>Month&apos;s Focused Time</span>
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {formatMinutes(data?.monthFocusMinutes ?? 0)}
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">
              Today: {formatMinutes(data?.todayFocusMinutes ?? 0)}
            </p>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span>Pomodoro Sessions</span>
              <Timer className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {data?.completedPomodorosCount ?? 0}
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">Full 25-minute intervals</p>
          </div>

          <div className="card-subtle p-5">
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
              <span>Task Completion Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {data?.taskCompletionRate ?? 0}%
            </div>
            <p className="text-[11px] text-foreground-secondary mt-1.5">
              {data?.tasksCompletedCount ?? 0} tasks finished
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Trend Area Chart */}
            <div className="card-base p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Daily Focus Trend (Past 7 Days)
                  </h3>
                  <p className="text-xs text-foreground-muted mt-0.5">
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
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}
                        itemStyle={{ color: 'var(--text-secondary)' }}
                        formatter={(val: any) => [`${val} minutes`, 'Focus Time']}
                      />
                      <Area
                        type="monotone"
                        dataKey="focusMinutes"
                        stroke="var(--accent)"
                        strokeWidth={2}
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

            {/* Two-Column Grid: Weekly Day Distribution + Focus vs Breaks Ratio */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Weekly Day Distribution (7 cols) */}
              <div className="lg:col-span-7 card-base p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-1">
                  Weekly Focus Breakdown
                </h3>
                <p className="text-xs text-foreground-muted mb-6">Total focused minutes by day of week</p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.weeklyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      />
                      <Bar dataKey="focusMinutes" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Focus vs Breaks Ratio (5 cols) */}
              <div className="lg:col-span-5 card-base p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-1">
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
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                        >
                          {(data?.focusDistribution || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
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
                          formatter={(val: any) => [`${val} minutes`, 'Duration']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 divider-subtle text-xs">
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
