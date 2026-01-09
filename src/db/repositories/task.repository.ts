import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import type { NewTask, Task } from '@/db/schemas/task.schema';
import { tasks } from '@/db/schemas/task.schema';
import { db } from '@/db/index';

export const taskRepository = {
  findById: async (id: string, userId: string): Promise<Task | null> => {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  },

  create: async (
    data: Omit<NewTask, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Task | null> => {
    const result = await db.insert(tasks).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<Omit<NewTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Task | null> => {
    const result = await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  delete: async (id: string, userId: string): Promise<Task | null> => {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  findUnassigned: async (userId: string): Promise<Array<Task>> => {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNull(tasks.todoListDate)));
  },

  findBySubSkillId: async (
    subSkillId: string,
    userId: string,
  ): Promise<Array<Task>> => {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.subSkillId, subSkillId), eq(tasks.userId, userId)));
  },

  findByDateRange: async (
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<Task>> => {
    return db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.todoListDate, startDate),
          lte(tasks.todoListDate, endDate),
        ),
      )
      .orderBy(tasks.todoListDate);
  },
};
