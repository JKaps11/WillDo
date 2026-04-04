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
import { partnerships } from './partnership.schema';

/* ---------- Enums ---------- */

export const partnerInviteStatusEnum = pgEnum('partner_invite_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
]);

/* ---------- Types ---------- */

export type PartnerInviteStatus =
  (typeof partnerInviteStatusEnum.enumValues)[number];

/* ---------- Table ---------- */

export const partnerInvites = pgTable(
  'partner_invite',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => users.id),
    token: text('token').notNull().unique(),
    inviteeEmail: text('invitee_email'),
    status: partnerInviteStatusEnum('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    partnershipId: uuid('partnership_id').references(() => partnerships.id),

    ...resourceTimestamps,
  },
  (table) => [
    index('partner_invite_token_idx').on(table.token),
    index('partner_invite_inviter_idx').on(table.inviterId),
  ],
);

/* ---------- Inferred Types ---------- */

export type PartnerInvite = typeof partnerInvites.$inferSelect;
export type NewPartnerInvite = typeof partnerInvites.$inferInsert;
