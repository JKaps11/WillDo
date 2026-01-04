import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Enums ---------- */

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'synced',
  'error',
]);

/* ---------- Types ---------- */

export type SyncStatus = (typeof syncStatusEnum.enumValues)[number];

/* ---------- Table ---------- */

export const events = pgTable('event', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Event details
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),

  // Time fields (use timestamp with timezone for precise event times)
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),

  // Display
  color: text('color').default('#3b82f6').notNull(),

  // Google Calendar sync fields
  googleEventId: text('google_event_id'),
  googleCalendarId: text('google_calendar_id'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncStatus: syncStatusEnum().default('pending'),

  // Recurrence (iCalendar RRULE format - RFC 5545)
  recurrenceRule: text('recurrence_rule'),

  ...resourceTimestamps,
});

/* ---------- Inferred Types ---------- */

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
