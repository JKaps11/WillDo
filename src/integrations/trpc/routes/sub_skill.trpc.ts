import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  addDependencySchema,
  advanceSubSkillStageSchema,
  completeSubSkillSchema,
  createSubSkillSchema,
  deleteSubSkillSchema,
  getSubSkillSchema,
  listSubSkillsSchema,
  removeDependencySchema,
  updateSubSkillSchema,
} from '@/lib/zod-schemas';
import { subSkillRepository } from '@/db/repositories/sub_skill.repository';
import { skillRepository } from '@/db/repositories/skill.repository';

export const subSkillRouter = {
  /** GET /subSkill/list - List sub-skills for a skill */
  list: protectedProcedure
    .input(listSubSkillsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const subSkills = await subSkillRepository.findBySkillId(
        input.skillId,
        userId,
      );

      // Enrich with dependencies and metrics
      const enrichedSubSkills = await Promise.all(
        subSkills.map(async (subSkill) => {
          const dependencies = await subSkillRepository.findDependencies(
            subSkill.id,
            userId,
          );
          const metrics = await skillRepository.findMetricsBySubSkillId(
            subSkill.id,
            userId,
          );
          const isLocked = await subSkillRepository.isLocked(
            subSkill.id,
            userId,
          );

          return {
            ...subSkill,
            dependencies: dependencies.map((d) => d.prerequisiteSubSkillId),
            metrics,
            isLocked,
          };
        }),
      );

      return enrichedSubSkills;
    }),

  /** GET /subSkill/:id - Get a specific sub-skill */
  get: protectedProcedure
    .input(getSubSkillSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const subSkill = await subSkillRepository.findById(input.id, userId);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const dependencies = await subSkillRepository.findDependencies(
        subSkill.id,
        userId,
      );
      const metrics = await skillRepository.findMetricsBySubSkillId(
        subSkill.id,
        userId,
      );
      const isLocked = await subSkillRepository.isLocked(subSkill.id, userId);

      return {
        ...subSkill,
        dependencies: dependencies.map((d) => d.prerequisiteSubSkillId),
        metrics,
        isLocked,
      };
    }),

  /** POST /subSkill - Create a new sub-skill */
  create: protectedProcedure
    .input(createSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Verify skill exists and belongs to user
      const skill = await skillRepository.findById(input.skillId, userId);
      if (!skill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found',
        });
      }

      const subSkill = await subSkillRepository.create({
        ...input,
        userId,
      });

      if (!subSkill) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create sub-skill',
        });
      }

      return subSkill;
    }),

  /** PUT /subSkill - Update a sub-skill */
  update: protectedProcedure
    .input(updateSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const { id, ...updates } = input;

      const subSkill = await subSkillRepository.update(id, userId, updates);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return subSkill;
    }),

  /** DELETE /subSkill - Delete a sub-skill */
  delete: protectedProcedure
    .input(deleteSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const subSkill = await subSkillRepository.delete(input.id, userId);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return subSkill;
    }),

  /** POST /subSkill/advanceStage - Advance a sub-skill to the next stage */
  advanceStage: protectedProcedure
    .input(advanceSubSkillStageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Check if sub-skill is locked
      const isLocked = await subSkillRepository.isLocked(input.id, userId);
      if (isLocked) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message:
            'Cannot advance stage - prerequisite sub-skills not complete',
        });
      }

      const subSkill = await subSkillRepository.advanceStage(input.id, userId);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return subSkill;
    }),

  /** POST /subSkill/complete - Manually complete a sub-skill */
  complete: protectedProcedure
    .input(completeSubSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Check if sub-skill is locked
      const isLocked = await subSkillRepository.isLocked(input.id, userId);
      if (isLocked) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot complete - prerequisite sub-skills not complete',
        });
      }

      const subSkill = await subSkillRepository.complete(input.id, userId);

      if (!subSkill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return subSkill;
    }),

  /** POST /subSkill/addDependency - Add a dependency between sub-skills */
  addDependency: protectedProcedure
    .input(addDependencySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Verify both sub-skills exist and belong to user
      const dependent = await subSkillRepository.findById(
        input.dependentSubSkillId,
        userId,
      );
      const prerequisite = await subSkillRepository.findById(
        input.prerequisiteSubSkillId,
        userId,
      );

      if (!dependent || !prerequisite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or both sub-skills not found',
        });
      }

      // Ensure they belong to the same skill
      if (dependent.skillId !== prerequisite.skillId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sub-skills must belong to the same skill',
        });
      }

      // Prevent self-dependency
      if (input.dependentSubSkillId === input.prerequisiteSubSkillId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A sub-skill cannot depend on itself',
        });
      }

      const dependency = await subSkillRepository.addDependency({
        userId,
        dependentSubSkillId: input.dependentSubSkillId,
        prerequisiteSubSkillId: input.prerequisiteSubSkillId,
      });

      return dependency;
    }),

  /** DELETE /subSkill/removeDependency - Remove a dependency between sub-skills */
  removeDependency: protectedProcedure
    .input(removeDependencySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const dependency = await subSkillRepository.removeDependency(
        input.dependentSubSkillId,
        input.prerequisiteSubSkillId,
        userId,
      );

      if (!dependency) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return dependency;
    }),
};
