import { z } from 'zod';
import type { UserSettings } from '@/db/schemas/user.schema';
import {
  appearanceThemeEnum,
  todoListSortByEnum,
  todoListTimeSpanEnum,
} from '@/db/schemas/user.schema';

/* ---------- Enum Schemas ---------- */

export const appearanceThemeSchema = z.enum(appearanceThemeEnum.enumValues);
export const todoListSortBySchema = z.enum(todoListSortByEnum.enumValues);
export const todoListTimeSpanSchema = z.enum(todoListTimeSpanEnum.enumValues);

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
});

export type PatchUserSettings = z.infer<typeof patchUserSettingsSchema>;
