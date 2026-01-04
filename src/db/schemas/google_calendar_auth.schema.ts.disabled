import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Table ---------- */

export const googleCalendarAuth = pgTable('google_calendar_auth', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),

  // OAuth tokens (will be encrypted at application layer)
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at', {
    withTimezone: true,
  }).notNull(),

  // Sync configuration
  primaryCalendarId: text('primary_calendar_id'),
  syncEnabled: boolean('sync_enabled').default(true).notNull(),

  // Webhook channel for push notifications
  webhookChannelId: text('webhook_channel_id'),
  webhookResourceId: text('webhook_resource_id'),
  webhookExpiration: timestamp('webhook_expiration', {
    withTimezone: true,
  }),

  ...resourceTimestamps,
});

/* ---------- Inferred Types ---------- */

export type GoogleCalendarAuth = typeof googleCalendarAuth.$inferSelect;
export type NewGoogleCalendarAuth = typeof googleCalendarAuth.$inferInsert;
