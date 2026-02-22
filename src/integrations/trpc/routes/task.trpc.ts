import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  completeTaskWithEvaluationSchema,
  completeTaskWithMetricUpdateSchema,
  createTaskSchema,
  deleteTaskSchema,
  getTaskSchema,
  listTasksBySubSkillSchema,
  updateTaskSchema,
} from '@/lib/zod-schemas';
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

      // Track task creation for metrics
      await userMetricsRepository.incrementTasksCreated(ctx.userId);

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

      // Get skillId for completion event
      const subSkill = await subSkillRepository.findById(
        task.subSkillId,
        ctx.userId,
      );
      const skillId = subSkill?.skillId ?? null;

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

      // Handle completion event tracking
      if (input.completed && !existingTask.completed) {
        // Task was just completed
        await completionEventRepository.create({
          userId: ctx.userId,
          eventType: 'task_completed',
          entityId: task.id,
          skillId,
        });
        await userMetricsRepository.incrementTasksCompleted(ctx.userId);
        await userMetricsRepository.updateStreak(ctx.userId);
        await userMetricsRepository.addXp(ctx.userId, XP_TASK_COMPLETE);
        addWide({ completion_event_created: true, xp_added: XP_TASK_COMPLETE });
      } else if (!input.completed && existingTask.completed) {
        // Task was just uncompleted
        await completionEventRepository.delete(
          ctx.userId,
          task.id,
          'task_completed',
        );
        await userMetricsRepository.decrementTasksCompleted(ctx.userId);
        await userMetricsRepository.recalculateStreak(ctx.userId);
        await userMetricsRepository.removeXp(ctx.userId, XP_TASK_COMPLETE);

        // Clean up evaluation if occurrence date was provided
        if (input.occurrenceDate) {
          await practiceEvaluationRepository.deleteByTaskAndDate(
            task.id,
            input.occurrenceDate,
            ctx.userId,
          );
          addWide({ evaluation_deleted: true });
        }

        addWide({
          completion_event_deleted: true,
          xp_removed: XP_TASK_COMPLETE,
        });
      }

      return task;
    }),

  completeWithEvaluation: protectedProcedure
    .input(completeTaskWithEvaluationSchema)
    .mutation(async ({ ctx, input }) => {
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

      // Get subskill to find skillId
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

      // Create the practice evaluation
      const evaluation = await practiceEvaluationRepository.create({
        userId: ctx.userId,
        taskId: input.taskId,
        subSkillId: existingTask.subSkillId,
        skillId,
        occurrenceDate: input.occurrenceDate,
        ...input.evaluation,
      });

      if (!evaluation) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create evaluation',
        });
      }
      addWide({ evaluation_id: evaluation.id });

      // Now run existing completion logic: mark complete
      const task = await taskRepository.update(input.taskId, ctx.userId, {
        completed: true,
      });
      if (!task) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      // Increment metric
      const metrics = await skillRepository.findMetricsBySubSkillId(
        task.subSkillId,
        ctx.userId,
      );
      if (metrics.length > 0) {
        const metricId: string = metrics[0].id;
        await skillRepository.incrementMetric(metricId, ctx.userId, 1);
        addWide({ metric_id: metricId, metric_incremented: 1 });
      }

      // Completion event + XP
      await completionEventRepository.create({
        userId: ctx.userId,
        eventType: 'task_completed',
        entityId: task.id,
        skillId,
      });
      await userMetricsRepository.incrementTasksCompleted(ctx.userId);
      await userMetricsRepository.updateStreak(ctx.userId);
      await userMetricsRepository.addXp(ctx.userId, XP_TASK_COMPLETE);
      addWide({ completion_event_created: true, xp_added: XP_TASK_COMPLETE });

      return { task, evaluation };
    }),
};
