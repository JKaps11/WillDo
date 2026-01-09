import { and, eq } from 'drizzle-orm';
import type {
  NewSkillMetric,
  SkillMetric,
} from '@/db/schemas/skill_metric.schema';
import type { NewSkill, Skill } from '@/db/schemas/skill.schema';
import { skillMetrics } from '@/db/schemas/skill_metric.schema';
import { skills } from '@/db/schemas/skill.schema';
import { db } from '@/db/index';

export const skillRepository = {
  findById: async (id: string, userId: string): Promise<Skill | null> => {
    const result = await db
      .select()
      .from(skills)
      .where(and(eq(skills.id, id), eq(skills.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  },

  findAll: async (
    userId: string,
    includeArchived = false,
  ): Promise<Array<Skill>> => {
    const conditions = [eq(skills.userId, userId)];
    if (!includeArchived) {
      conditions.push(eq(skills.archived, false));
    }

    return db
      .select()
      .from(skills)
      .where(and(...conditions));
  },

  create: async (
    data: Omit<NewSkill, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Skill | null> => {
    const result = await db.insert(skills).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<Omit<NewSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Skill | null> => {
    const result = await db
      .update(skills)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(skills.id, id), eq(skills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  delete: async (id: string, userId: string): Promise<Skill | null> => {
    const result = await db
      .delete(skills)
      .where(and(eq(skills.id, id), eq(skills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  archive: async (id: string, userId: string): Promise<Skill | null> => {
    const result = await db
      .update(skills)
      .set({ archived: true, archivedAt: new Date(), updated_at: new Date() })
      .where(and(eq(skills.id, id), eq(skills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  unarchive: async (id: string, userId: string): Promise<Skill | null> => {
    const result = await db
      .update(skills)
      .set({ archived: false, archivedAt: null, updated_at: new Date() })
      .where(and(eq(skills.id, id), eq(skills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  /* ---------- Skill Metrics ---------- */

  findMetricById: async (
    id: string,
    userId: string,
  ): Promise<SkillMetric | null> => {
    const result = await db
      .select()
      .from(skillMetrics)
      .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  },

  findMetricsBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<SkillMetric>> => {
    return db
      .select()
      .from(skillMetrics)
      .where(
        and(
          eq(skillMetrics.subSkillId, subSkillId),
          eq(skillMetrics.userId, userId),
        ),
      );
  },

  createMetric: async (
    data: Omit<NewSkillMetric, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SkillMetric | null> => {
    const result = await db.insert(skillMetrics).values(data).returning();

    return result[0] ?? null;
  },

  updateMetric: async (
    id: string,
    userId: string,
    data: Partial<
      Omit<
        NewSkillMetric,
        'id' | 'userId' | 'subSkillId' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<SkillMetric | null> => {
    const result = await db
      .update(skillMetrics)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  incrementMetric: async (
    id: string,
    userId: string,
    amount = 1,
  ): Promise<SkillMetric | null> => {
    const metric = await db
      .select()
      .from(skillMetrics)
      .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
      .limit(1);

    if (!metric[0]) return null;

    const newValue = metric[0].currentValue + amount;
    const result = await db
      .update(skillMetrics)
      .set({ currentValue: newValue, updated_at: new Date() })
      .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  deleteMetric: async (
    id: string,
    userId: string,
  ): Promise<SkillMetric | null> => {
    const result = await db
      .delete(skillMetrics)
      .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
      .returning();

    return result[0] ?? null;
  },
};
