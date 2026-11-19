import { prisma } from '../config/prisma';
import { AnalyticsSummary } from '../shared';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  format,
  isSameDay,
} from 'date-fns';
import { TimerPhase } from '@prisma/client';

export class AnalyticsService {
  static async getUserAnalytics(userId: string): Promise<AnalyticsSummary> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    const monthStart = startOfMonth(now);

    // Fetch all Pomodoro records for this user in the last 30 days
    const past30DaysStart = subDays(todayStart, 30);
    const records = await prisma.pomodoroRecord.findMany({
      where: {
        userId,
        completedAt: { gte: past30DaysStart },
      },
      orderBy: { completedAt: 'asc' },
    });

    // 1. Calculate Today, Week, Month focus minutes
    let todayFocusMinutes = 0;
    let weekFocusMinutes = 0;
    let monthFocusMinutes = 0;
    let completedPomodorosCount = 0;
    let focusPhaseMinutes = 0;
    let breakPhaseMinutes = 0;

    records.forEach((record) => {
      const isFocus = record.phase === TimerPhase.FOCUS;
      if (isFocus) {
        completedPomodorosCount++;
        focusPhaseMinutes += record.durationMinutes;

        if (record.completedAt >= todayStart) {
          todayFocusMinutes += record.durationMinutes;
        }
        if (record.completedAt >= weekStart) {
          weekFocusMinutes += record.durationMinutes;
        }
        if (record.completedAt >= monthStart) {
          monthFocusMinutes += record.durationMinutes;
        }
      } else {
        breakPhaseMinutes += record.durationMinutes;
      }
    });

    // 2. Calculate Current Study Streak
    // A streak requires at least 1 focus pomodoro per calendar day.
    const uniqueStudyDays = Array.from(
      new Set(
        records
          .filter((r) => r.phase === TimerPhase.FOCUS)
          .map((r) => format(r.completedAt, 'yyyy-MM-dd'))
      )
    ).sort((a, b) => b.localeCompare(a)); // Descending dates

    let currentStreakDays = 0;
    if (uniqueStudyDays.length > 0) {
      const todayStr = format(now, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(now, 1), 'yyyy-MM-dd');

      // If user studied today or yesterday, streak is currently active
      if (uniqueStudyDays[0] === todayStr || uniqueStudyDays[0] === yesterdayStr) {
        currentStreakDays = 1;
        let expectedDate = subDays(new Date(uniqueStudyDays[0]), 1);

        for (let i = 1; i < uniqueStudyDays.length; i++) {
          const expectedStr = format(expectedDate, 'yyyy-MM-dd');
          if (uniqueStudyDays[i] === expectedStr) {
            currentStreakDays++;
            expectedDate = subDays(expectedDate, 1);
          } else {
            break;
          }
        }
      }
    }

    // 3. Daily trend for the past 7 days
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, 'MMM d');
      const dayRecords = records.filter(
        (r) => isSameDay(r.completedAt, day) && r.phase === TimerPhase.FOCUS
      );

      const focusMinutes = dayRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
      dailyTrend.push({
        date: dayStr,
        focusMinutes,
        completedPomodoros: dayRecords.length,
      });
    }

    // 4. Weekly Trend (Monday - Sunday)
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyTrend = daysOfWeek.map((dayName, idx) => {
      // Days relative to startOfWeek (Monday)
      const dayDate = subDays(now, (now.getDay() + 6) % 7 - idx);
      const dayRecords = records.filter(
        (r) => isSameDay(r.completedAt, dayDate) && r.phase === TimerPhase.FOCUS
      );
      return {
        day: dayName,
        focusMinutes: dayRecords.reduce((sum, r) => sum + r.durationMinutes, 0),
      };
    });

    // 5. Tasks Metrics
    const userTasks = await prisma.task.findMany({
      where: {
        OR: [{ assigneeId: userId }, { createdById: userId }],
      },
    });

    const tasksCompletedCount = userTasks.filter((t) => t.status === 'COMPLETED').length;
    const taskCompletionRate =
      userTasks.length > 0 ? Math.round((tasksCompletedCount / userTasks.length) * 100) : 0;

    return {
      todayFocusMinutes,
      weekFocusMinutes,
      monthFocusMinutes,
      completedPomodorosCount,
      tasksCompletedCount,
      currentStreakDays,
      dailyTrend,
      weeklyTrend,
      taskCompletionRate,
      focusDistribution: [
        { phase: 'Focus', minutes: focusPhaseMinutes },
        { phase: 'Breaks', minutes: breakPhaseMinutes },
      ],
    };
  }
}
