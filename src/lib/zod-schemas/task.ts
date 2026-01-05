import { z } from 'zod';
import { priorityEnum, recurrenceEndTypeEnum } from '@/db/schemas/task.schema';

/* ---------- Priority Schema ---------- */

export const prioritySchema = z.enum(priorityEnum.enumValues);

/* ---------- Recurrence Schemas ---------- */

export const recurrenceEndTypeSchema = z.enum(recurrenceEndTypeEnum.enumValues);

export const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().positive(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
});

/* ---------- Task Schemas ---------- */

export const createTaskSchema = z.object({
  todoListDate: z.date(),
  name: z.string(),
  description: z.string().optional(),
  priority: prioritySchema.optional(),
  dueDate: z.date().optional(),
  completed: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  subSkillId: z.string().uuid().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: recurrenceRuleSchema.optional(),
  recurrenceEndType: recurrenceEndTypeSchema.optional(),
  recurrenceEndValue: z.number().int().positive().optional(),
  parentTaskId: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  todoListDate: z.date().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  priority: prioritySchema.optional(),
  dueDate: z.date().nullable().optional(),
  completed: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  subSkillId: z.string().uuid().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: recurrenceRuleSchema.nullable().optional(),
  recurrenceEndType: recurrenceEndTypeSchema.nullable().optional(),
  recurrenceEndValue: z.number().int().positive().nullable().optional(),
});

export const getTaskSchema = z.object({
  id: z.string().uuid(),
});

export const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});

export const listTasksBySubSkillSchema = z.object({
  subSkillId: z.string().uuid(),
});

export const completeTaskWithMetricUpdateSchema = z.object({
  id: z.string().uuid(),
  completed: z.boolean(),
});
