import { and, eq, gte, lte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';
import type { Priority, RecurrenceRule } from '@/db/schemas/task.schema';
import { tasks } from '@/db/schemas/task.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { skills } from '@/db/schemas/skill.schema';
import { skillMetrics } from '@/db/schemas/skill_metric.schema';
import { addWide } from '@/lib/logging/wideEventStore.server';
import { withDbError } from '@/db/withDbError';
import { startOfDay } from '@/lib/dates';
import { db } from '@/db/index';

/* ---------- Types ---------- */

export interface DashboardTaskMetric {
  id: string;
  name: string;
  unit: string | null;
  currentValue: number;
  targetValue: number;
}

export interface DashboardTask {
  id: string;
  name: string;
  description: string | null;
  priority: Priority;
  completed: boolean;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  subSkillId: string;
  skill: {
    name: string;
    color: string;
  } | null;
  subSkill: {
    name: string;
  } | null;
  metrics: Array<DashboardTaskMetric>;
}

export interface SkillSummary {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  totalSubSkills: number;
  completedSubSkills: number;
  inProgressSubSkills: number;
  subSkills: Array<{
    id: string;
    name: string;
    stage: SubSkillStage;
  }>;
}

export const dashboardRouter = {
  getTodaysTasks: protectedProcedure.query(
    async ({ ctx }): Promise<Array<DashboardTask>> => {
      try {
        const today = startOfDay(new Date());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch tasks with skill and subSkill info
        const taskRows = await withDbError('dashboard.getTodaysTasks', () =>
          db
            .select({
              id: tasks.id,
              name: tasks.name,
              description: tasks.description,
              priority: tasks.priority,
              completed: tasks.completed,
              recurrenceRule: tasks.recurrenceRule,
              subSkillId: tasks.subSkillId,
              skillName: skills.name,
              skillColor: skills.color,
              subSkillName: subSkills.name,
            })
            .from(tasks)
            .innerJoin(subSkills, eq(tasks.subSkillId, subSkills.id))
            .innerJoin(skills, eq(subSkills.skillId, skills.id))
            .where(
              and(
                eq(tasks.userId, ctx.userId),
                gte(tasks.todoListDate, today),
                lte(tasks.todoListDate, tomorrow),
              ),
            ),
        );

        // Fetch metrics for all subSkills in one query
        const subSkillIds = [...new Set(taskRows.map((t) => t.subSkillId))];
        const metricsRows =
          subSkillIds.length > 0
            ? await withDbError('dashboard.getTodaysMetrics', () =>
                db
                  .select()
                  .from(skillMetrics)
                  .where(eq(skillMetrics.userId, ctx.userId)),
              )
            : [];

        // Group metrics by subSkillId
        const metricsBySubSkillId = new Map<
          string,
          Array<DashboardTaskMetric>
        >();
        for (const metric of metricsRows) {
          const existing = metricsBySubSkillId.get(metric.subSkillId) ?? [];
          existing.push({
            id: metric.id,
            name: metric.name,
            unit: metric.unit,
            currentValue: metric.currentValue,
            targetValue: metric.targetValue,
          });
          metricsBySubSkillId.set(metric.subSkillId, existing);
        }

        // Transform to DashboardTask format
        const dashboardTasks: Array<DashboardTask> = taskRows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          priority: row.priority,
          completed: row.completed,
          isRecurring: row.recurrenceRule?.isRecurring ?? false,
          recurrenceRule: row.recurrenceRule,
          subSkillId: row.subSkillId,
          skill: {
            name: row.skillName,
            color: row.skillColor,
          },
          subSkill: {
            name: row.subSkillName,
          },
          metrics: metricsBySubSkillId.get(row.subSkillId) ?? [],
        }));

        addWide({ tasks_count: dashboardTasks.length });
        return dashboardTasks;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Failed to fetch today's tasks",
          cause: error,
        });
      }
    },
  ),
};
