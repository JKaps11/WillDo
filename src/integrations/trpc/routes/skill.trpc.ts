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
import { completionEventRepository } from '@/db/repositories/completion_event.repository';
import { userMetricsRepository } from '@/db/repositories/user_metrics.repository';
import { XP_SKILL_ARCHIVE } from '@/lib/constants/xp';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const skillRouter = {
  list: protectedProcedure
    .input(listSkillsSchema)
    .query(async ({ ctx, input }) => {
      addWide({ include_archived: input.includeArchived ?? false });
      const skills = await skillRepository.findAll(
        ctx.userId,
        input.includeArchived ?? false,
      );
      addWide({ skills_count: skills.length });

      return Promise.all(
        skills.map(async (skill) => {
          const subSkills = await subSkillRepository.findBySkillId(
            skill.id,
            ctx.userId,
          );
          return { ...skill, subSkills };
        }),
      );
    }),

  get: protectedProcedure
    .input(getSkillSchema)
    .query(async ({ ctx, input }) => {
      addWide({ skill_id: input.id });
      const skill = await skillRepository.findById(input.id, ctx.userId);
      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const subSkills = await subSkillRepository.findBySkillId(
        skill.id,
        ctx.userId,
      );
      addWide({ sub_skills_count: subSkills.length });

      const enrichedSubSkills = await Promise.all(
        subSkills.map(async (subSkill) => {
          const [metrics, isLocked] = await Promise.all([
            skillRepository.findMetricsBySubSkillId(subSkill.id, ctx.userId),
            subSkillRepository.isLocked(subSkill.id, ctx.userId),
          ]);
          return { ...subSkill, metrics, isLocked };
        }),
      );

      return { ...skill, subSkills: enrichedSubSkills };
    }),

  create: protectedProcedure
    .input(createSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ skill_name: input.name });
      const skill = await skillRepository.create({
        ...input,
        userId: ctx.userId,
      });

      if (!skill) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create skill',
        });
      }
      addWide({ skill_id: skill.id });

      return skill;
    }),

  createWithPlan: protectedProcedure
    .input(createSkillWithPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const { subSkills: subSkillsInput, ...skillData } = input;

      // Default subskills structure when no AI planning is used
      const defaultSubSkills: Array<{
        name: string;
        description: string;
        metrics: Array<{ name: string; unit: string; targetValue: number }>;
        parentIndex: number | null;
      }> = [
        {
          name: 'Parent Subskill 1',
          description: '',
          metrics: [],
          parentIndex: null,
        },
        {
          name: 'Parent Subskill 2',
          description: '',
          metrics: [],
          parentIndex: null,
        },
        {
          name: 'Child Subskill 3',
          description: '',
          metrics: [],
          parentIndex: 0, // Parent is "Parent Subskill 1"
        },
        {
          name: 'Child Subskill 4',
          description: '',
          metrics: [],
          parentIndex: 0, // Parent is "Parent Subskill 1"
        },
        {
          name: 'Child Subskill 5',
          description: '',
          metrics: [],
          parentIndex: 1, // Parent is "Parent Subskill 2"
        },
        {
          name: 'Child Subskill 6',
          description: '',
          metrics: [],
          parentIndex: 1, // Parent is "Parent Subskill 2"
        },
      ];

      // Use provided subskills if any, otherwise use defaults
      const subSkillsToCreate =
        subSkillsInput.length > 0 ? subSkillsInput : defaultSubSkills;

      addWide({
        skill_name: skillData.name,
        sub_skills_planned: subSkillsToCreate.length,
        used_default_subskills: subSkillsInput.length === 0,
      });

      const skill = await skillRepository.create({
        ...skillData,
        userId: ctx.userId,
      });

      if (!skill) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create skill',
        });
      }
      addWide({ skill_id: skill.id });

      const createdSubSkillIds: Array<string> = [];

      for (const [index, ss] of subSkillsToCreate.entries()) {
        const parentIndex: number | null = ss.parentIndex ?? null;
        const parentSubSkillId: string | null =
          parentIndex !== null && parentIndex >= 0
            ? (createdSubSkillIds[parentIndex] ?? null)
            : null;

        const createdSubSkill = await subSkillRepository.create({
          skillId: skill.id,
          userId: ctx.userId,
          name: ss.name,
          description: ss.description,
          sortOrder: index,
          parentSubSkillId,
        });

        if (!createdSubSkill) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create sub-skill: ${ss.name}`,
          });
        }

        createdSubSkillIds.push(createdSubSkill.id);

        // Track subskill creation metric
        await userMetricsRepository.incrementSubSkillsCreated(ctx.userId);

        await Promise.all(
          ss.metrics.map((metric) =>
            skillRepository.createMetric({
              subSkillId: createdSubSkill.id,
              userId: ctx.userId,
              name: metric.name,
              unit: metric.unit,
              targetValue: metric.targetValue,
              currentValue: 0,
            }),
          ),
        );
      }
      addWide({ sub_skills_created: createdSubSkillIds.length });

      return skill;
    }),

  update: protectedProcedure
    .input(updateSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      addWide({ skill_id: id });
      const skill = await skillRepository.update(id, ctx.userId, updates);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return skill;
    }),

  delete: protectedProcedure
    .input(deleteSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ skill_id: input.id });

      const skill = await skillRepository.delete(input.id, ctx.userId);

      if (!skill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Skill not found for user: ${ctx.userId} and skill: ${input.id}`,
        });
      }

      addWide({ deleted_skill: skill });
      return skill;
    }),

  archive: protectedProcedure
    .input(getSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ skill_id: input.id });

      // Check if already archived
      const existingSkill = await skillRepository.findById(
        input.id,
        ctx.userId,
      );
      const wasArchived = existingSkill?.archived ?? false;

      const skill = await skillRepository.archive(input.id, ctx.userId);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Track skill archive (only if not already archived)
      if (!wasArchived) {
        await completionEventRepository.create({
          userId: ctx.userId,
          eventType: 'skill_archived',
          entityId: skill.id,
          skillId: skill.id,
        });
        await userMetricsRepository.incrementSkillsArchived(ctx.userId);
        await userMetricsRepository.updateStreak(ctx.userId);
        await userMetricsRepository.addXp(ctx.userId, XP_SKILL_ARCHIVE);
        addWide({
          completion_event_created: true,
          xp_added: XP_SKILL_ARCHIVE,
        });
      }

      return skill;
    }),

  unarchive: protectedProcedure
    .input(getSkillSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ skill_id: input.id });

      // Check if was archived
      const existingSkill = await skillRepository.findById(
        input.id,
        ctx.userId,
      );
      const wasArchived = existingSkill?.archived ?? false;

      const skill = await skillRepository.unarchive(input.id, ctx.userId);

      if (!skill) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Undo archive tracking (only if was archived)
      if (wasArchived) {
        await completionEventRepository.delete(
          ctx.userId,
          skill.id,
          'skill_archived',
        );
        await userMetricsRepository.decrementSkillsArchived(ctx.userId);
        await userMetricsRepository.recalculateStreak(ctx.userId);
        await userMetricsRepository.removeXp(ctx.userId, XP_SKILL_ARCHIVE);
        addWide({
          completion_event_deleted: true,
          xp_removed: XP_SKILL_ARCHIVE,
        });
      }

      return skill;
    }),
};
