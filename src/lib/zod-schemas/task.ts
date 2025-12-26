import { z } from 'zod';
import type { NewTask, Task } from '@/db/schemas/task.schema';
import { priorityEnum } from '@/db/schemas/task.schema';

/* ---------- Priority Schema ---------- */

export const prioritySchema = z.enum(priorityEnum.enumValues);

/* ---------- Task Schemas ---------- */

export const createTaskSchema: z.ZodType<
    Omit<NewTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> = z.object({
    todoListDate: z.date(),
    name: z.string(),
    description: z.string().optional(),
    priority: prioritySchema.optional(),
    dueDate: z.date().optional(),
    completed: z.boolean().optional(),
});

export const updateTaskSchema: z.ZodType<
    Partial<Omit<NewTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & {
        id: Task['id'];
    }
> = z.object({
    id: z.uuid(),
    todoListDate: z.date().optional(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    priority: prioritySchema.optional(),
    dueDate: z.date().nullable().optional(),
    completed: z.boolean().optional(),
});

export const getTaskSchema = z.object({
    id: z.uuid(),
});

export const deleteTaskSchema = z.object({
    id: z.string().uuid(),
});
