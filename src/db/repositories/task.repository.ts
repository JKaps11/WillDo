import { and, eq, gte, isNotNull, isNull, lte, or } from 'drizzle-orm';
import type { NewTask, Task } from '@/db/schemas/task.schema';
import { tasks } from '@/db/schemas/task.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { skills } from '@/db/schemas/skill.schema';
import { db } from '@/db/index';

export interface TaskWithSkillInfo extends Task {
  subSkillName: string;
  skillId: string;
  skillName: string;
  skillColor: string;
}

export interface TodoListDay {
  date: Date;
  tasks: Array<Task>;
}

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

  /**
   * Find tasks for the todo list view within a date range.
   * Fetches:
   * 1. Non-recurring tasks with todoListDate in range
   * 2. Recurring tasks with todoListDate <= endDate (they might recur into this range)
   */
  findForTodoList: async (
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
          or(
            // Non-recurring tasks in range
            and(
              gte(tasks.todoListDate, startDate),
              lte(tasks.todoListDate, endDate),
            ),
            // Recurring tasks that start before or on endDate
            and(isNotNull(tasks.recurrenceRule), lte(tasks.todoListDate, endDate)),
          ),
        ),
      )
      .orderBy(tasks.todoListDate);
  },

  findUnassignedWithSkillInfo: async (
    userId: string,
  ): Promise<Array<TaskWithSkillInfo>> => {
    const result = await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        todoListDate: tasks.todoListDate,
        name: tasks.name,
        description: tasks.description,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        completed: tasks.completed,
        subSkillId: tasks.subSkillId,
        recurrenceRule: tasks.recurrenceRule,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        subSkillName: subSkills.name,
        skillId: skills.id,
        skillName: skills.name,
        skillColor: skills.color,
      })
      .from(tasks)
      .innerJoin(subSkills, eq(tasks.subSkillId, subSkills.id))
      .innerJoin(skills, eq(subSkills.skillId, skills.id))
      .where(
        and(
          eq(tasks.userId, userId),
          isNull(tasks.todoListDate),
          eq(tasks.completed, false),
        ),
      );

    return result;
  },
};
