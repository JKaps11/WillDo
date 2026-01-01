import {
    pgTable,
    primaryKey,
    text,
    uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Table ---------- */

export const tags = pgTable(
    'tag',
    {
        userId: text('user_id')
            .notNull()
            .references(() => users.id),

        tagId: uuid('tag_id').defaultRandom().notNull(),

        title: text('title').notNull(),
        color: text('color').notNull(),

        ...resourceTimestamps,
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.userId, table.tagId],
        }),
    })
);

/* ---------- Inferred Types ---------- */

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
