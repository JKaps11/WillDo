import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Enums ---------- */

export const partnershipStatusEnum = pgEnum('partnership_status', [
  'pending',
  'active',
  'paused',
  'ended',
]);

export const checkInFrequencyEnum = pgEnum('check_in_frequency', [
  'daily',
  'weekly',
]);

export const sharingLevelEnum = pgEnum('sharing_level', [
  'none',
  'summary',
  'detailed',
]);

/* ---------- Types ---------- */

export type PartnershipStatus =
  (typeof partnershipStatusEnum.enumValues)[number];
export type CheckInFrequency =
  (typeof checkInFrequencyEnum.enumValues)[number];
export type SharingLevel = (typeof sharingLevelEnum.enumValues)[number];

/* ---------- Partnership Table ---------- */

export const partnerships = pgTable(
  'partnership',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => users.id),
    inviteeId: text('invitee_id')
      .notNull()
      .references(() => users.id),
    status: partnershipStatusEnum('status').notNull().default('pending'),
    checkInFrequency: checkInFrequencyEnum('check_in_frequency')
      .notNull()
      .default('daily'),
    damageEnabled: boolean('damage_enabled').notNull().default(false),

    ...resourceTimestamps,
  },
  (table) => [
    uniqueIndex('partnership_inviter_invitee_idx').on(
      table.inviterId,
      table.inviteeId,
    ),
    index('partnership_inviter_idx').on(table.inviterId),
    index('partnership_invitee_idx').on(table.inviteeId),
  ],
);

/* ---------- Inferred Types ---------- */

export type Partnership = typeof partnerships.$inferSelect;
export type NewPartnership = typeof partnerships.$inferInsert;
