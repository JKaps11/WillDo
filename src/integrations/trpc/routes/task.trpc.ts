import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import type { Task } from '@/db/schemas/task.schema';
import type { PracticeEvaluation } from '@/db/schemas/practice_evaluation.schema';
import {
  completeTaskWithEvaluationSchema,
  completeTaskWithMetricUpdateSchema,
  createTaskSchema,
  deleteTaskSchema,
  getTaskSchema,
  listTasksBySubSkillSchema,
  updateTaskSchema,
} from '@/lib/zod-schemas';
import { db } from '@/db/index';
import { practiceEvaluationRepository } from '@/db/repositories/practice_evaluation.repository';
import { skillRepository } from '@/db/repositories/skill.repository';
import { taskRepository } from '@/db/repositories/task.repository';
import { subSkillRepository } from '@/db/repositories/sub_skill.repository';
import { completionEventRepository } from '@/db/repositories/completion_event.repository';
import { userMetricsRepository } from '@/db/repositories/user_metrics.repository';
import { XP_TASK_COMPLETE } from '@/lib/constants/xp';
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

      return db.transaction(async (tx) => {
        const task = await taskRepository.create(
          {
            ...input,
            userId: ctx.userId,
          },
          tx,
        );

        if (!task) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create task',
          });
        }
        addWide({ task_id: task.id });

        // Track task creation for metrics
        await userMetricsRepository.incrementTasksCreated(ctx.userId, tx);

        return task;
      });
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

      // Get skillId for completion event (reads can stay outside tx)
      const subSkill = await subSkillRepository.findById(
        existingTask.subSkillId,
        ctx.userId,
      );
      const skillId = subSkill?.skillId ?? null;

      const metrics = await skillRepository.findMetricsBySubSkillId(
        existingTask.subSkillId,
        ctx.userId,
      );

      return db.transaction(async (tx) => {
        const task = await taskRepository.update(
          input.id,
          ctx.userId,
          {
            completed: input.completed,
          },
          tx,
        );

        if (!task) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        if (metrics.length > 0) {
          const metricId: string = metrics[0].id;
          addWide({ metric_id: metricId });

          if (input.completed && !existingTask.completed) {
            await skillRepository.incrementMetric(metricId, ctx.userId, 1, tx);
            addWide({ metric_incremented: 1 });
          } else if (!input.completed && existingTask.completed) {
            await skillRepository.incrementMetric(metricId, ctx.userId, -1, tx);
            addWide({ metric_incremented: -1 });
          }
        }

        // Handle completion event tracking
        if (input.completed && !existingTask.completed) {
          // Task was just completed
          await completionEventRepository.create(
            {
              userId: ctx.userId,
              eventType: 'task_completed',
              entityId: task.id,
              skillId,
            },
            tx,
          );
          await userMetricsRepository.incrementTasksCompleted(ctx.userId, tx);
          await userMetricsRepository.updateStreak(ctx.userId, tx);
          await userMetricsRepository.addXp(ctx.userId, XP_TASK_COMPLETE, tx);
          addWide({
            completion_event_created: true,
            xp_added: XP_TASK_COMPLETE,
          });
        } else if (!input.completed && existingTask.completed) {
          // Task was just uncompleted
          await completionEventRepository.delete(
            ctx.userId,
            task.id,
            'task_completed',
            tx,
          );
          await userMetricsRepository.decrementTasksCompleted(ctx.userId, tx);
          await userMetricsRepository.recalculateStreak(ctx.userId, tx);
          await userMetricsRepository.removeXp(
            ctx.userId,
            XP_TASK_COMPLETE,
            tx,
          );

          // Clean up evaluation
          if (input.occurrenceDate) {
            await practiceEvaluationRepository.deleteByTaskAndDate(
              task.id,
              input.occurrenceDate,
              ctx.userId,
              tx,
            );
          } else {
            await practiceEvaluationRepository.deleteLatestByTaskId(
              task.id,
              ctx.userId,
              tx,
            );
          }
          addWide({ evaluation_deleted: true });

          addWide({
            completion_event_deleted: true,
            xp_removed: XP_TASK_COMPLETE,
          });
        }

        return task;
      });
    }),

  completeWithEvaluation: protectedProcedure
    .input(completeTaskWithEvaluationSchema)
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{ task: Task; evaluation: PracticeEvaluation }> => {
        addWide({ task_id: input.taskId, action: 'complete_with_evaluation' });

        const existingTask = await taskRepository.findById(
          input.taskId,
          ctx.userId,
        );
        if (!existingTask) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        if (existingTask.completed) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Task is already completed',
          });
        }

        // Get subskill to find skillId (reads can stay outside tx)
        const subSkill = await subSkillRepository.findById(
          existingTask.subSkillId,
          ctx.userId,
        );
        const skillId = subSkill?.skillId ?? null;

        if (!skillId || !subSkill) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Task must be linked to a sub-skill with a valid skill',
          });
        }

        // Increment metric (read can stay outside tx)
        const metrics = await skillRepository.findMetricsBySubSkillId(
          existingTask.subSkillId,
          ctx.userId,
        );

        return db.transaction(async (tx) => {
          // Create the practice evaluation
          const evaluation = await practiceEvaluationRepository.create(
            {
              userId: ctx.userId,
              taskId: input.taskId,
              subSkillId: existingTask.subSkillId,
              skillId,
              occurrenceDate: input.occurrenceDate,
              ...input.evaluation,
            },
            tx,
          );

          if (!evaluation) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create evaluation',
            });
          }
          addWide({ evaluation_id: evaluation.id });

          // Now run existing completion logic: mark complete
          const task = await taskRepository.update(
            input.taskId,
            ctx.userId,
            {
              completed: true,
            },
            tx,
          );
          if (!task) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          }

          if (metrics.length > 0) {
            const metricId: string = metrics[0].id;
            await skillRepository.incrementMetric(metricId, ctx.userId, 1, tx);
            addWide({ metric_id: metricId, metric_incremented: 1 });
          }

          // Completion event + XP
          await completionEventRepository.create(
            {
              userId: ctx.userId,
              eventType: 'task_completed',
              entityId: task.id,
              skillId,
            },
            tx,
          );
          await userMetricsRepository.incrementTasksCompleted(ctx.userId, tx);
          await userMetricsRepository.updateStreak(ctx.userId, tx);
          await userMetricsRepository.addXp(ctx.userId, XP_TASK_COMPLETE, tx);
          addWide({
            completion_event_created: true,
            xp_added: XP_TASK_COMPLETE,
          });

          return { task, evaluation };
        });
      },
    ),
};
