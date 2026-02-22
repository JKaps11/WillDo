import {
  date,
  index,
  integer,
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

/* ---------- Table ---------- */

export const practiceEvaluations = pgTable(
  'practice_evaluation',
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
    wentWell: text('went_well').array().notNull(),
    struggled: text('struggled').array().notNull(),
    understandBetter: text('understand_better').array().notNull(),
    feelings: text('feelings').array().notNull(),
    focusNextTime: text('focus_next_time').array().notNull(),
    confidenceLevel: integer('confidence_level').notNull(),

    completedAt: timestamp('completed_at').defaultNow().notNull(),

    ...resourceTimestamps,
  },
  (table) => [
    unique('practice_eval_task_occurrence_uniq').on(
      table.taskId,
      table.occurrenceDate,
    ),
    index('practice_eval_user_subskill_idx').on(table.userId, table.subSkillId),
    index('practice_eval_user_skill_idx').on(table.userId, table.skillId),
    index('practice_eval_task_idx').on(table.taskId),
  ],
);

/* ---------- Inferred Types ---------- */

export type PracticeEvaluation = typeof practiceEvaluations.$inferSelect;
export type NewPracticeEvaluation = typeof practiceEvaluations.$inferInsert;
