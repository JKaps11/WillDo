import {
  appearanceThemeEnum,
  calendarViewEnum,
  defaultHomePageEnum,
  todoListSortByEnum,
  todoListTimeSpanEnum,
} from '@/db/schemas/user.schema';
import type { UserSettings } from '@/db/schemas/user.schema';
import { z } from 'zod';

/* ---------- Enum Schemas ---------- */

export const appearanceThemeSchema = z.enum(appearanceThemeEnum.enumValues);
export const todoListSortBySchema = z.enum(todoListSortByEnum.enumValues);
export const todoListTimeSpanSchema = z.enum(todoListTimeSpanEnum.enumValues);
export const calendarViewSchema = z.enum(calendarViewEnum.enumValues);
export const defaultHomePageSchema = z.enum(defaultHomePageEnum.enumValues);

/* ---------- User Settings Schema ---------- */

export const userSettingsSchema: z.ZodType<UserSettings> = z.object({
  general: z.object({
    defaultHomePage: defaultHomePageSchema,
  }),
  appearance: z.object({
    theme: appearanceThemeSchema,
  }),
  todoList: z.object({
    sortBy: todoListSortBySchema,
    timeSpan: todoListTimeSpanSchema,
    showCompleted: z.boolean(),
  }),
  calendar: z.object({
    startOfWeek: z.union([z.literal(0), z.literal(1), z.literal(6)]),
    defaultEventDuration: z.union([
      z.literal(30),
      z.literal(60),
      z.literal(90),
      z.literal(120),
    ]),
    defaultView: calendarViewSchema,
    googleCalendarSync: z.boolean(),
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
  general: z
    .object({
      defaultHomePage: defaultHomePageSchema,
    })
    .optional(),
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
  calendar: z
    .object({
      startOfWeek: z.union([z.literal(0), z.literal(1), z.literal(6)]),
      defaultEventDuration: z.union([
        z.literal(30),
        z.literal(60),
        z.literal(90),
        z.literal(120),
      ]),
      defaultView: calendarViewSchema,
      googleCalendarSync: z.boolean(),
    })
    .optional(),
});

export type PatchUserSettings = z.infer<typeof patchUserSettingsSchema>;
