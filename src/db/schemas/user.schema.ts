import { jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

/* ---------- Enums ---------- */

export const appearanceThemeEnum = pgEnum('appearance_theme', [
    'light',
    'dark',
    'system',
])

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
export type AppearanceTheme =
    (typeof appearanceThemeEnum.enumValues)[number]

export type TodoListTimeSpan =
    (typeof todoListTimeSpanEnum.enumValues)[number];

export type TodoListSortBy =
    (typeof todoListSortByEnum.enumValues)[number];

export interface UserSettings {
    appearance: {
        theme: AppearanceTheme;
    };
    todoList: {
        sortBy: TodoListSortBy;
        timeSpan: TodoListTimeSpan;
        showCompleted: boolean;
    };
}

/* ---------- Table ---------- */

export const users = pgTable('user', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    settings: jsonb('settings')
        .$type<UserSettings>()
        .notNull()
        .default(
            {
                appearance: {
                    theme: 'system'
                },
                todoList: {
                    sortBy: 'priority',
                    timeSpan: 'week',
                    showCompleted: true
                }
            }
        ),
});

/* ---------- Inferred Types ---------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
