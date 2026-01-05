import { integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { skills } from './skill.schema';
import { users } from './user.schema';

/* ---------- Enums ---------- */

export const subSkillStageEnum = pgEnum('sub_skill_stage', [
  'not_started',
  'practice',
  'feedback',
  'evaluate',
  'complete',
]);

/* ---------- Types ---------- */

export type SubSkillStage = (typeof subSkillStageEnum.enumValues)[number];

/* ---------- Table ---------- */

export const subSkills = pgTable('sub_skill', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),

  stage: subSkillStageEnum().default('not_started').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),

  ...resourceTimestamps,
});

/* ---------- Inferred Types ---------- */

export type SubSkill = typeof subSkills.$inferSelect;
export type NewSubSkill = typeof subSkills.$inferInsert;
