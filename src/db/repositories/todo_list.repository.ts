import { and, eq, gte, lte } from 'drizzle-orm';
import type {NewTodoList, TodoList} from '@/db/schemas/todo_list.schema';
import type {Task} from '@/db/schemas/task.schema';
import { db } from '@/db/index';
import {   todoLists } from '@/db/schemas/todo_list.schema';
import {  tasks } from '@/db/schemas/task.schema';

export type TodoListWithTasks = TodoList & {
    tasks: Array<Task>;
};

export const todoListRepository = {
    findByDate: async (
        userId: string,
        date: Date,
    ): Promise<TodoList | null> => {
        const result = await db
            .select()
            .from(todoLists)
            .where(
                and(
                    eq(todoLists.userId, userId),
                    eq(todoLists.date, date)
                )
            )

        return result[0]
    },
    findWithTasksByDateRange: async (
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<Array<TodoListWithTasks>> => {
        const rows = await db
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
                    gte(todoLists.date, startDate),
                    lte(todoLists.date, endDate),
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
    },

    create: async (data: NewTodoList): Promise<TodoList | null> => {
        const result = await db
            .insert(todoLists)
            .values(data)
            .onConflictDoNothing()
            .returning();

        return result[0] ?? null;
    },
};
