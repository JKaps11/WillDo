import {
  boolean,
  date,
  foreignKey,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { todoLists } from './todo_list.schema';
import { subSkills } from './sub_skill.schema';
import { users } from './user.schema';

/* ---------- Enums ---------- */

export const priorityEnum = pgEnum('priority', [
  'Very_Low',
  'Low',
  'Medium',
  'High',
  'Very_High',
]);

export const recurrenceEndTypeEnum = pgEnum('recurrence_end_type', [
  'never',
  'after_count',
  'on_date',
]);

/* ---------- Types ---------- */

export type Priority = (typeof priorityEnum.enumValues)[number];
export type RecurrenceEndType =
  (typeof recurrenceEndTypeEnum.enumValues)[number];

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: Array<number>; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
}

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

    tagIds: json('tag_ids').$type<Array<string>>().default([]).notNull(),

    // Skill integration
    subSkillId: uuid('sub_skill_id').references(() => subSkills.id, {
      onDelete: 'set null',
    }),

    // Recurring task fields
    isRecurring: boolean('is_recurring').default(false).notNull(),
    recurrenceRule: json('recurrence_rule').$type<RecurrenceRule>(),
    recurrenceEndType: recurrenceEndTypeEnum('recurrence_end_type'),
    recurrenceEndValue: integer('recurrence_end_value'),
    parentTaskId: uuid('parent_task_id'),

    ...resourceTimestamps,
  },
  (table) => ({
    todoListFk: foreignKey({
      columns: [table.todoListDate, table.userId],
      foreignColumns: [todoLists.date, todoLists.userId],
    }),
    parentTaskFk: foreignKey({
      columns: [table.parentTaskId],
      foreignColumns: [table.id],
    }),
  }),
);

/* ---------- Inferred Types ---------- */

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
