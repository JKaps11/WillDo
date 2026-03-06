import { and, eq, sql } from 'drizzle-orm';
import type {
  NewSkillMetric,
  SkillMetric,
} from '@/db/schemas/skill_metric.schema';
import type { NewSkill, Skill } from '@/db/schemas/skill.schema';
import type { DbClient } from '@/db/index';
import { skillMetrics } from '@/db/schemas/skill_metric.schema';
import { skills } from '@/db/schemas/skill.schema';
import { withDbError } from '@/db/withDbError';
import { db } from '@/db/index';

export const skillRepository = {
  findById: async (id: string, userId: string): Promise<Skill | null> => {
    const result = await withDbError('skill.findById', () =>
      db
        .select()
        .from(skills)
        .where(and(eq(skills.id, id), eq(skills.userId, userId)))
        .limit(1),
    );

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

    return withDbError('skill.findAll', () =>
      db
        .select()
        .from(skills)
        .where(and(...conditions)),
    );
  },

  create: async (
    data: Omit<NewSkill, 'id' | 'createdAt' | 'updatedAt'>,
    dbClient: DbClient = db,
  ): Promise<Skill | null> => {
    const result = await withDbError('skill.create', () =>
      dbClient.insert(skills).values(data).returning(),
    );

    return result[0] ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<Omit<NewSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
    dbClient: DbClient = db,
  ): Promise<Skill | null> => {
    const result = await withDbError('skill.update', () =>
      dbClient
        .update(skills)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(skills.id, id), eq(skills.userId, userId)))
        .returning(),
    );

    return result[0] ?? null;
  },

  delete: async (
    id: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<Skill | null> => {
    const result = await withDbError('skill.delete', () =>
      dbClient
        .delete(skills)
        .where(and(eq(skills.id, id), eq(skills.userId, userId)))
        .returning(),
    );

    return result[0] ?? null;
  },

  archive: async (
    id: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<Skill | null> => {
    const result = await withDbError('skill.archive', () =>
      dbClient
        .update(skills)
        .set({ archived: true, archivedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(skills.id, id), eq(skills.userId, userId)))
        .returning(),
    );

    return result[0] ?? null;
  },

  unarchive: async (
    id: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<Skill | null> => {
    const result = await withDbError('skill.unarchive', () =>
      dbClient
        .update(skills)
        .set({ archived: false, archivedAt: null, updatedAt: new Date() })
        .where(and(eq(skills.id, id), eq(skills.userId, userId)))
        .returning(),
    );

    return result[0] ?? null;
  },

  /* ---------- Skill Metrics ---------- */

  findMetricById: async (
    id: string,
    userId: string,
  ): Promise<SkillMetric | null> => {
    const result = await withDbError('skillMetric.findById', () =>
      db
        .select()
        .from(skillMetrics)
        .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
        .limit(1),
    );

    return result[0] ?? null;
  },

  findMetricsBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<SkillMetric>> => {
    return withDbError('skillMetric.findBySubSkillId', () =>
      db
        .select()
        .from(skillMetrics)
        .where(
          and(
            eq(skillMetrics.subSkillId, subSkillId),
            eq(skillMetrics.userId, userId),
          ),
        ),
    );
  },

  createMetric: async (
    data: Omit<NewSkillMetric, 'id' | 'createdAt' | 'updatedAt'>,
    dbClient: DbClient = db,
  ): Promise<SkillMetric | null> => {
    const result = await withDbError('skillMetric.create', () =>
      dbClient.insert(skillMetrics).values(data).returning(),
    );

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
    dbClient: DbClient = db,
  ): Promise<SkillMetric | null> => {
    const result = await withDbError('skillMetric.update', () =>
      dbClient
        .update(skillMetrics)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
        .returning(),
    );

    return result[0] ?? null;
  },

  incrementMetric: async (
    id: string,
    userId: string,
    amount = 1,
    dbClient: DbClient = db,
  ): Promise<SkillMetric | null> => {
    const result = await withDbError('skillMetric.increment', () =>
      dbClient
        .update(skillMetrics)
        .set({
          currentValue: sql`${skillMetrics.currentValue} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
        .returning(),
    );

    return result[0] ?? null;
  },

  deleteMetric: async (
    id: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<SkillMetric | null> => {
    const result = await withDbError('skillMetric.delete', () =>
      dbClient
        .delete(skillMetrics)
        .where(and(eq(skillMetrics.id, id), eq(skillMetrics.userId, userId)))
        .returning(),
    );

    return result[0] ?? null;
  },
};
