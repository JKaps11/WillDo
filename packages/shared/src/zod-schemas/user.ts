import { z } from 'zod';
import type { UserSettings } from '../db-types';
import {
  APPEARANCE_THEME_VALUES,
  TODO_LIST_SORT_BY_VALUES,
  TODO_LIST_TIME_SPAN_VALUES,
} from '../db-types';

/* ---------- Enum Schemas ---------- */

export const appearanceThemeSchema = z.enum(APPEARANCE_THEME_VALUES);
export const todoListSortBySchema = z.enum(TODO_LIST_SORT_BY_VALUES);
export const todoListTimeSpanSchema = z.enum(TODO_LIST_TIME_SPAN_VALUES);

/* ---------- Notification Settings Schema ---------- */

export const notificationSettingsSchema = z.object({
  streakWarnings: z.boolean(),
  nudges: z.boolean(),
  celebrations: z.boolean(),
  taskReminders: z.boolean(),
});

/* ---------- User Settings Schema ---------- */

export const userSettingsSchema: z.ZodType<UserSettings> = z.object({
  appearance: z.object({
    theme: appearanceThemeSchema,
  }),
  todoList: z.object({
    sortBy: todoListSortBySchema,
    timeSpan: todoListTimeSpanSchema,
    showCompleted: z.boolean(),
  }),
  notifications: notificationSettingsSchema,
});

/* ---------- User Input Schemas ---------- */

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string(),
  settings: userSettingsSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  settings: userSettingsSchema.optional(),
  activeSkillId: z.string().uuid().nullable().optional(),
});

export const setActiveSkillSchema = z.object({
  skillId: z.string().uuid(),
});

/* ---------- Patch Settings Schema (Partial Updates) ---------- */

export const patchUserSettingsSchema = z.object({
  appearance: z
    .object({
      theme: appearanceThemeSchema,
    })
    .optional(),
  todoList: z
    .object({
      sortBy: todoListSortBySchema,
      timeSpan: todoListTimeSpanSchema,
      showCompleted: z.boolean(),
    })
    .optional(),
  notifications: notificationSettingsSchema.optional(),
});

export type PatchUserSettings = z.infer<typeof patchUserSettingsSchema>;
