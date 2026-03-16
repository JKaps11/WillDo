import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';
import { partnerships } from './partnership.schema';

/* ---------- Enums ---------- */

export const checkInResponseEnum = pgEnum('check_in_response', [
  'yes',
  'no',
  'partial',
]);

/* ---------- Types ---------- */

export type CheckInResponse = (typeof checkInResponseEnum.enumValues)[number];

/* ---------- Table ---------- */

export const checkIns = pgTable(
  'check_in',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    partnershipId: uuid('partnership_id')
      .notNull()
      .references(() => partnerships.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    date: date('date', { mode: 'date' }).notNull(),
    response: checkInResponseEnum('response').notNull(),
    note: text('note'),
    xpAwarded: integer('xp_awarded').notNull().default(0),

    ...resourceTimestamps,
  },
  (table) => [
    uniqueIndex('check_in_unique_idx').on(
      table.partnershipId,
      table.userId,
      table.date,
    ),
    index('check_in_user_date_idx').on(table.userId, table.date),
  ],
);

/* ---------- Inferred Types ---------- */

export type CheckIn = typeof checkIns.$inferSelect;
export type NewCheckIn = typeof checkIns.$inferInsert;
