import {
  boolean,
  date,
  index,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
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

export const recurrenceFrequencyEnum = pgEnum('recurrence_frequency', [
  'daily',
  'weekly',
]);

export const daysOfWeekEnum = pgEnum('days_of_week', [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);

/* ---------- Types ---------- */

export type Priority = (typeof priorityEnum.enumValues)[number];
export type RecurrenceEndType =
  (typeof recurrenceEndTypeEnum.enumValues)[number];
export type RecurrenceFrequency =
  (typeof recurrenceFrequencyEnum.enumValues)[number];

export type DaysOfWeek = (typeof daysOfWeekEnum.enumValues)[number];

export type RecurrenceExceptionAction = 'skip' | 'moved';

export interface RecurrenceException {
  originalDate: string; // ISO date (YYYY-MM-DD) of the occurrence being modified
  action: RecurrenceExceptionAction;
  movedToDate?: string; // ISO date where it was moved to (only for action='moved')
}

export interface RecurrenceRule {
  isRecurring: boolean;
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: Array<DaysOfWeek>;
  endType: RecurrenceEndType;
  endAfterCount?: number;
  endOnDate?: string;
  exceptions?: Array<RecurrenceException>;
}

/* ---------- Table ---------- */

export const tasks = pgTable(
  'task',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    todoListDate: date('todo_list_date', { mode: 'date' }),

    name: text('name').notNull(),
    description: text('description'),

    priority: priorityEnum().default('Medium').notNull(),
    dueDate: timestamp('due_date'),
    completed: boolean('completed').default(false).notNull(),

    subSkillId: uuid('sub_skill_id')
      .notNull()
      .references(() => subSkills.id, { onDelete: 'cascade' }),

    recurrenceRule: json('recurrence_rule').$type<RecurrenceRule>(),

    ...resourceTimestamps,
  },
  (table) => [index('task_user_date_idx').on(table.userId, table.todoListDate)],
);

/* ---------- Inferred Types ---------- */

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
