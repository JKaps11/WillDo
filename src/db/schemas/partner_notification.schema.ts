import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';
import { partnerships } from './partnership.schema';

/* ---------- Enums ---------- */

export const partnerNotificationTypeEnum = pgEnum(
  'partner_notification_type',
  [
    'invite_received',
    'invite_accepted',
    'check_in_reminder',
    'partner_checked_in',
    'partner_missed',
    'streak_milestone',
    'shared_streak_milestone',
    'partner_level_up',
  ],
);

/* ---------- Types ---------- */

export type PartnerNotificationType =
  (typeof partnerNotificationTypeEnum.enumValues)[number];

/* ---------- Table ---------- */

export const partnerNotifications = pgTable(
  'partner_notification',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    type: partnerNotificationTypeEnum('type').notNull(),
    partnershipId: uuid('partnership_id').references(() => partnerships.id, {
      onDelete: 'cascade',
    }),
    data: jsonb('data').$type<Record<string, unknown>>(),
    read: boolean('read').notNull().default(false),

    ...resourceTimestamps,
  },
  (table) => [
    index('partner_notification_user_read_idx').on(table.userId, table.read),
    index('partner_notification_user_idx').on(table.userId),
  ],
);

/* ---------- Inferred Types ---------- */

export type PartnerNotification = typeof partnerNotifications.$inferSelect;
export type NewPartnerNotification = typeof partnerNotifications.$inferInsert;
