import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  advanceSubSkillStageSchema,
  completeSubSkillSchema,
  createSubSkillSchema,
  deleteSubSkillSchema,
  getSubSkillSchema,
  listSubSkillsSchema,
  updateSubSkillSchema,
} from '@/lib/zod-schemas';
import { subSkillRepository } from '@/db/repositories/sub_skill.repository';
import { skillRepository } from '@/db/repositories/skill.repository';
import { taskRepository } from '@/db/repositories/task.repository';
import { completionEventRepository } from '@/db/repositories/completion_event.repository';
import { userMetricsRepository } from '@/db/repositories/user_metrics.repository';
import { XP_SUBSKILL_COMPLETE } from '@/lib/constants/xp';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const subSkillRouter = {
  list: protectedProcedure
    .input(listSubSkillsSchema)
    .query(async ({ ctx, input }) => {
      addWide({ skill_id: input.skillId });
      const subSkills = await subSkillRepository.findBySkillId(
        input.skillId,
        ctx.userId,
      );
      addWide({ sub_skills_count: subSkills.length });

      const enriched = await Promise.all(
        subSkills.map(async (subSkill) => {
          const metrics = await skillRepository.findMetricsBySubSkillId(
            subSkill.id,
            ctx.userId,
          );
          const isLocked = await subSkillRepository.isLocked(
            subSkill.id,
            ctx.userId,
          );
          return { ...subSkill, metrics, isLocked };
        }),
      );

      return enriched;
    }),

  get: protectedProcedure
    .input(getSubSkillSchema)
    .query(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.id });
      const subSkill = await subSkillRepository.findById(input.id, ctx.userId);
      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const metrics = await skillRepository.findMetricsBySubSkillId(
        subSkill.id,
        ctx.userId,
      );
      const isLocked = await subSkillRepository.isLocked(
        subSkill.id,
        ctx.userId,
      );
      addWide({ is_locked: isLocked, metrics_count: metrics.length });

      return { ...subSkill, metrics, isLocked };
    }),

  create: protectedProcedure
    .input(createSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ skill_id: input.skillId, sub_skill_name: input.name });
      const skill = await skillRepository.findById(input.skillId, ctx.userId);
      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Skill not found' });
      }

      const { metrics, ...subSkillData } = input;
      const subSkill = await subSkillRepository.create({
        ...subSkillData,
        userId: ctx.userId,
      });

      if (!subSkill) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create sub-skill',
        });
      }
      addWide({ sub_skill_id: subSkill.id });

      // Track subskill creation metric
      await userMetricsRepository.incrementSubSkillsCreated(ctx.userId);

      // Create metrics if provided
      if (metrics && metrics.length > 0) {
        await Promise.all(
          metrics.map((metric) =>
            skillRepository.createMetric({
              userId: ctx.userId,
              subSkillId: subSkill.id,
              name: metric.name,
              unit: metric.unit,
              targetValue: metric.targetValue,
              currentValue: metric.currentValue,
            }),
          ),
        );
        addWide({ metrics_created: metrics.length });
      }

      return subSkill;
    }),

  update: protectedProcedure
    .input(updateSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      addWide({ sub_skill_id: id });
      const subSkill = await subSkillRepository.update(id, ctx.userId, updates);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return subSkill;
    }),

  delete: protectedProcedure
    .input(deleteSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.id });
      const subSkill = await subSkillRepository.delete(input.id, ctx.userId);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return subSkill;
    }),

  advanceStage: protectedProcedure
    .input(advanceSubSkillStageSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.id });
      const isLocked = await subSkillRepository.isLocked(input.id, ctx.userId);
      if (isLocked) {
        addWide({ blocked_by_lock: true });
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot advance - parent sub-skill not complete',
        });
      }

      // Get current stage before advancing
      const existingSubSkill = await subSkillRepository.findById(
        input.id,
        ctx.userId,
      );
      const wasComplete = existingSubSkill?.stage === 'complete';

      const subSkill = await subSkillRepository.advanceStage(
        input.id,
        ctx.userId,
      );

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      addWide({ new_stage: subSkill.stage });

      // Create task when advancing to practice stage
      if (subSkill.stage === 'practice') {
        const task = await taskRepository.create({
          userId: ctx.userId,
          name: subSkill.name,
          description: subSkill.description ?? undefined,
          subSkillId: subSkill.id,
        });
        addWide({ created_task_id: task?.id });

        // Track task creation
        await userMetricsRepository.incrementTasksCreated(ctx.userId);
      }

      // Track subskill completion when advancing to complete stage
      if (subSkill.stage === 'complete' && !wasComplete) {
        await completionEventRepository.create({
          userId: ctx.userId,
          eventType: 'subskill_completed',
          entityId: subSkill.id,
          skillId: subSkill.skillId,
        });
        await userMetricsRepository.incrementSubSkillsCompleted(ctx.userId);
        await userMetricsRepository.updateStreak(ctx.userId);
        await userMetricsRepository.addXp(ctx.userId, XP_SUBSKILL_COMPLETE);
        addWide({
          completion_event_created: true,
          xp_added: XP_SUBSKILL_COMPLETE,
        });
      }

      return subSkill;
    }),

  complete: protectedProcedure
    .input(completeSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.id });
      const isLocked = await subSkillRepository.isLocked(input.id, ctx.userId);
      if (isLocked) {
        addWide({ blocked_by_lock: true });
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot complete - parent sub-skill not complete',
        });
      }

      // Check if already complete
      const existingSubSkill = await subSkillRepository.findById(
        input.id,
        ctx.userId,
      );
      const wasComplete = existingSubSkill?.stage === 'complete';

      const subSkill = await subSkillRepository.complete(input.id, ctx.userId);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Track subskill completion (only if not already complete)
      if (!wasComplete) {
        await completionEventRepository.create({
          userId: ctx.userId,
          eventType: 'subskill_completed',
          entityId: subSkill.id,
          skillId: subSkill.skillId,
        });
        await userMetricsRepository.incrementSubSkillsCompleted(ctx.userId);
        await userMetricsRepository.updateStreak(ctx.userId);
        await userMetricsRepository.addXp(ctx.userId, XP_SUBSKILL_COMPLETE);
        addWide({
          completion_event_created: true,
          xp_added: XP_SUBSKILL_COMPLETE,
        });
      }

      return subSkill;
    }),

  setParent: protectedProcedure
    .input(updateSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({
        sub_skill_id: input.id,
        parent_sub_skill_id: input.parentSubSkillId,
      });
      const subSkill = await subSkillRepository.setParent(
        input.id,
        ctx.userId,
        input.parentSubSkillId ?? null,
      );

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return subSkill;
    }),
};
