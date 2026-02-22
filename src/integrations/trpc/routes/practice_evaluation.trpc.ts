import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  getLatestBySubSkillSchema,
  getPracticeEvaluationSchema,
  listBySubSkillSchema,
} from '@/lib/zod-schemas';
import { practiceEvaluationRepository } from '@/db/repositories/practice_evaluation.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const practiceEvaluationRouter = {
  get: protectedProcedure
    .input(getPracticeEvaluationSchema)
    .query(async ({ ctx, input }) => {
      addWide({ practice_evaluation_id: input.id });
      const evaluation = await practiceEvaluationRepository.findById(
        input.id,
        ctx.userId,
      );
      if (!evaluation) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return evaluation;
    }),

  listBySubSkill: protectedProcedure
    .input(listBySubSkillSchema)
    .query(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.subSkillId });
      const evaluations = await practiceEvaluationRepository.findBySubSkillId(
        input.subSkillId,
        ctx.userId,
      );
      addWide({ evaluations_count: evaluations.length });
      return evaluations;
    }),

  getLatestBySubSkill: protectedProcedure
    .input(getLatestBySubSkillSchema)
    .query(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.subSkillId });
      const evaluation =
        await practiceEvaluationRepository.findLatestBySubSkillId(
          input.subSkillId,
          ctx.userId,
        );
      return evaluation;
    }),

  getFolderHierarchy: protectedProcedure.query(async ({ ctx }) => {
    const hierarchy = await practiceEvaluationRepository.getFolderHierarchy(
      ctx.userId,
    );
    addWide({ skills_with_evaluations: hierarchy.length });
    return hierarchy;
  }),
};
