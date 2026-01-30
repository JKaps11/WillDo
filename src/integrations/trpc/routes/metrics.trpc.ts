import {
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  startOfDay,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';

import { protectedProcedure } from '../init';
import type {
  TimeSeriesPoint,
  UserMetricsResponse,
} from '@/lib/zod-schemas/metrics';
import { addWide } from '@/lib/logging/wideEventStore.server';
import { completionEventRepository } from '@/db/repositories/completion_event.repository';
import { userMetricsRepository } from '@/db/repositories/user_metrics.repository';
import { insightsRepository } from '@/db/repositories/insights.repository';
import { getLevelProgress } from '@/lib/constants/xp';
import {
  getTimeSeriesSchema,
  updateWeeklyGoalSchema,
} from '@/lib/zod-schemas/metrics';

/* ---------- Router ---------- */

export const metricsRouter = {
  /**
   * Get user's aggregate metrics including computed fields.
   */
  getUserMetrics: protectedProcedure.query(
    async ({ ctx }): Promise<UserMetricsResponse> => {
      // Ensure metrics exist and reset weekly if needed
      await userMetricsRepository.upsert(ctx.userId);
      await userMetricsRepository.resetWeeklyIfNeeded(ctx.userId);

      const metrics = await userMetricsRepository.findByUserId(ctx.userId);

      if (!metrics) {
        // Should never happen after upsert, but handle gracefully
        addWide({ metrics_not_found: true });
        return getDefaultMetrics();
      }

      addWide({
        current_streak: metrics.currentStreak,
        level: getLevelProgress(metrics.totalXp).level,
      });

      const levelInfo = getLevelProgress(metrics.totalXp);

      // Calculate completion rate
      const completionRate =
        metrics.tasksCreated > 0
          ? Math.round((metrics.tasksCompleted / metrics.tasksCreated) * 100)
          : 0;

      // Calculate average tasks per day (last 30 days approximation)
      const avgTasksPerDay =
        metrics.tasksCompleted > 0
          ? Math.round((metrics.tasksCompleted / 30) * 10) / 10
          : 0;

      return {
        tasksCompleted: metrics.tasksCompleted,
        tasksCreated: metrics.tasksCreated,
        subSkillsCompleted: metrics.subSkillsCompleted,
        skillsArchived: metrics.skillsArchived,
        currentStreak: metrics.currentStreak,
        bestStreak: metrics.bestStreak,
        weeklyGoal: metrics.weeklyGoal,
        weeklyCompleted: metrics.weeklyCompleted,
        totalXp: metrics.totalXp,
        level: levelInfo.level,
        xpForCurrentLevel: levelInfo.xpForCurrentLevel,
        xpForNextLevel: levelInfo.xpForNextLevel,
        levelProgress: levelInfo.progress,
        completionRate,
        avgTasksPerDay,
      };
    },
  ),

  /**
   * Get time series data for charts.
   */
  getTimeSeries: protectedProcedure
    .input(getTimeSeriesSchema)
    .query(async ({ ctx, input }) => {
      const today = startOfDay(new Date());
      let startDate: Date;
      const endDate: Date = new Date(); // Include today fully

      addWide({ period: input.period });

      switch (input.period) {
        case 'week':
          startDate = subDays(today, 6); // Last 7 days including today
          return getTimeSeriesWithFilledDays(
            ctx.userId,
            startDate,
            endDate,
            'day',
          );

        case 'month':
          startDate = subDays(today, 29); // Last 30 days including today
          return getTimeSeriesWithFilledDays(
            ctx.userId,
            startDate,
            endDate,
            'day',
          );

        case 'year':
          startDate = subMonths(today, 11); // Last 12 months
          startDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            1,
          );
          return getTimeSeriesWithFilledMonths(ctx.userId, startDate, endDate);

        default:
          input.period satisfies never;
      }
    }),

  /**
   * Get insights for creator analytics.
   */
  getInsights: protectedProcedure.query(async ({ ctx }) => {
    const insights = await insightsRepository.getInsights(ctx.userId);
    addWide({ insights_fetched: true });
    return insights;
  }),

  /**
   * Update user's weekly goal.
   */
  updateWeeklyGoal: protectedProcedure
    .input(updateWeeklyGoalSchema)
    .mutation(async ({ ctx, input }) => {
      await userMetricsRepository.upsert(ctx.userId);
      const result = await userMetricsRepository.updateWeeklyGoal(
        ctx.userId,
        input.weeklyGoal,
      );
      addWide({ new_weekly_goal: input.weeklyGoal });
      return result;
    }),
};

/* ---------- Helpers ---------- */

function getDefaultMetrics(): UserMetricsResponse {
  return {
    tasksCompleted: 0,
    tasksCreated: 0,
    subSkillsCompleted: 0,
    skillsArchived: 0,
    currentStreak: 0,
    bestStreak: 0,
    weeklyGoal: 10,
    weeklyCompleted: 0,
    totalXp: 0,
    level: 0,
    xpForCurrentLevel: 0,
    xpForNextLevel: 100,
    levelProgress: 0,
    completionRate: 0,
    avgTasksPerDay: 0,
  };
}

/**
 * Get time series data with all days filled (including zeros).
 */
async function getTimeSeriesWithFilledDays(
  userId: string,
  startDate: Date,
  endDate: Date,
  _granularity: 'day',
): Promise<Array<TimeSeriesPoint>> {
  const data = await completionEventRepository.getTimeSeriesByDay(
    userId,
    startDate,
    endDate,
  );

  // Create a map for quick lookup
  const dataMap = new Map<string, TimeSeriesPoint>();
  for (const point of data) {
    dataMap.set(point.date, point);
  }

  // Generate all days in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = dataMap.get(dateStr);
    return existing ?? { date: dateStr, tasks: 0, subSkills: 0, skills: 0 };
  });
}

/**
 * Get time series data with all months filled (including zeros).
 */
async function getTimeSeriesWithFilledMonths(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<Array<TimeSeriesPoint>> {
  const data = await completionEventRepository.getTimeSeriesByMonth(
    userId,
    startDate,
    endDate,
  );

  // Create a map for quick lookup
  const dataMap = new Map<string, TimeSeriesPoint>();
  for (const point of data) {
    dataMap.set(point.date, point);
  }

  // Generate all months in the range
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  return months.map((month) => {
    const monthStr = format(month, 'yyyy-MM');
    const existing = dataMap.get(monthStr);
    return existing ?? { date: monthStr, tasks: 0, subSkills: 0, skills: 0 };
  });
}
