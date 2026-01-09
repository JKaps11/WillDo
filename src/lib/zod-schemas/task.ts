import { z } from 'zod';
import {
  daysOfWeekEnum,
  priorityEnum,
  recurrenceEndTypeEnum,
  recurrenceFrequencyEnum,
} from '@/db/schemas/task.schema';

/* ---------- Enum Schemas ---------- */

export const prioritySchema = z.enum(priorityEnum.enumValues);
export const recurrenceEndTypeSchema = z.enum(recurrenceEndTypeEnum.enumValues);
export const recurrenceFrequencySchema = z.enum(
  recurrenceFrequencyEnum.enumValues,
);
export const daysOfWeekSchema = z.enum(daysOfWeekEnum.enumValues);

/* ---------- Recurrence Rule Schema ---------- */

export const recurrenceRuleSchema = z.object({
  isRecurring: z.boolean(),
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().positive(),
  daysOfWeek: z.array(daysOfWeekSchema).optional(),
  endType: recurrenceEndTypeSchema,
  endAfterCount: z.number().int().positive().optional(),
  endOnDate: z.string().optional(),
});

/* ---------- Task Schemas ---------- */

export const createTaskSchema = z.object({
  todoListDate: z.date().nullable().optional(),
  name: z.string(),
  description: z.string().optional(),
  priority: prioritySchema.optional(),
  dueDate: z.date().optional(),
  completed: z.boolean().optional(),
  subSkillId: z.uuid(),
  recurrenceRule: recurrenceRuleSchema.optional(),
});

export const updateTaskSchema = z.object({
  id: z.uuid(),
  todoListDate: z.date().nullable().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  priority: prioritySchema.optional(),
  dueDate: z.date().nullable().optional(),
  completed: z.boolean().optional(),
  subSkillId: z.uuid().optional(),
  recurrenceRule: recurrenceRuleSchema.nullable().optional(),
});

export const getTaskSchema = z.object({
  id: z.uuid(),
});

export const deleteTaskSchema = z.object({
  id: z.uuid(),
});

export const listTasksBySubSkillSchema = z.object({
  subSkillId: z.uuid(),
});

export const completeTaskWithMetricUpdateSchema = z.object({
  id: z.uuid(),
  completed: z.boolean(),
});
