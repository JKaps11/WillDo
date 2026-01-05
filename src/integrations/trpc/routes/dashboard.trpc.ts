import { and, eq, gte, lte } from 'drizzle-orm';
import { protectedProcedure } from '../init';
import type { SkillMetric } from '@/db/schemas/skill_metric.schema';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { Skill } from '@/db/schemas/skill.schema';
import type { Task } from '@/db/schemas/task.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { skillMetrics } from '@/db/schemas/skill_metric.schema';
import { skills } from '@/db/schemas/skill.schema';
import { tasks } from '@/db/schemas/task.schema';
import { startOfDay } from '@/utils/dates';
import { db } from '@/db/index';

export interface DashboardTask extends Task {
  subSkill: SubSkill | null;
  skill: Skill | null;
  metrics: Array<SkillMetric>;
}

export interface SkillSummary extends Skill {
  subSkills: Array<SubSkill>;
  totalSubSkills: number;
  completedSubSkills: number;
  inProgressSubSkills: number;
}

export const dashboardRouter = {
  /** GET /dashboard/todaysTasks - Get today's tasks with skill context */
  getTodaysTasks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's tasks
    const taskResults = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.todoListDate, today),
          lte(tasks.todoListDate, tomorrow),
        ),
      )
      .orderBy(tasks.createdAt);

    // Collect unique subSkillIds
    const subSkillIds = [
      ...new Set(
        taskResults
          .map((t) => t.subSkillId)
          .filter((id): id is string => id != null),
      ),
    ];

    if (subSkillIds.length === 0) {
      return taskResults.map(
        (task): DashboardTask => ({
          ...task,
          subSkill: null,
          skill: null,
          metrics: [],
        }),
      );
    }

    // Get sub-skills with their skills
    const subSkillResults = await db
      .select({
        subSkill: subSkills,
        skill: skills,
      })
      .from(subSkills)
      .innerJoin(skills, eq(subSkills.skillId, skills.id))
      .where(eq(subSkills.userId, userId));

    // Get metrics for these sub-skills
    const metricResults = await db
      .select()
      .from(skillMetrics)
      .where(eq(skillMetrics.userId, userId));

    // Build lookup maps
    const subSkillMap = new Map(subSkillResults.map((r) => [r.subSkill.id, r]));
    const metricsMap = new Map<string, Array<SkillMetric>>();
    for (const metric of metricResults) {
      const existing = metricsMap.get(metric.subSkillId) ?? [];
      existing.push(metric);
      metricsMap.set(metric.subSkillId, existing);
    }

    // Enrich tasks
    return taskResults.map((task): DashboardTask => {
      const subSkillData = task.subSkillId
        ? subSkillMap.get(task.subSkillId)
        : null;
      return {
        ...task,
        subSkill: subSkillData?.subSkill ?? null,
        skill: subSkillData?.skill ?? null,
        metrics: task.subSkillId ? (metricsMap.get(task.subSkillId) ?? []) : [],
      };
    });
  }),

  /** GET /dashboard/skillsSummary - Get all skills with sub-skill stage summary */
  getSkillsSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    // Get all non-archived skills
    const skillResults = await db
      .select()
      .from(skills)
      .where(and(eq(skills.userId, userId), eq(skills.archived, false)))
      .orderBy(skills.createdAt);

    if (skillResults.length === 0) {
      return [];
    }

    // Get all sub-skills for these skills
    const skillIds = skillResults.map((s) => s.id);
    const subSkillResults = await db
      .select()
      .from(subSkills)
      .where(eq(subSkills.userId, userId))
      .orderBy(subSkills.sortOrder);

    // Group sub-skills by skill and calculate stats
    const subSkillsBySkill = new Map<string, Array<SubSkill>>();
    for (const subSkill of subSkillResults) {
      if (skillIds.includes(subSkill.skillId)) {
        const existing = subSkillsBySkill.get(subSkill.skillId) ?? [];
        existing.push(subSkill);
        subSkillsBySkill.set(subSkill.skillId, existing);
      }
    }

    // Build skill summaries
    return skillResults.map((skill): SkillSummary => {
      const skillSubSkills = subSkillsBySkill.get(skill.id) ?? [];
      const completed = skillSubSkills.filter(
        (ss) => ss.stage === 'complete',
      ).length;
      const inProgress = skillSubSkills.filter((ss) =>
        ['practice', 'feedback', 'evaluate'].includes(ss.stage),
      ).length;

      return {
        ...skill,
        subSkills: skillSubSkills,
        totalSubSkills: skillSubSkills.length,
        completedSubSkills: completed,
        inProgressSubSkills: inProgress,
      };
    });
  }),

  /** GET /dashboard/stats - Get overall dashboard statistics */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's task counts
    const todaysTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.todoListDate, today),
          lte(tasks.todoListDate, tomorrow),
        ),
      );

    const totalTasks = todaysTasks.length;
    const completedTasks = todaysTasks.filter((t) => t.completed).length;

    // Get skill counts
    const skillResults = await db
      .select()
      .from(skills)
      .where(and(eq(skills.userId, userId), eq(skills.archived, false)));

    const totalSkills = skillResults.length;

    // Get sub-skill stage counts
    const subSkillResults = await db
      .select()
      .from(subSkills)
      .where(eq(subSkills.userId, userId));

    const totalSubSkills = subSkillResults.length;
    const completedSubSkills = subSkillResults.filter(
      (ss) => ss.stage === 'complete',
    ).length;

    return {
      today: {
        total: totalTasks,
        completed: completedTasks,
        remaining: totalTasks - completedTasks,
      },
      skills: {
        total: totalSkills,
      },
      subSkills: {
        total: totalSubSkills,
        completed: completedSubSkills,
        inProgress: subSkillResults.filter((ss) =>
          ['practice', 'feedback', 'evaluate'].includes(ss.stage),
        ).length,
      },
    };
  }),
};
