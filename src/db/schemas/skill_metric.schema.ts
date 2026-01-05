import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { subSkills } from './sub_skill.schema';
import { users } from './user.schema';

/* ---------- Table ---------- */

export const skillMetrics = pgTable('skill_metric', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  subSkillId: uuid('sub_skill_id')
    .notNull()
    .references(() => subSkills.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  unit: text('unit'),
  targetValue: integer('target_value').notNull().default(1),
  currentValue: integer('current_value').notNull().default(0),

  ...resourceTimestamps,
});

/* ---------- Inferred Types ---------- */

export type SkillMetric = typeof skillMetrics.$inferSelect;
export type NewSkillMetric = typeof skillMetrics.$inferInsert;
