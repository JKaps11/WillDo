import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Table ---------- */

export const skills = pgTable('skill', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull(),
  icon: text('icon'),
  goal: text('goal'),

  archived: boolean('archived').default(false).notNull(),
  archivedAt: timestamp('archived_at'),

  ...resourceTimestamps,
});

/* ---------- Inferred Types ---------- */

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
