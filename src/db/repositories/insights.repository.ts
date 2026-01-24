import { and, count, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { startOfDay, subDays } from 'date-fns';

import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';
import { db } from '@/db/index';
import { tasks } from '@/db/schemas/task.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { skills } from '@/db/schemas/skill.schema';
import { skillMetrics } from '@/db/schemas/skill_metric.schema';
import { completionEvents } from '@/db/schemas/completion_event.schema';
import { withDbError } from '@/db/withDbError';

/* ---------- Types ---------- */

export interface SkillEngagement {
  skillId: string;
  skillName: string;
  skillColor: string;
  count: number;
}

export interface StageProgression {
  stage: SubSkillStage;
  avgDays: number | null;
}

export interface FeatureUsage {
  metricsUsage: number;
  recurrenceUsage: number;
}

export interface Insights {
  avgTimeToCompletion: number | null;
  abandonmentRate: number;
  mostProductiveDay: string | null;
  skillEngagement: Array<SkillEngagement>;
  recurrenceEffectiveness: number | null;
  subSkillProgressionRate: Array<StageProgression>;
  featureUsage: FeatureUsage;
}

/* ---------- Repository ---------- */

export const insightsRepository = {
  /**
   * Get all insights for a user.
   */
  getInsights: async (userId: string): Promise<Insights> => {
    const [
      avgTimeToCompletion,
      abandonmentRate,
      mostProductiveDay,
      skillEngagement,
      recurrenceEffectiveness,
      subSkillProgressionRate,
      featureUsage,
    ] = await Promise.all([
      insightsRepository.getAvgTimeToCompletion(userId),
      insightsRepository.getAbandonmentRate(userId),
      insightsRepository.getMostProductiveDay(userId),
      insightsRepository.getSkillEngagement(userId),
      insightsRepository.getRecurrenceEffectiveness(userId),
      insightsRepository.getSubSkillProgressionRate(userId),
      insightsRepository.getFeatureUsage(userId),
    ]);

    return {
      avgTimeToCompletion,
      abandonmentRate,
      mostProductiveDay,
      skillEngagement,
      recurrenceEffectiveness,
      subSkillProgressionRate,
      featureUsage,
    };
  },

  /**
   * Average days from task creation to completion.
   */
  getAvgTimeToCompletion: async (userId: string): Promise<number | null> => {
    return withDbError('insights.getAvgTimeToCompletion', async () => {
      const result = await db
        .select({
          avgDays: sql<number | null>`AVG(
            EXTRACT(EPOCH FROM (${completionEvents.completedAt} - ${tasks.createdAt})) / 86400
          )`.as('avg_days'),
        })
        .from(completionEvents)
        .innerJoin(tasks, eq(completionEvents.entityId, tasks.id))
        .where(
          and(
            eq(completionEvents.userId, userId),
            eq(completionEvents.eventType, 'task_completed'),
          ),
        );

      const avgDays = result[0]?.avgDays;
      if (avgDays == null) return null;
      return Math.round(avgDays * 10) / 10;
    });
  },

  /**
   * Percentage of tasks created >30 days ago that are not completed.
   */
  getAbandonmentRate: async (userId: string): Promise<number> => {
    return withDbError('insights.getAbandonmentRate', async () => {
      const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);

      const result = await db
        .select({
          total: count(),
          abandoned:
            sql<number>`COUNT(*) FILTER (WHERE ${tasks.completed} = false)`.as(
              'abandoned',
            ),
        })
        .from(tasks)
        .where(
          and(eq(tasks.userId, userId), lt(tasks.createdAt, thirtyDaysAgo)),
        );

      const { total, abandoned } = result[0] ?? { total: 0, abandoned: 0 };
      if (total === 0) return 0;

      return Math.round((abandoned / total) * 100);
    });
  },

  /**
   * Day of week with most completions.
   */
  getMostProductiveDay: async (userId: string): Promise<string | null> => {
    return withDbError('insights.getMostProductiveDay', async () => {
      const result = await db
        .select({
          dayOfWeek:
            sql<number>`EXTRACT(DOW FROM ${completionEvents.completedAt})`.as(
              'day_of_week',
            ),
          count: count(),
        })
        .from(completionEvents)
        .where(eq(completionEvents.userId, userId))
        .groupBy(sql`EXTRACT(DOW FROM ${completionEvents.completedAt})`)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(1);

      if (!result[0]) return null;

      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      return dayNames[result[0].dayOfWeek] ?? null;
    });
  },

  /**
   * Completion counts grouped by skill.
   */
  getSkillEngagement: async (
    userId: string,
  ): Promise<Array<SkillEngagement>> => {
    return withDbError('insights.getSkillEngagement', async () => {
      const result = await db
        .select({
          skillId: skills.id,
          skillName: skills.name,
          skillColor: skills.color,
          count: count(),
        })
        .from(completionEvents)
        .innerJoin(skills, eq(completionEvents.skillId, skills.id))
        .where(eq(completionEvents.userId, userId))
        .groupBy(skills.id, skills.name, skills.color)
        .orderBy(sql`COUNT(*) DESC`);

      return result;
    });
  },

  /**
   * Percentage of recurring tasks that get completed.
   */
  getRecurrenceEffectiveness: async (
    userId: string,
  ): Promise<number | null> => {
    return withDbError('insights.getRecurrenceEffectiveness', async () => {
      const result = await db
        .select({
          total: count(),
          completed:
            sql<number>`COUNT(*) FILTER (WHERE ${tasks.completed} = true)`.as(
              'completed',
            ),
        })
        .from(tasks)
        .where(and(eq(tasks.userId, userId), isNotNull(tasks.recurrenceRule)));

      const { total, completed } = result[0] ?? { total: 0, completed: 0 };
      if (total === 0) return null;

      return Math.round((completed / total) * 100);
    });
  },

  /**
   * Average time spent in each subskill stage.
   * Note: This is approximate since we don't track stage transitions.
   */
  getSubSkillProgressionRate: async (
    userId: string,
  ): Promise<Array<StageProgression>> => {
    return withDbError('insights.getSubSkillProgressionRate', async () => {
      // Since we don't have stage transition timestamps, we can only
      // calculate for completed subskills: time from creation to completion
      const result = await db
        .select({
          stage: subSkills.stage,
          count: count(),
        })
        .from(subSkills)
        .where(eq(subSkills.userId, userId))
        .groupBy(subSkills.stage);

      // Return distribution instead of timing (we don't have transition data)
      return result.map((r) => ({
        stage: r.stage,
        avgDays: null, // Would need stage transition tracking
      }));
    });
  },

  /**
   * Percentage of tasks using recurrence and subskills using metrics.
   */
  getFeatureUsage: async (userId: string): Promise<FeatureUsage> => {
    return withDbError('insights.getFeatureUsage', async () => {
      // Count tasks with recurrence
      const tasksResult = await db
        .select({
          total: count(),
          withRecurrence:
            sql<number>`COUNT(*) FILTER (WHERE ${tasks.recurrenceRule} IS NOT NULL)`.as(
              'with_recurrence',
            ),
        })
        .from(tasks)
        .where(eq(tasks.userId, userId));

      const { total: taskTotal, withRecurrence } = tasksResult[0] ?? {
        total: 0,
        withRecurrence: 0,
      };

      // Count subskills with at least one metric
      const subSkillsWithMetrics = await db
        .select({
          total: count(subSkills.id).as('total'),
          withMetrics:
            sql<number>`COUNT(DISTINCT ${skillMetrics.subSkillId})`.as(
              'with_metrics',
            ),
        })
        .from(subSkills)
        .leftJoin(skillMetrics, eq(subSkills.id, skillMetrics.subSkillId))
        .where(eq(subSkills.userId, userId));

      const { total: subSkillTotal, withMetrics } = subSkillsWithMetrics[0] ?? {
        total: 0,
        withMetrics: 0,
      };

      return {
        metricsUsage:
          subSkillTotal > 0
            ? Math.round((withMetrics / subSkillTotal) * 100)
            : 0,
        recurrenceUsage:
          taskTotal > 0 ? Math.round((withRecurrence / taskTotal) * 100) : 0,
      };
    });
  },
};
