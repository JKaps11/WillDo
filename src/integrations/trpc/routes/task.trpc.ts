import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  completeTaskWithMetricUpdateSchema,
  createTaskSchema,
  deleteTaskSchema,
  getTaskSchema,
  listTasksBySubSkillSchema,
  updateTaskSchema,
} from '@/lib/zod-schemas';
import { skillRepository } from '@/db/repositories/skill.repository';
import { taskRepository } from '@/db/repositories/task.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const taskRouter = {
  get: protectedProcedure.input(getTaskSchema).query(async ({ ctx, input }) => {
    addWide({ task_id: input.id });
    const task = await taskRepository.findById(input.id, ctx.userId);
    if (!task) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    return task;
  }),

  listUnassigned: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await taskRepository.findUnassigned(ctx.userId);
    addWide({ tasks_count: tasks.length });
    return tasks;
  }),

  listUnassignedWithSkillInfo: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await taskRepository.findUnassignedWithSkillInfo(ctx.userId);
    addWide({ tasks_count: tasks.length });
    return tasks;
  }),

  listBySubSkill: protectedProcedure
    .input(listTasksBySubSkillSchema)
    .query(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.subSkillId });
      const tasks = await taskRepository.findBySubSkillId(
        input.subSkillId,
        ctx.userId,
      );
      addWide({ tasks_count: tasks.length });
      return tasks;
    }),

  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ task_name: input.name, sub_skill_id: input.subSkillId });
      const task = await taskRepository.create({
        ...input,
        userId: ctx.userId,
      });

      if (!task) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task',
        });
      }
      addWide({ task_id: task.id });

      return task;
    }),

  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      addWide({ task_id: id });
      const task = await taskRepository.update(id, ctx.userId, updates);

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return task;
    }),

  delete: protectedProcedure
    .input(deleteTaskSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ task_id: input.id });
      const task = await taskRepository.delete(input.id, ctx.userId);

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return task;
    }),

  completeWithMetricUpdate: protectedProcedure
    .input(completeTaskWithMetricUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ task_id: input.id, completed: input.completed });
      const existingTask = await taskRepository.findById(input.id, ctx.userId);
      if (!existingTask) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const task = await taskRepository.update(input.id, ctx.userId, {
        completed: input.completed,
      });

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const metrics = await skillRepository.findMetricsBySubSkillId(
        task.subSkillId,
        ctx.userId,
      );

      if (metrics.length > 0) {
        const metricId: string = metrics[0].id;
        addWide({ metric_id: metricId });

        if (input.completed && !existingTask.completed) {
          await skillRepository.incrementMetric(metricId, ctx.userId, 1);
          addWide({ metric_incremented: 1 });
        } else if (!input.completed && existingTask.completed) {
          await skillRepository.incrementMetric(metricId, ctx.userId, -1);
          addWide({ metric_incremented: -1 });
        }
      }

      return task;
    }),
};
