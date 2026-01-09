import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure } from '../init';
import {
  bulkUpdateSkillMetricsSchema,
  createSkillMetricSchema,
  incrementSkillMetricSchema,
  updateSkillMetricSchema,
} from '@/lib/zod-schemas';
import { subSkillRepository } from '@/db/repositories/sub_skill.repository';
import { skillRepository } from '@/db/repositories/skill.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const skillMetricRouter = {
  get: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      addWide({ metric_id: input.id });
      const userId = ctx.userId;
      const metric = await skillRepository.findMetricById(input.id, userId);

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return metric;
    }),

  listBySubSkill: protectedProcedure
    .input(z.object({ subSkillId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.subSkillId });
      const userId = ctx.userId;
      const metrics = await skillRepository.findMetricsBySubSkillId(
        input.subSkillId,
        userId,
      );
      addWide({ metrics_count: metrics.length });

      return metrics;
    }),

  create: protectedProcedure
    .input(createSkillMetricSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ sub_skill_id: input.subSkillId, metric_name: input.name });
      const userId = ctx.userId;

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

      const metric = await skillRepository.createMetric({
        ...input,
        userId,
      });

      if (!metric) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create metric',
        });
      }
      addWide({ metric_id: metric.id });

      return metric;
    }),

  update: protectedProcedure
    .input(updateSkillMetricSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const { id, ...updates } = input;
      addWide({ metric_id: id });

      const metric = await skillRepository.updateMetric(id, userId, updates);

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return metric;
    }),

  increment: protectedProcedure
    .input(incrementSkillMetricSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ metric_id: input.id, increment_amount: input.amount });
      const userId = ctx.userId;

      const metric = await skillRepository.incrementMetric(
        input.id,
        userId,
        input.amount,
      );

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      addWide({ new_value: metric.currentValue });

      return metric;
    }),

  bulkUpdate: protectedProcedure
    .input(bulkUpdateSkillMetricsSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ metrics_to_update: input.updates.length });
      const userId = ctx.userId;

      const results = await Promise.all(
        input.updates.map(async (update) => {
          const metric = await skillRepository.updateMetric(update.id, userId, {
            currentValue: update.currentValue,
          });

          if (!metric) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `Metric ${update.id} not found`,
            });
          }

          return metric;
        }),
      );
      addWide({ metrics_updated: results.length });

      return results;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      addWide({ metric_id: input.id });
      const userId = ctx.userId;
      const metric = await skillRepository.deleteMetric(input.id, userId);

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return metric;
    }),
};
