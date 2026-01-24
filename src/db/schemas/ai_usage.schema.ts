import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Table ---------- */

export const aiUsage = pgTable(
  'ai_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    // Request details
    model: text('model').notNull(),
    operation: text('operation').notNull(), // e.g., 'generate_skill_plan', 'refine_skill_plan'

    // Token usage
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),

    // Cost tracking (in USD, stored as decimal for precision)
    cost: numeric('cost', { precision: 10, scale: 6 }).notNull(),

    // Status
    success: integer('success').notNull(), // 1 = success, 0 = failure

    ...resourceTimestamps,
  },
  (table) => [
    index('ai_usage_user_idx').on(table.userId),
    index('ai_usage_created_at_idx').on(table.createdAt),
  ],
);

/* ---------- Inferred Types ---------- */

export type AiUsage = typeof aiUsage.$inferSelect;
export type NewAiUsage = typeof aiUsage.$inferInsert;
