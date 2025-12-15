import { jsonb, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/* ---------- Enums ---------- */

export const todoListTimeSpanEnum = pgEnum('todo_list_time_span', [
    'day',
    'week',
]);

export const todoListSortByEnum = pgEnum('todo_list_sort_by', [
    'date',
    'priority',
    'alphabetical',
]);

/* ---------- Types ---------- */

export type TodoListTimeSpan =
    (typeof todoListTimeSpanEnum.enumValues)[number];

export type TodoListSortBy =
    (typeof todoListSortByEnum.enumValues)[number];

export interface UserSettings {
    todoList: {
        sortBy: TodoListSortBy;
        timeSpan: TodoListTimeSpan;
        showCompleted: boolean;
    };
}

/* ---------- Table ---------- */

export const users = pgTable('user', {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),

    settings: jsonb('settings')
        .$type<UserSettings>()
        .notNull()
        .default(
            sql`'{"todoList":{"sortBy":"priority","timeSpan":"week","showCompleted": true}}'::jsonb`
        ),
});

/* ---------- Inferred Types ---------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
