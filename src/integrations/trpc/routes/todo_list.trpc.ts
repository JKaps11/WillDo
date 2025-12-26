import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import type { TRPCRouterRecord } from '@trpc/server';

import { todoListRepository } from '@/db/repositories/todo_list.repository';
import { weekDateSchema } from '@/lib/zod-schemas';
import { endOfWeek, startOfWeek } from '@/utils/dates';

export const todoListRouter = {
    /** GET /todoList */
    list: protectedProcedure
        .input(weekDateSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const start = startOfWeek(input);
            const end = endOfWeek(input);

            return await todoListRepository.findWithTasksByDateRange(
                userId,
                start,
                end,
            );
        }),

    /** POST /todoList */
    add: protectedProcedure
        .input(weekDateSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            try {
                const todoList = await todoListRepository.create({
                    userId,
                    date: input,
                });

                if (!todoList) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to create todo list',
                    });
                }

                return todoList;
            } catch (err) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create todo list',
                    cause: err,
                });
            }
        }),
} satisfies TRPCRouterRecord;
