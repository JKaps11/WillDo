import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';
import { partnerships, sharingLevelEnum } from './partnership.schema';

/* ---------- Table ---------- */

export const partnershipSharing = pgTable(
  'partnership_sharing',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    partnershipId: uuid('partnership_id')
      .notNull()
      .references(() => partnerships.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    shareStreaks: sharingLevelEnum('share_streaks').notNull().default('summary'),
    shareCompletionRate: sharingLevelEnum('share_completion_rate')
      .notNull()
      .default('summary'),
    shareSkillNames: sharingLevelEnum('share_skill_names')
      .notNull()
      .default('summary'),
    shareSkillTree: sharingLevelEnum('share_skill_tree')
      .notNull()
      .default('none'),
    shareTasks: sharingLevelEnum('share_tasks').notNull().default('none'),
    shareXpLevel: sharingLevelEnum('share_xp_level')
      .notNull()
      .default('summary'),

    ...resourceTimestamps,
  },
  (table) => [
    uniqueIndex('partnership_sharing_unique_idx').on(
      table.partnershipId,
      table.userId,
    ),
  ],
);

/* ---------- Inferred Types ---------- */

export type PartnershipSharing = typeof partnershipSharing.$inferSelect;
export type NewPartnershipSharing = typeof partnershipSharing.$inferInsert;
