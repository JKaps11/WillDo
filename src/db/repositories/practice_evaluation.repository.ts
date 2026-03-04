import { and, count, desc, eq } from 'drizzle-orm';

import type {
  NewPracticeEvaluation,
  PracticeEvaluation,
} from '@/db/schemas/practice_evaluation.schema';
import type { DbClient } from '@/db/index';
import { practiceEvaluations } from '@/db/schemas/practice_evaluation.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { skills } from '@/db/schemas/skill.schema';
import { withDbError } from '@/db/withDbError';
import { db } from '@/db/index';

export interface FolderHierarchySkill {
  skillId: string;
  skillName: string;
  skillColor: string;
  skillIcon: string | null;
  subSkills: Array<FolderHierarchySubSkill>;
}

export interface FolderHierarchySubSkill {
  subSkillId: string;
  subSkillName: string;
  evaluationCount: number;
}

export const practiceEvaluationRepository = {
  create: async (
    data: Omit<NewPracticeEvaluation, 'id' | 'createdAt' | 'updatedAt'>,
    dbClient: DbClient = db,
  ): Promise<PracticeEvaluation | null> => {
    const result = await withDbError('practiceEvaluation.create', () =>
      dbClient.insert(practiceEvaluations).values(data).returning(),
    );
    return result[0] ?? null;
  },

  findById: async (
    id: string,
    userId: string,
  ): Promise<PracticeEvaluation | null> => {
    const result = await withDbError('practiceEvaluation.findById', () =>
      db
        .select()
        .from(practiceEvaluations)
        .where(
          and(
            eq(practiceEvaluations.id, id),
            eq(practiceEvaluations.userId, userId),
          ),
        )
        .limit(1),
    );
    return result[0] ?? null;
  },

  findByTaskId: async (
    taskId: string,
    userId: string,
  ): Promise<PracticeEvaluation | null> => {
    const result = await withDbError('practiceEvaluation.findByTaskId', () =>
      db
        .select()
        .from(practiceEvaluations)
        .where(
          and(
            eq(practiceEvaluations.taskId, taskId),
            eq(practiceEvaluations.userId, userId),
          ),
        )
        .limit(1),
    );
    return result[0] ?? null;
  },

  deleteByTaskAndDate: async (
    taskId: string,
    occurrenceDate: Date,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<PracticeEvaluation | null> => {
    const result = await withDbError(
      'practiceEvaluation.deleteByTaskAndDate',
      () =>
        dbClient
          .delete(practiceEvaluations)
          .where(
            and(
              eq(practiceEvaluations.taskId, taskId),
              eq(practiceEvaluations.occurrenceDate, occurrenceDate),
              eq(practiceEvaluations.userId, userId),
            ),
          )
          .returning(),
    );
    return result[0] ?? null;
  },

  deleteLatestByTaskId: async (
    taskId: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<PracticeEvaluation | null> => {
    const latest = await withDbError(
      'practiceEvaluation.findLatestByTaskId',
      () =>
        db
          .select()
          .from(practiceEvaluations)
          .where(
            and(
              eq(practiceEvaluations.taskId, taskId),
              eq(practiceEvaluations.userId, userId),
            ),
          )
          .orderBy(desc(practiceEvaluations.completedAt))
          .limit(1),
    );
    if (!latest[0]) return null;

    const result = await withDbError(
      'practiceEvaluation.deleteLatestByTaskId',
      () =>
        dbClient
          .delete(practiceEvaluations)
          .where(eq(practiceEvaluations.id, latest[0].id))
          .returning(),
    );
    return result[0] ?? null;
  },

  findBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<PracticeEvaluation>> => {
    return withDbError('practiceEvaluation.findBySubSkillId', () =>
      db
        .select()
        .from(practiceEvaluations)
        .where(
          and(
            eq(practiceEvaluations.subSkillId, subSkillId),
            eq(practiceEvaluations.userId, userId),
          ),
        )
        .orderBy(desc(practiceEvaluations.completedAt)),
    );
  },

  findLatestBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<PracticeEvaluation | null> => {
    const result = await withDbError(
      'practiceEvaluation.findLatestBySubSkillId',
      () =>
        db
          .select()
          .from(practiceEvaluations)
          .where(
            and(
              eq(practiceEvaluations.subSkillId, subSkillId),
              eq(practiceEvaluations.userId, userId),
            ),
          )
          .orderBy(desc(practiceEvaluations.completedAt))
          .limit(1),
    );
    return result[0] ?? null;
  },

  getFolderHierarchy: async (
    userId: string,
  ): Promise<Array<FolderHierarchySkill>> => {
    // Get all subskills that have evaluations, grouped with counts
    const rows = await withDbError(
      'practiceEvaluation.getFolderHierarchy',
      () =>
        db
          .select({
            skillId: skills.id,
            skillName: skills.name,
            skillColor: skills.color,
            skillIcon: skills.icon,
            subSkillId: subSkills.id,
            subSkillName: subSkills.name,
            evaluationCount: count(practiceEvaluations.id),
          })
          .from(practiceEvaluations)
          .innerJoin(skills, eq(practiceEvaluations.skillId, skills.id))
          .innerJoin(
            subSkills,
            eq(practiceEvaluations.subSkillId, subSkills.id),
          )
          .where(eq(practiceEvaluations.userId, userId))
          .groupBy(
            skills.id,
            skills.name,
            skills.color,
            skills.icon,
            subSkills.id,
            subSkills.name,
          )
          .orderBy(skills.name, subSkills.name),
    );

    // Group into hierarchy
    const skillMap = new Map<string, FolderHierarchySkill>();
    for (const row of rows) {
      let skill = skillMap.get(row.skillId);
      if (!skill) {
        skill = {
          skillId: row.skillId,
          skillName: row.skillName,
          skillColor: row.skillColor,
          skillIcon: row.skillIcon,
          subSkills: [],
        };
        skillMap.set(row.skillId, skill);
      }
      skill.subSkills.push({
        subSkillId: row.subSkillId,
        subSkillName: row.subSkillName,
        evaluationCount: Number(row.evaluationCount),
      });
    }

    return Array.from(skillMap.values());
  },
};
