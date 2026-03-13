import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { subSkills } from './sub_skill.schema';
import { skills } from './skill.schema';
import { tasks } from './task.schema';
import { users } from './user.schema';

/* ---------- Enums ---------- */

export const promptCategoryEnum = pgEnum('prompt_category', [
  'self_assessment',
  'insight_extraction',
  'forward_looking',
  'meta_cognitive',
]);

export const stillTrueResponseEnum = pgEnum('still_true_response_type', [
  'still_struggling',
  'improved',
  'resolved',
]);

/* ---------- Tables ---------- */

export const practiceSessions = pgTable(
  'practice_session',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    subSkillId: uuid('sub_skill_id')
      .notNull()
      .references(() => subSkills.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    occurrenceDate: date('occurrence_date', { mode: 'date' }).notNull(),

    title: text('title').notNull(),
    preConfidence: integer('pre_confidence').notNull(),
    postConfidence: integer('post_confidence'),
    iterationNumber: integer('iteration_number').notNull(),

    completedAt: timestamp('completed_at'),

    ...resourceTimestamps,
  },
  (table) => [
    unique('practice_session_task_occurrence_uniq').on(
      table.taskId,
      table.occurrenceDate,
    ),
    index('practice_session_user_subskill_idx').on(
      table.userId,
      table.subSkillId,
    ),
    index('practice_session_user_skill_idx').on(table.userId, table.skillId),
    index('practice_session_task_idx').on(table.taskId),
  ],
);

export const sessionReflectionResponses = pgTable(
  'session_reflection_response',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => practiceSessions.id, { onDelete: 'cascade' }),
    promptKey: text('prompt_key').notNull(),
    promptText: text('prompt_text').notNull(),
    promptCategory: promptCategoryEnum('prompt_category').notNull(),
    responseText: text('response_text').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('session_reflection_session_idx').on(table.sessionId)],
);

export const stillTrueResponses = pgTable(
  'still_true_response',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => practiceSessions.id, { onDelete: 'cascade' }),
    sourceSessionId: uuid('source_session_id')
      .notNull()
      .references(() => practiceSessions.id),
    sourceResponseId: uuid('source_response_id').references(
      () => sessionReflectionResponses.id,
    ),
    sourceText: text('source_text').notNull(),
    response: stillTrueResponseEnum('response').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('still_true_session_idx').on(table.sessionId)],
);

/* ---------- Inferred Types ---------- */

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;

export type SessionReflectionResponse =
  typeof sessionReflectionResponses.$inferSelect;
export type NewSessionReflectionResponse =
  typeof sessionReflectionResponses.$inferInsert;

export type StillTrueResponse = typeof stillTrueResponses.$inferSelect;
export type NewStillTrueResponse = typeof stillTrueResponses.$inferInsert;
