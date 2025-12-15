import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { protectedProcedure } from '../init';
import { endOfWeek, startOfWeek } from './utils';
import type { TRPCRouterRecord } from '@trpc/server';

import type { TodoList } from '@/db/schemas/todo_list.schema';
import type { Task } from '@/db/schemas/task.schema';
import { todoLists } from '@/db/schemas/todo_list.schema';
import { tasks } from '@/db/schemas/task.schema';


/* ---------- Input Types (DB-driven) ---------- */

// list + tasks is a view model, not a DB table → define once here
type TodoListWithTasks = TodoList & {
    tasks: Array<Task>;
};

/* ---------- Input Schemas ---------- */

// Single date drives the week
const weekDateSchema = z.date();

/* ---------- Router ---------- */

export const todoListRouter = {
    /** GET /todoList */
    list: protectedProcedure
        .input(weekDateSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const start = startOfWeek(input);
            const end = endOfWeek(input);

            const rows = await ctx.db
                .select({
                    list: todoLists,
                    task: tasks,
                })
                .from(todoLists)
                .leftJoin(
                    tasks,
                    and(
                        eq(tasks.userId, todoLists.userId),
                        eq(tasks.todoListDate, todoLists.date),
                    ),
                )
                .where(
                    and(
                        eq(todoLists.userId, userId),
                        gte(todoLists.date, start),
                        lte(todoLists.date, end),
                    ),
                )
                .orderBy(todoLists.date);

            const map = new Map<string, TodoListWithTasks>();

            for (const row of rows) {
                const key = row.list.date.toISOString();

                if (!map.has(key)) {
                    map.set(key, {
                        ...row.list,
                        tasks: [],
                    });
                }

                if (row.task) {
                    map.get(key)!.tasks.push(row.task);
                }
            }

            return Array.from(map.values());
        }),

    /** POST /todoList */ // TODO: this should be a cron job
    add: protectedProcedure
        .input(weekDateSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            try {
                await ctx.db
                    .insert(todoLists)
                    .values({
                        userId,
                        date: input,
                    })
                    .onConflictDoNothing();
            } catch (err) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create todo list',
                    cause: err,
                });
            }
        }),
} satisfies TRPCRouterRecord;
