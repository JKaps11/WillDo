import {
    boolean,
    date,
    foreignKey,
    json,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { todoLists } from './todo_list.schema';
import { users } from './user.schema';

/* ---------- Enums ---------- */

export const priorityEnum = pgEnum('priority', [
    'Very_Low',
    'Low',
    'Medium',
    'High',
    'Very_High',
]);

/* ---------- Types ---------- */

export type Priority =
    (typeof priorityEnum.enumValues)[number];

/* ---------- Table ---------- */

export const tasks = pgTable(
    'task',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: text('user_id')
            .notNull()
            .references(() => users.id),

        todoListDate: date('todo_list_date', { mode: 'date' }).notNull(),

        name: text('name').notNull(),
        description: text('description'),

        priority: priorityEnum().default('Medium').notNull(),
        dueDate: timestamp('due_date'),
        completed: boolean('completed').default(false).notNull(),

        tagIds: json('tag_ids').$type<string[]>().default([]).notNull(),

        ...resourceTimestamps,
    },
    (table) => ({
        todoListFk: foreignKey({
            columns: [table.todoListDate, table.userId],
            foreignColumns: [todoLists.date, todoLists.userId],
        }),
    })
);

/* ---------- Inferred Types ---------- */

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
