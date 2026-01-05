import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import type { TodoList } from '@/db/schemas/todo_list.schema';
import {
  completeTaskWithMetricUpdateSchema,
  createTaskSchema,
  deleteTaskSchema,
  getTaskSchema,
  listTasksBySubSkillSchema,
  updateTaskSchema,
} from '@/lib/zod-schemas';
import { todoListRepository } from '@/db/repositories/todo_list.repository';
import { subSkillRepository } from '@/db/repositories/sub_skill.repository';
import { skillRepository } from '@/db/repositories/skill.repository';
import { taskRepository } from '@/db/repositories/task.repository';

export const taskRouter = {
  /** GET /task */
  get: protectedProcedure.input(getTaskSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;
    const task = await taskRepository.findById(input.id, userId);

    if (!task) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return task;
  }),

  /** GET /task/unassigned - Get all tasks without a due date */
  listUnassigned: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const tasks = await taskRepository.findUnassigned(userId);
    return tasks;
  }),

  /** GET /task/unassignedWithSkillInfo - Get all unassigned tasks with enriched skill data */
  listUnassignedWithSkillInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const tasks = await taskRepository.findUnassignedWithSkillInfo(userId);
    return tasks;
  }),

  /** POST /task */
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Ensure Todolist is created
      const todoList: TodoList | null = await todoListRepository.findByDate(
        userId,
        input.todoListDate,
      );
      if (!todoList)
        await todoListRepository.create({
          userId,
          date: input.todoListDate,
        });

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
        const todoList = await todoListRepository.findByDate(
          userId,
          updates.todoListDate,
        );
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

  /** GET /task/bySubSkill - List tasks for a specific sub-skill */
  listBySubSkill: protectedProcedure
    .input(listTasksBySubSkillSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const tasks = await taskRepository.findBySubSkillId(
        input.subSkillId,
        userId,
      );
      return tasks;
    }),

  /** POST /task/completeWithMetricUpdate - Complete a task and update associated metric */
  completeWithMetricUpdate: protectedProcedure
    .input(completeTaskWithMetricUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Get the task first
      const existingTask = await taskRepository.findById(input.id, userId);
      if (!existingTask) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Update the task completion status
      const task = await taskRepository.update(input.id, userId, {
        completed: input.completed,
      });

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // If task is being completed and has a sub-skill, increment the metric
      if (input.completed && task.subSkillId) {
        const metrics = await skillRepository.findMetricsBySubSkillId(
          task.subSkillId,
          userId,
        );

        // Increment the first metric (main metric for the sub-skill)
        if (metrics.length > 0) {
          await skillRepository.incrementMetric(metrics[0].id, userId, 1);
        }
      }

      // If task is being uncompleted and has a sub-skill, decrement the metric
      if (!input.completed && existingTask.completed && task.subSkillId) {
        const metrics = await skillRepository.findMetricsBySubSkillId(
          task.subSkillId,
          userId,
        );

        // Decrement the first metric
        if (metrics.length > 0) {
          await skillRepository.incrementMetric(metrics[0].id, userId, -1);
        }
      }

      return task;
    }),

  /** POST /task/createFromSubSkill - Create a task from a sub-skill */
  createFromSubSkill: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // If subSkillId is provided, verify it exists
      if (input.subSkillId) {
        const subSkill = await subSkillRepository.findById(
          input.subSkillId,
          userId,
        );
        if (!subSkill) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sub-skill not found',
          });
        }
      }

      // Ensure TodoList is created
      const todoList: TodoList | null = await todoListRepository.findByDate(
        userId,
        input.todoListDate,
      );
      if (!todoList) {
        await todoListRepository.create({
          userId,
          date: input.todoListDate,
        });
      }

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
};
