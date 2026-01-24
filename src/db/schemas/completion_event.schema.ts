import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Enums ---------- */

export const completionEventTypeEnum = pgEnum('completion_event_type', [
  'task_completed',
  'subskill_completed',
  'skill_archived',
]);

/* ---------- Types ---------- */

export type CompletionEventType =
  (typeof completionEventTypeEnum.enumValues)[number];

/* ---------- Table ---------- */

export const completionEvents = pgTable(
  'completion_event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    eventType: completionEventTypeEnum('event_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    skillId: uuid('skill_id'),

    completedAt: timestamp('completed_at').defaultNow().notNull(),

    ...resourceTimestamps,
  },
  (table) => [
    index('completion_event_user_date_idx').on(table.userId, table.completedAt),
    index('completion_event_user_type_idx').on(table.userId, table.eventType),
  ],
);

/* ---------- Inferred Types ---------- */

export type CompletionEvent = typeof completionEvents.$inferSelect;
export type NewCompletionEvent = typeof completionEvents.$inferInsert;
