import { z } from 'zod';
import { priorityEnum } from '@/db/schemas/task.schema';

/* ---------- Priority Schema ---------- */

export const prioritySchema = z.enum(priorityEnum.enumValues);

/* ---------- Task Schemas ---------- */

export const createTaskSchema = z.object({
  todoListDate: z.date(),
  name: z.string(),
  description: z.string().optional(),
  priority: prioritySchema.optional(),
  dueDate: z.date().optional(),
  completed: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
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
});

export const getTaskSchema = z.object({
  id: z.string().uuid(),
});

export const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});
