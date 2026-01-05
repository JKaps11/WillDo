import { and, eq, inArray } from 'drizzle-orm';
import type {
  NewSubSkillDependency,
  SubSkillDependency,
} from '@/db/schemas/sub_skill_dependency.schema';
import type {
  NewSubSkill,
  SubSkill,
  SubSkillStage,
} from '@/db/schemas/sub_skill.schema';
import { subSkillDependencies } from '@/db/schemas/sub_skill_dependency.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { db } from '@/db/index';

const STAGE_ORDER: Array<SubSkillStage> = [
  'not_started',
  'practice',
  'feedback',
  'evaluate',
  'complete',
];

export const subSkillRepository = {
  findById: async (id: string, userId: string): Promise<SubSkill | null> => {
    const result = await db
      .select()
      .from(subSkills)
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  },

  findBySkillId: async (
    skillId: string,
    userId: string,
  ): Promise<Array<SubSkill>> => {
    return db
      .select()
      .from(subSkills)
      .where(and(eq(subSkills.skillId, skillId), eq(subSkills.userId, userId)))
      .orderBy(subSkills.sortOrder);
  },

  create: async (
    data: Omit<NewSubSkill, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SubSkill | null> => {
    const result = await db.insert(subSkills).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<
      Omit<NewSubSkill, 'id' | 'userId' | 'skillId' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<SubSkill | null> => {
    const result = await db
      .update(subSkills)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  delete: async (id: string, userId: string): Promise<SubSkill | null> => {
    const result = await db
      .delete(subSkills)
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  advanceStage: async (
    id: string,
    userId: string,
  ): Promise<SubSkill | null> => {
    const subSkill = await db
      .select()
      .from(subSkills)
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .limit(1);

    if (!subSkill[0]) return null;

    const currentIndex = STAGE_ORDER.indexOf(subSkill[0].stage);
    // Don't advance if already complete or at last stage before complete
    if (currentIndex >= STAGE_ORDER.length - 2) {
      return subSkill[0];
    }

    const nextStage = STAGE_ORDER[currentIndex + 1];
    const result = await db
      .update(subSkills)
      .set({ stage: nextStage, updated_at: new Date() })
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  complete: async (id: string, userId: string): Promise<SubSkill | null> => {
    const result = await db
      .update(subSkills)
      .set({ stage: 'complete', updated_at: new Date() })
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  /* ---------- Dependencies ---------- */

  findDependencies: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<SubSkillDependency>> => {
    return db
      .select()
      .from(subSkillDependencies)
      .where(
        and(
          eq(subSkillDependencies.dependentSubSkillId, subSkillId),
          eq(subSkillDependencies.userId, userId),
        ),
      );
  },

  findDependents: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<SubSkillDependency>> => {
    return db
      .select()
      .from(subSkillDependencies)
      .where(
        and(
          eq(subSkillDependencies.prerequisiteSubSkillId, subSkillId),
          eq(subSkillDependencies.userId, userId),
        ),
      );
  },

  addDependency: async (
    data: Omit<NewSubSkillDependency, 'createdAt' | 'updatedAt'>,
  ): Promise<SubSkillDependency | null> => {
    const result = await db
      .insert(subSkillDependencies)
      .values(data)
      .onConflictDoNothing()
      .returning();

    return result[0] ?? null;
  },

  removeDependency: async (
    dependentSubSkillId: string,
    prerequisiteSubSkillId: string,
    userId: string,
  ): Promise<SubSkillDependency | null> => {
    const result = await db
      .delete(subSkillDependencies)
      .where(
        and(
          eq(subSkillDependencies.dependentSubSkillId, dependentSubSkillId),
          eq(
            subSkillDependencies.prerequisiteSubSkillId,
            prerequisiteSubSkillId,
          ),
          eq(subSkillDependencies.userId, userId),
        ),
      )
      .returning();

    return result[0] ?? null;
  },

  /**
   * Check if a sub-skill is locked (has incomplete prerequisites)
   */
  isLocked: async (subSkillId: string, userId: string): Promise<boolean> => {
    const dependencies = await db
      .select()
      .from(subSkillDependencies)
      .where(
        and(
          eq(subSkillDependencies.dependentSubSkillId, subSkillId),
          eq(subSkillDependencies.userId, userId),
        ),
      );

    if (dependencies.length === 0) return false;

    const prerequisiteIds = dependencies.map((d) => d.prerequisiteSubSkillId);
    const prerequisites = await db
      .select()
      .from(subSkills)
      .where(
        and(
          inArray(subSkills.id, prerequisiteIds),
          eq(subSkills.userId, userId),
        ),
      );

    return prerequisites.some((p) => p.stage !== 'complete');
  },
};
