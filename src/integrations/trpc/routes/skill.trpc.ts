import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  createSkillSchema,
  createSkillWithPlanSchema,
  deleteSkillSchema,
  getSkillSchema,
  listSkillsSchema,
  updateSkillSchema,
} from '@/lib/zod-schemas';
import { subSkillRepository } from '@/db/repositories/sub_skill.repository';
import { skillRepository } from '@/db/repositories/skill.repository';
import { taskRepository } from '@/db/repositories/task.repository';

export const skillRouter = {
  /** GET /skill/list - List all skills */
  list: protectedProcedure
    .input(listSkillsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const skills = await skillRepository.findAll(
        userId,
        input.includeArchived ?? false,
      );

      // Fetch sub-skills for each skill to include stage info
      const skillsWithSubSkills = await Promise.all(
        skills.map(async (skill) => {
          const subSkills = await subSkillRepository.findBySkillId(
            skill.id,
            userId,
          );
          return {
            ...skill,
            subSkills,
          };
        }),
      );

      return skillsWithSubSkills;
    }),

  /** GET /skill/:id - Get a specific skill with sub-skills */
  get: protectedProcedure
    .input(getSkillSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const skill = await skillRepository.findById(input.id, userId);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const subSkills = await subSkillRepository.findBySkillId(
        skill.id,
        userId,
      );

      // Fetch dependencies for each sub-skill
      const subSkillsWithDeps = await Promise.all(
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

      return {
        ...skill,
        subSkills: subSkillsWithDeps,
      };
    }),

  /** POST /skill - Create a new skill */
  create: protectedProcedure
    .input(createSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const skill = await skillRepository.create({
        ...input,
        userId,
      });

      if (!skill) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create skill',
        });
      }

      return skill;
    }),

  /** POST /skill/createWithPlan - Create a skill with sub-skills, metrics, dependencies, and tasks */
  createWithPlan: protectedProcedure
    .input(createSkillWithPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const { subSkills: subSkillsInput, createTasks, ...skillData } = input;

      // 1. Create the skill
      const skill = await skillRepository.create({
        ...skillData,
        userId,
      });

      if (!skill) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create skill',
        });
      }

      // 2. Create sub-skills and store their IDs for dependency mapping
      const createdSubSkillIds: Array<string> = [];

      for (let i = 0; i < subSkillsInput.length; i++) {
        const ss = subSkillsInput[i];
        const createdSubSkill = await subSkillRepository.create({
          skillId: skill.id,
          userId,
          name: ss.name,
          description: ss.description,
          sortOrder: i,
        });

        if (!createdSubSkill) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create sub-skill: ${ss.name}`,
          });
        }

        createdSubSkillIds.push(createdSubSkill.id);

        // 3. Create metrics for this sub-skill
        for (const metric of ss.metrics) {
          await skillRepository.createMetric({
            subSkillId: createdSubSkill.id,
            userId,
            name: metric.name,
            unit: metric.unit,
            targetValue: metric.targetValue,
            currentValue: 0,
          });
        }

        // 4. Create a task for this sub-skill if requested
        if (createTasks) {
          await taskRepository.create({
            userId,
            name: ss.name,
            description: ss.description,
            subSkillId: createdSubSkill.id,
            todoListDate: new Date(), // Today's date for todo list
            // No dueDate - will show in unassigned
          });
        }
      }

      // 5. Create dependencies between sub-skills
      for (let i = 0; i < subSkillsInput.length; i++) {
        const ss = subSkillsInput[i];
        const dependentId = createdSubSkillIds[i];

        for (const depIndex of ss.dependencyIndices) {
          if (depIndex >= 0 && depIndex < createdSubSkillIds.length) {
            const prerequisiteId = createdSubSkillIds[depIndex];
            await subSkillRepository.addDependency({
              userId,
              dependentSubSkillId: dependentId,
              prerequisiteSubSkillId: prerequisiteId,
            });
          }
        }
      }

      return skill;
    }),

  /** PUT /skill - Update a skill */
  update: protectedProcedure
    .input(updateSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const { id, ...updates } = input;

      const skill = await skillRepository.update(id, userId, updates);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return skill;
    }),

  /** DELETE /skill - Delete a skill */
  delete: protectedProcedure
    .input(deleteSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const skill = await skillRepository.delete(input.id, userId);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return skill;
    }),

  /** POST /skill/archive - Archive a skill */
  archive: protectedProcedure
    .input(getSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const skill = await skillRepository.archive(input.id, userId);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return skill;
    }),

  /** POST /skill/unarchive - Unarchive a skill */
  unarchive: protectedProcedure
    .input(getSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const skill = await skillRepository.unarchive(input.id, userId);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return skill;
    }),
};
