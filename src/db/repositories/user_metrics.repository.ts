import { eq, sql } from 'drizzle-orm';
import {
  differenceInCalendarDays,
  isBefore,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';

import { completionEventRepository } from './completion_event.repository';
import type {UserMetrics} from '@/db/schemas/user_metrics.schema';
import { db } from '@/db/index';
import {
  
  userMetrics
} from '@/db/schemas/user_metrics.schema';
import { withDbError } from '@/db/withDbError';

/* ---------- Repository ---------- */

export const userMetricsRepository = {
  findByUserId: async (userId: string): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.findByUserId', async () => {
      const result = await db
        .select()
        .from(userMetrics)
        .where(eq(userMetrics.userId, userId))
        .limit(1);

      return result[0] ?? null;
    });
  },

  /**
   * Create metrics row if it doesn't exist, return existing if it does.
   */
  upsert: async (userId: string): Promise<UserMetrics> => {
    return withDbError('userMetrics.upsert', async () => {
      const existing = await db
        .select()
        .from(userMetrics)
        .where(eq(userMetrics.userId, userId))
        .limit(1);

      if (existing[0]) {
        return existing[0];
      }

      const today = startOfDay(new Date());
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

      const result = await db
        .insert(userMetrics)
        .values({
          userId,
          weekStartDate: weekStart,
        })
        .returning();

      return result[0];
    });
  },

  /* ---------- Increment Operations ---------- */

  incrementTasksCompleted: async (
    userId: string,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.incrementTasksCompleted', async () => {
      await ensureMetricsExist(userId);
      const result = await db
        .update(userMetrics)
        .set({
          tasksCompleted: sql`${userMetrics.tasksCompleted} + 1`,
          weeklyCompleted: sql`${userMetrics.weeklyCompleted} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  decrementTasksCompleted: async (
    userId: string,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.decrementTasksCompleted', async () => {
      const result = await db
        .update(userMetrics)
        .set({
          tasksCompleted: sql`GREATEST(${userMetrics.tasksCompleted} - 1, 0)`,
          weeklyCompleted: sql`GREATEST(${userMetrics.weeklyCompleted} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  incrementSubSkillsCompleted: async (
    userId: string,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.incrementSubSkillsCompleted', async () => {
      await ensureMetricsExist(userId);
      const result = await db
        .update(userMetrics)
        .set({
          subSkillsCompleted: sql`${userMetrics.subSkillsCompleted} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  decrementSubSkillsCompleted: async (
    userId: string,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.decrementSubSkillsCompleted', async () => {
      const result = await db
        .update(userMetrics)
        .set({
          subSkillsCompleted: sql`GREATEST(${userMetrics.subSkillsCompleted} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  incrementSkillsArchived: async (
    userId: string,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.incrementSkillsArchived', async () => {
      await ensureMetricsExist(userId);
      const result = await db
        .update(userMetrics)
        .set({
          skillsArchived: sql`${userMetrics.skillsArchived} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  decrementSkillsArchived: async (
    userId: string,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.decrementSkillsArchived', async () => {
      const result = await db
        .update(userMetrics)
        .set({
          skillsArchived: sql`GREATEST(${userMetrics.skillsArchived} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  incrementTasksCreated: async (userId: string): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.incrementTasksCreated', async () => {
      await ensureMetricsExist(userId);
      const result = await db
        .update(userMetrics)
        .set({
          tasksCreated: sql`${userMetrics.tasksCreated} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  /* ---------- Streak Management ---------- */

  /**
   * Update streak after a completion. Call this on every completion.
   */
  updateStreak: async (userId: string): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.updateStreak', async () => {
      const metrics = await userMetricsRepository.findByUserId(userId);
      if (!metrics) return null;

      const today = startOfDay(new Date());
      const lastActivity = metrics.lastActivityDate
        ? startOfDay(new Date(metrics.lastActivityDate))
        : null;

      let newStreak = metrics.currentStreak;

      if (!lastActivity) {
        // First activity ever
        newStreak = 1;
      } else {
        const daysDiff = differenceInCalendarDays(today, lastActivity);

        if (daysDiff === 0) {
          // Same day, no change to streak
          return metrics;
        } else if (daysDiff === 1) {
          // Consecutive day, increment streak
          newStreak = metrics.currentStreak + 1;
        } else {
          // Gap in activity, reset streak
          newStreak = 1;
        }
      }

      const newBestStreak = Math.max(newStreak, metrics.bestStreak);

      const result = await db
        .update(userMetrics)
        .set({
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          lastActivityDate: today,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  /**
   * Recalculate streak after an uncomplete. This may break the streak.
   */
  recalculateStreak: async (userId: string): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.recalculateStreak', async () => {
      const today = startOfDay(new Date());
      const lookbackStart = subDays(today, 365); // Look back up to a year

      // Get all activity dates
      const activityDates =
        await completionEventRepository.getActivityDates(
          userId,
          lookbackStart,
          new Date(),
        );

      if (activityDates.length === 0) {
        // No activity, reset everything
        const result = await db
          .update(userMetrics)
          .set({
            currentStreak: 0,
            lastActivityDate: null,
            updatedAt: new Date(),
          })
          .where(eq(userMetrics.userId, userId))
          .returning();

        return result[0] ?? null;
      }

      // Sort dates descending (most recent first)
      activityDates.sort((a, b) => b.getTime() - a.getTime());

      // Calculate current streak from today backwards
      let streak = 0;
      let checkDate = today;

      for (const activityDate of activityDates) {
        const daysDiff = differenceInCalendarDays(checkDate, activityDate);

        if (daysDiff === 0) {
          // Activity on check date
          streak++;
          checkDate = subDays(checkDate, 1);
        } else if (daysDiff === 1) {
          // Activity is one day before check date (consecutive)
          streak++;
          checkDate = activityDate;
          checkDate = subDays(checkDate, 1);
        } else {
          // Gap found, stop counting
          break;
        }
      }

      const lastActivityDate = activityDates[0];

      const result = await db
        .update(userMetrics)
        .set({
          currentStreak: streak,
          lastActivityDate,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  /* ---------- XP Operations ---------- */

  addXp: async (userId: string, amount: number): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.addXp', async () => {
      const result = await db
        .update(userMetrics)
        .set({
          totalXp: sql`${userMetrics.totalXp} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  removeXp: async (
    userId: string,
    amount: number,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.removeXp', async () => {
      const result = await db
        .update(userMetrics)
        .set({
          totalXp: sql`GREATEST(${userMetrics.totalXp} - ${amount}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },

  /* ---------- Weekly Operations ---------- */

  /**
   * Reset weekly counter if we're in a new week.
   */
  resetWeeklyIfNeeded: async (userId: string): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.resetWeeklyIfNeeded', async () => {
      const metrics = await userMetricsRepository.findByUserId(userId);
      if (!metrics) return null;

      const today = startOfDay(new Date());
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

      const storedWeekStart = metrics.weekStartDate
        ? startOfDay(new Date(metrics.weekStartDate))
        : null;

      // If stored week is before current week, reset
      if (!storedWeekStart || isBefore(storedWeekStart, currentWeekStart)) {
        const result = await db
          .update(userMetrics)
          .set({
            weeklyCompleted: 0,
            weekStartDate: currentWeekStart,
            updatedAt: new Date(),
          })
          .where(eq(userMetrics.userId, userId))
          .returning();

        return result[0] ?? null;
      }

      return metrics;
    });
  },

  updateWeeklyGoal: async (
    userId: string,
    weeklyGoal: number,
  ): Promise<UserMetrics | null> => {
    return withDbError('userMetrics.updateWeeklyGoal', async () => {
      const result = await db
        .update(userMetrics)
        .set({
          weeklyGoal,
          updatedAt: new Date(),
        })
        .where(eq(userMetrics.userId, userId))
        .returning();

      return result[0] ?? null;
    });
  },
};

/* ---------- Helpers ---------- */

async function ensureMetricsExist(userId: string): Promise<void> {
  const existing = await userMetricsRepository.findByUserId(userId);
  if (!existing) {
    await userMetricsRepository.upsert(userId);
  }
}
