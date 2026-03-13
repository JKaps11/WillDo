import { and, count, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';

import type {
  NewPracticeSession,
  NewSessionReflectionResponse,
  NewStillTrueResponse,
  PracticeSession,
  SessionReflectionResponse,
} from '@/db/schemas/practice_session.schema';
import type { DbClient } from '@/db/index';
import {
  practiceSessions,
  sessionReflectionResponses,
  stillTrueResponses,
} from '@/db/schemas/practice_session.schema';
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
  sessionCount: number;
}

export interface SessionWithReflections extends PracticeSession {
  reflections: Array<SessionReflectionResponse>;
}

export const practiceSessionRepository = {
  create: async (
    data: Omit<NewPracticeSession, 'id' | 'createdAt' | 'updatedAt'>,
    reflections: Array<
      Omit<NewSessionReflectionResponse, 'id' | 'createdAt' | 'sessionId'>
    >,
    stillTrueData: Array<
      Omit<NewStillTrueResponse, 'id' | 'createdAt' | 'sessionId'>
    >,
    dbClient: DbClient = db,
  ): Promise<PracticeSession> => {
    const result = await withDbError('practiceSession.create', () =>
      dbClient.insert(practiceSessions).values(data).returning(),
    );
    // insert().returning() always returns the inserted row
    const session = result[0];

    if (reflections.length > 0) {
      await withDbError('practiceSession.createReflections', () =>
        dbClient
          .insert(sessionReflectionResponses)
          .values(reflections.map((r) => ({ ...r, sessionId: session.id }))),
      );
    }

    if (stillTrueData.length > 0) {
      await withDbError('practiceSession.createStillTrue', () =>
        dbClient
          .insert(stillTrueResponses)
          .values(stillTrueData.map((s) => ({ ...s, sessionId: session.id }))),
      );
    }

    return session;
  },

  findById: async (
    id: string,
    userId: string,
  ): Promise<SessionWithReflections | null> => {
    const result = await withDbError('practiceSession.findById', () =>
      db
        .select()
        .from(practiceSessions)
        .where(
          and(eq(practiceSessions.id, id), eq(practiceSessions.userId, userId)),
        )
        .limit(1),
    );
    if (result.length === 0) return null;
    const session = result[0];

    const reflections = await withDbError(
      'practiceSession.findReflections',
      () =>
        db
          .select()
          .from(sessionReflectionResponses)
          .where(eq(sessionReflectionResponses.sessionId, session.id))
          .orderBy(sessionReflectionResponses.sortOrder),
    );

    return { ...session, reflections };
  },

  findBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<PracticeSession>> => {
    return withDbError('practiceSession.findBySubSkillId', () =>
      db
        .select()
        .from(practiceSessions)
        .where(
          and(
            eq(practiceSessions.subSkillId, subSkillId),
            eq(practiceSessions.userId, userId),
          ),
        )
        .orderBy(desc(practiceSessions.createdAt)),
    );
  },

  findLatestBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<SessionWithReflections | null> => {
    const latestResult = await withDbError(
      'practiceSession.findLatestBySubSkillId',
      () =>
        db
          .select()
          .from(practiceSessions)
          .where(
            and(
              eq(practiceSessions.subSkillId, subSkillId),
              eq(practiceSessions.userId, userId),
              isNotNull(practiceSessions.completedAt),
            ),
          )
          .orderBy(desc(practiceSessions.completedAt))
          .limit(1),
    );
    if (latestResult.length === 0) return null;
    const session = latestResult[0];

    const reflections = await withDbError(
      'practiceSession.findLatestReflections',
      () =>
        db
          .select()
          .from(sessionReflectionResponses)
          .where(eq(sessionReflectionResponses.sessionId, session.id))
          .orderBy(sessionReflectionResponses.sortOrder),
    );

    return { ...session, reflections };
  },

  getRecentPromptKeys: async (
    subSkillId: string,
    userId: string,
    limit: number = 3,
  ): Promise<Array<string>> => {
    // Get session IDs for the most recent N completed sessions
    const recentSessions = await withDbError(
      'practiceSession.getRecentSessionIds',
      () =>
        db
          .select({ id: practiceSessions.id })
          .from(practiceSessions)
          .where(
            and(
              eq(practiceSessions.subSkillId, subSkillId),
              eq(practiceSessions.userId, userId),
              isNotNull(practiceSessions.completedAt),
            ),
          )
          .orderBy(desc(practiceSessions.completedAt))
          .limit(limit),
    );

    if (recentSessions.length === 0) return [];

    const sessionIds = recentSessions.map((s) => s.id);
    const prompts = await withDbError(
      'practiceSession.getRecentPromptKeys',
      () =>
        db
          .select({ promptKey: sessionReflectionResponses.promptKey })
          .from(sessionReflectionResponses)
          .where(inArray(sessionReflectionResponses.sessionId, sessionIds)),
    );

    return prompts.map((p) => p.promptKey);
  },

  countBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<number> => {
    const countResult = await withDbError(
      'practiceSession.countBySubSkillId',
      () =>
        db
          .select({ count: count() })
          .from(practiceSessions)
          .where(
            and(
              eq(practiceSessions.subSkillId, subSkillId),
              eq(practiceSessions.userId, userId),
            ),
          ),
    );
    return countResult[0]?.count ?? 0;
  },

  getUnresolvedReflections: async (
    subSkillId: string,
    userId: string,
    limit: number = 2,
  ): Promise<
    Array<{
      sessionId: string;
      responseId: string | null;
      text: string;
    }>
  > => {
    // Get completed sessions for this sub-skill
    const completedSessions = await withDbError(
      'practiceSession.getCompletedSessions',
      () =>
        db
          .select({ id: practiceSessions.id })
          .from(practiceSessions)
          .where(
            and(
              eq(practiceSessions.subSkillId, subSkillId),
              eq(practiceSessions.userId, userId),
              isNotNull(practiceSessions.completedAt),
            ),
          )
          .orderBy(desc(practiceSessions.completedAt)),
    );

    if (completedSessions.length === 0) return [];

    const sessionIds = completedSessions.map((s) => s.id);

    // Get reflections from self_assessment and forward_looking categories
    // that haven't been marked as 'resolved' in a still_true_response
    const reflections = await withDbError(
      'practiceSession.getUnresolvedReflections',
      () =>
        db
          .select({
            sessionId: sessionReflectionResponses.sessionId,
            responseId: sessionReflectionResponses.id,
            text: sessionReflectionResponses.responseText,
          })
          .from(sessionReflectionResponses)
          .where(
            and(
              inArray(sessionReflectionResponses.sessionId, sessionIds),
              inArray(sessionReflectionResponses.promptCategory, [
                'self_assessment',
                'forward_looking',
              ]),
            ),
          )
          .orderBy(sql`RANDOM()`)
          .limit(limit),
    );

    return reflections;
  },

  deleteByTaskAndDate: async (
    taskId: string,
    occurrenceDate: Date,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<PracticeSession | null> => {
    const result = await withDbError(
      'practiceSession.deleteByTaskAndDate',
      () =>
        dbClient
          .delete(practiceSessions)
          .where(
            and(
              eq(practiceSessions.taskId, taskId),
              eq(practiceSessions.occurrenceDate, occurrenceDate),
              eq(practiceSessions.userId, userId),
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
  ): Promise<PracticeSession | null> => {
    const latestRows = await withDbError(
      'practiceSession.findLatestByTaskId',
      () =>
        db
          .select()
          .from(practiceSessions)
          .where(
            and(
              eq(practiceSessions.taskId, taskId),
              eq(practiceSessions.userId, userId),
            ),
          )
          .orderBy(desc(practiceSessions.completedAt))
          .limit(1),
    );
    if (latestRows.length === 0) return null;
    const latest = latestRows[0];

    const result = await withDbError(
      'practiceSession.deleteLatestByTaskId',
      () =>
        dbClient
          .delete(practiceSessions)
          .where(eq(practiceSessions.id, latest.id))
          .returning(),
    );
    return result[0] ?? null;
  },

  getFolderHierarchy: async (
    userId: string,
  ): Promise<Array<FolderHierarchySkill>> => {
    const rows = await withDbError('practiceSession.getFolderHierarchy', () =>
      db
        .select({
          skillId: skills.id,
          skillName: skills.name,
          skillColor: skills.color,
          skillIcon: skills.icon,
          subSkillId: subSkills.id,
          subSkillName: subSkills.name,
          sessionCount: count(practiceSessions.id),
        })
        .from(practiceSessions)
        .innerJoin(skills, eq(practiceSessions.skillId, skills.id))
        .innerJoin(subSkills, eq(practiceSessions.subSkillId, subSkills.id))
        .where(eq(practiceSessions.userId, userId))
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
        sessionCount: Number(row.sessionCount),
      });
    }

    return Array.from(skillMap.values());
  },
};
