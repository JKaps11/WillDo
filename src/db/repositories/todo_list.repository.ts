import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import type { NewTodoList, TodoList } from '@/db/schemas/todo_list.schema';
import type { SkillMetric } from '@/db/schemas/skill_metric.schema';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { Skill } from '@/db/schemas/skill.schema';
import type { Task } from '@/db/schemas/task.schema';
import { skillMetrics } from '@/db/schemas/skill_metric.schema';
import { todoLists } from '@/db/schemas/todo_list.schema';
import { subSkills } from '@/db/schemas/sub_skill.schema';
import { skills } from '@/db/schemas/skill.schema';
import { tasks } from '@/db/schemas/task.schema';
import { db } from '@/db/index';

export interface TaskWithSkillContext extends Task {
  subSkill: SubSkill | null;
  skill: Skill | null;
  metrics: Array<SkillMetric>;
}

export type TodoListWithTasks = TodoList & {
  tasks: Array<TaskWithSkillContext>;
};

export const todoListRepository = {
  findByDate: async (userId: string, date: Date): Promise<TodoList | null> => {
    const result = await db
      .select()
      .from(todoLists)
      .where(and(eq(todoLists.userId, userId), eq(todoLists.date, date)));

    return result[0];
  },

  findWithTasksByDateRange: async (
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<TodoListWithTasks>> => {
    // First, get all todo lists with tasks
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

    // Collect unique subSkillIds from tasks
    const subSkillIds = [
      ...new Set(
        rows
          .map((r) => r.task?.subSkillId)
          .filter((id): id is string => id != null),
      ),
    ];

    // Fetch sub-skills with their skills if there are any
    let subSkillMap = new Map<string, { subSkill: SubSkill; skill: Skill }>();
    const metricsMap = new Map<string, Array<SkillMetric>>();

    if (subSkillIds.length > 0) {
      const subSkillResults = await db
        .select({
          subSkill: subSkills,
          skill: skills,
        })
        .from(subSkills)
        .innerJoin(skills, eq(subSkills.skillId, skills.id))
        .where(inArray(subSkills.id, subSkillIds));

      subSkillMap = new Map(subSkillResults.map((r) => [r.subSkill.id, r]));

      // Fetch metrics for these sub-skills
      const metricResults = await db
        .select()
        .from(skillMetrics)
        .where(inArray(skillMetrics.subSkillId, subSkillIds));

      for (const metric of metricResults) {
        const existing = metricsMap.get(metric.subSkillId) ?? [];
        existing.push(metric);
        metricsMap.set(metric.subSkillId, existing);
      }
    }

    // Build the result map
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
        const subSkillData = row.task.subSkillId
          ? subSkillMap.get(row.task.subSkillId)
          : null;

        const taskWithContext: TaskWithSkillContext = {
          ...row.task,
          subSkill: subSkillData?.subSkill ?? null,
          skill: subSkillData?.skill ?? null,
          metrics: row.task.subSkillId
            ? (metricsMap.get(row.task.subSkillId) ?? [])
            : [],
        };

        map.get(key)!.tasks.push(taskWithContext);
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
