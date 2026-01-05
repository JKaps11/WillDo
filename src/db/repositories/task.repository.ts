import { and, eq, isNull } from 'drizzle-orm';
import type { SkillMetric } from '@/db/schemas/skill_metric.schema';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { NewTask, Task } from '@/db/schemas/task.schema';
import type { Skill } from '@/db/schemas/skill.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { skillMetrics } from '@/db/schemas/skill_metric.schema';
import { skills } from '@/db/schemas/skill.schema';
import { tasks } from '@/db/schemas/task.schema';
import { db } from '@/db/index';

export interface TaskWithSkillInfo extends Task {
  subSkill: SubSkill | null;
  skill: Skill | null;
  metrics: Array<SkillMetric>;
}

export const taskRepository = {
  findById: async (id: string, userId: string): Promise<Task | null> => {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  },

  create: async (
    data: Omit<NewTask, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Task | null> => {
    const result = await db.insert(tasks).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<Omit<NewTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Task | null> => {
    const result = await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  delete: async (id: string, userId: string): Promise<Task | null> => {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  findUnassigned: async (userId: string): Promise<Array<Task>> => {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNull(tasks.dueDate)));

    return result;
  },

  findBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<Task>> => {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.subSkillId, subSkillId), eq(tasks.userId, userId)));

    return result;
  },

  findUnassignedWithSkillInfo: async (
    userId: string,
  ): Promise<Array<TaskWithSkillInfo>> => {
    // Get all unassigned tasks
    const taskResults = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNull(tasks.dueDate)));

    // Collect unique subSkillIds
    const subSkillIds = [
      ...new Set(
        taskResults.map((t) => t.subSkillId).filter((id): id is string => !!id),
      ),
    ];

    if (subSkillIds.length === 0) {
      return taskResults.map((task) => ({
        ...task,
        subSkill: null,
        skill: null,
        metrics: [],
      }));
    }

    // Get all sub-skills with their skills
    const subSkillResults = await db
      .select({
        subSkill: subSkills,
        skill: skills,
      })
      .from(subSkills)
      .innerJoin(skills, eq(subSkills.skillId, skills.id))
      .where(eq(subSkills.userId, userId));

    // Get all metrics for these sub-skills
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
    return taskResults.map((task) => {
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
  },
};
