import { date, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './user.schema';

/* ---------- Table ---------- */

export const userMetrics = pgTable('user_metrics', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),

  // Totals
  tasksCompleted: integer('tasks_completed').default(0).notNull(),
  tasksCreated: integer('tasks_created').default(0).notNull(),
  subSkillsCompleted: integer('sub_skills_completed').default(0).notNull(),
  skillsArchived: integer('skills_archived').default(0).notNull(),

  // Streaks
  currentStreak: integer('current_streak').default(0).notNull(),
  bestStreak: integer('best_streak').default(0).notNull(),
  lastActivityDate: date('last_activity_date', { mode: 'date' }),

  // Weekly tracking
  weeklyGoal: integer('weekly_goal').default(10).notNull(),
  weeklyCompleted: integer('weekly_completed').default(0).notNull(),
  weekStartDate: date('week_start_date', { mode: 'date' }),

  // XP/Level system
  totalXp: integer('total_xp').default(0).notNull(),

  // Timestamps
  updatedAt: timestamp('updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* ---------- Inferred Types ---------- */

export type UserMetrics = typeof userMetrics.$inferSelect;
export type NewUserMetrics = typeof userMetrics.$inferInsert;
