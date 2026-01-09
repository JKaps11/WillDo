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

      const subSkill = await subSkillRepository.create({
        ...input,
        userId: ctx.userId,
      });

      if (!subSkill) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create sub-skill',
        });
      }
      addWide({ sub_skill_id: subSkill.id });

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

      const subSkill = await subSkillRepository.advanceStage(
        input.id,
        ctx.userId,
      );

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      addWide({ new_stage: subSkill.stage });

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

      const subSkill = await subSkillRepository.complete(input.id, ctx.userId);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
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
