import { jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

/* ---------- Enums ---------- */

export const appearanceThemeEnum = pgEnum('appearance_theme', [
  'light',
  'dark',
  'system',
]);

export const todoListTimeSpanEnum = pgEnum('todo_list_time_span', [
  'day',
  'week',
]);

export const todoListSortByEnum = pgEnum('todo_list_sort_by', [
  'date',
  'priority',
  'alphabetical',
]);

// export const calendarViewEnum = pgEnum('calendar_view', [
//   'month',
//   'week',
//   'day',
// ]);

/* ---------- Types ---------- */
export type AppearanceTheme = (typeof appearanceThemeEnum.enumValues)[number];

export type TodoListTimeSpan = (typeof todoListTimeSpanEnum.enumValues)[number];

export type TodoListSortBy = (typeof todoListSortByEnum.enumValues)[number];

// export type CalendarView = (typeof calendarViewEnum.enumValues)[number];

export interface UserSettings {
  appearance: {
    theme: AppearanceTheme;
  };
  todoList: {
    sortBy: TodoListSortBy;
    timeSpan: TodoListTimeSpan;
    showCompleted: boolean;
  };
  // calendar: {
  //   startOfWeek: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  //   defaultEventDuration: 30 | 60 | 90 | 120; // minutes
  //   defaultView: CalendarView;
  //   googleCalendarSync: boolean;
  // };
}

/* ---------- Defaults ---------- */

export const DEFAULT_USER_SETTINGS: UserSettings = {
  appearance: {
    theme: 'system',
  },
  todoList: {
    sortBy: 'priority',
    timeSpan: 'week',
    showCompleted: true,
  },
  // calendar: {
  //   startOfWeek: 0,
  //   defaultEventDuration: 60,
  //   defaultView: 'week',
  //   googleCalendarSync: false,
  // },
};

/* ---------- Table ---------- */

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  settings: jsonb('settings')
    .$type<UserSettings>()
    .notNull()
    .default(DEFAULT_USER_SETTINGS),
  activeSkillId: text('active_skill_id'),
});

/* ---------- Inferred Types ---------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
