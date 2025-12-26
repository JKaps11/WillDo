import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import type { TodoList } from '@/db/schemas/todo_list.schema';
import { taskRepository } from '@/db/repositories/task.repository';
import {
    createTaskSchema,
    deleteTaskSchema,
    getTaskSchema,
    updateTaskSchema,
} from '@/lib/zod-schemas';
import { todoListRepository } from '@/db/repositories/todo_list.repository';

export const taskRouter = {
    /** GET /task */
    get: protectedProcedure
        .input(getTaskSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const task = await taskRepository.findById(input.id, userId);

            if (!task) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return task;
        }),

    /** POST /task */
    create: protectedProcedure
        .input(createTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;

            // Ensure Todolist is created
            const todoList: TodoList | null = await todoListRepository.findByDate(userId, input.todoListDate)
            if (!todoList) await todoListRepository.create({
                userId, 
                date: input.todoListDate
            })

            const task = await taskRepository.create({
                ...input,
                userId,
            });

            if (!task) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create task',
                });
            }

            return task;
        }),

    /** PUT /task */
    update: protectedProcedure
        .input(updateTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const { id, ...updates } = input;

            // If moving to a new date, ensure TodoList exists
            if (updates.todoListDate) {
                const todoList = await todoListRepository.findByDate(userId, updates.todoListDate);
                if (!todoList) {
                    await todoListRepository.create({
                        userId,
                        date: updates.todoListDate,
                    });
                }
            }

            const task = await taskRepository.update(id, userId, updates);

            if (!task) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return task;
        }),

    /** DELETE /task */
    delete: protectedProcedure
        .input(deleteTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const task = await taskRepository.delete(input.id, userId);

            if (!task) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return task;
        }),
};
