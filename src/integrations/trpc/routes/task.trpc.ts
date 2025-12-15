import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import type { NewTask, Task } from '@/db/schemas/task.schema';
import { priorityEnum, tasks } from '@/db/schemas/task.schema';

/* ---------- Shared Zod Helpers ---------- */

// Single source of truth for enum
const prioritySchema = z.enum(priorityEnum.enumValues);

/* ---------- Input Types (derived, not redefined) */

type CreateTaskInput = Omit<
    NewTask,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

type UpdateTaskInput = Partial<CreateTaskInput> & {
    id: Task['id'];
};

/* ---------- Zod Schemas (constrained to types) */

const createTaskSchema: z.ZodType<CreateTaskInput> = z.object({
    todoListDate: z.date(),
    name: z.string(),
    description: z.string().optional(),
    priority: prioritySchema.optional(),
    dueDate: z.date().optional(),
    completed: z.boolean().optional(),
});

const updateTaskSchema: z.ZodType<UpdateTaskInput> = z.object({
    id: z.uuid(),
    todoListDate: z.date().optional(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    priority: prioritySchema.optional(),
    dueDate: z.date().nullable().optional(),
    completed: z.boolean().optional(),
});

/* ---------- Router ---------- */

export const taskRouter = {
    /** GET /task */
    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const result = await ctx.db
                .select()
                .from(tasks)
                .where(
                    and(
                        eq(tasks.id, input.id),
                        eq(tasks.userId, userId),
                    ),
                )
                .limit(1);

            if (result.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return result[0];
        }),

    /** POST /task */
    create: protectedProcedure
        .input(createTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const [task] = await ctx.db
                .insert(tasks)
                .values({
                    ...input,
                    userId,
                })
                .returning();

            return task;
        }),

    /** PUT /task */
    update: protectedProcedure
        .input(updateTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const { id, ...updates } = input;

            const result = await ctx.db
                .update(tasks)
                .set(updates)
                .where(
                    and(
                        eq(tasks.id, id),
                        eq(tasks.userId, userId),
                    ),
                )
                .returning();

            if (result.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return result[0];
        }),

    /** DELETE /task */
    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const result = await ctx.db
                .delete(tasks)
                .where(
                    and(
                        eq(tasks.id, input.id),
                        eq(tasks.userId, userId),
                    ),
                )
                .returning();

            if (result.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return result[0];
        }),
};
