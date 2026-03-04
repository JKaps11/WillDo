import { and, eq, isNull } from 'drizzle-orm';
import type {
  NewSubSkill,
  SubSkill,
  SubSkillStage,
} from '@/db/schemas/sub_skill.schema';
import type { DbClient } from '@/db/index';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { db } from '@/db/index';

const STAGE_ORDER: Array<SubSkillStage> = [
  'not_started',
  'practice',
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
    dbClient: DbClient = db,
  ): Promise<SubSkill | null> => {
    const result = await dbClient.insert(subSkills).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<
      Omit<NewSubSkill, 'id' | 'userId' | 'skillId' | 'createdAt' | 'updatedAt'>
    >,
    dbClient: DbClient = db,
  ): Promise<SubSkill | null> => {
    const result = await dbClient
      .update(subSkills)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  delete: async (
    id: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<SubSkill | null> => {
    const result = await dbClient
      .delete(subSkills)
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  advanceStage: async (
    id: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<SubSkill | null> => {
    const subSkill = await dbClient
      .select()
      .from(subSkills)
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .limit(1);

    if (!subSkill[0]) return null;

    const currentIndex = STAGE_ORDER.indexOf(subSkill[0].stage);
    // Don't advance if already complete
    if (currentIndex >= STAGE_ORDER.length - 1) {
      return subSkill[0];
    }

    const nextStage = STAGE_ORDER[currentIndex + 1];
    const result = await dbClient
      .update(subSkills)
      .set({ stage: nextStage, updatedAt: new Date() })
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  complete: async (
    id: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<SubSkill | null> => {
    const result = await dbClient
      .update(subSkills)
      .set({ stage: 'complete', updatedAt: new Date() })
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  /* ---------- Tree Hierarchy ---------- */

  /**
   * Find root sub-skills (those that connect directly to the Skill node)
   */
  findRootSubSkills: async (
    skillId: string,
    userId: string,
  ): Promise<Array<SubSkill>> => {
    return db
      .select()
      .from(subSkills)
      .where(
        and(
          eq(subSkills.skillId, skillId),
          eq(subSkills.userId, userId),
          isNull(subSkills.parentSubSkillId),
        ),
      )
      .orderBy(subSkills.sortOrder);
  },

  /**
   * Find children of a specific sub-skill
   */
  findChildren: async (
    parentSubSkillId: string,
    userId: string,
  ): Promise<Array<SubSkill>> => {
    return db
      .select()
      .from(subSkills)
      .where(
        and(
          eq(subSkills.parentSubSkillId, parentSubSkillId),
          eq(subSkills.userId, userId),
        ),
      )
      .orderBy(subSkills.sortOrder);
  },

  /**
   * Update the parent of a sub-skill (for React Flow edge changes)
   */
  setParent: async (
    id: string,
    userId: string,
    parentSubSkillId: string | null,
    dbClient: DbClient = db,
  ): Promise<SubSkill | null> => {
    const result = await dbClient
      .update(subSkills)
      .set({ parentSubSkillId, updatedAt: new Date() })
      .where(and(eq(subSkills.id, id), eq(subSkills.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  /**
   * Check if a sub-skill is locked.
   * A subskill is unlocked (not locked) when:
   * - It's a leaf node (has no children), OR
   * - All of its child subskills are in the "complete" stage
   */
  isLocked: async (subSkillId: string, userId: string): Promise<boolean> => {
    const subSkill = await db
      .select()
      .from(subSkills)
      .where(and(eq(subSkills.id, subSkillId), eq(subSkills.userId, userId)))
      .limit(1);

    if (!subSkill[0]) return false;

    // Find all children of this subskill
    const children = await db
      .select()
      .from(subSkills)
      .where(
        and(
          eq(subSkills.parentSubSkillId, subSkillId),
          eq(subSkills.userId, userId),
        ),
      );

    // If no children (leaf node), it's unlocked
    if (children.length === 0) return false;

    // If has children, check if all children are complete
    const allChildrenComplete = children.every(
      (child) => child.stage === 'complete',
    );

    // Locked if NOT all children are complete
    return !allChildrenComplete;
  },
};
