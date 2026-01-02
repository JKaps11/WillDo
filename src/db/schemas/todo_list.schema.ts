import { date, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { users } from './user.schema';

/* ---------- Table ---------- */

export const todoLists = pgTable(
  'todo_list',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    date: date('date', { mode: 'date' }).notNull(),

    ...resourceTimestamps,
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.date],
    }),
  }),
);

/* ---------- Inferred Types ---------- */

export type TodoList = typeof todoLists.$inferSelect;
export type NewTodoList = typeof todoLists.$inferInsert;
