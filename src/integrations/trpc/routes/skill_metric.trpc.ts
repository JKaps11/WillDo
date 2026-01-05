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

export const skillMetricRouter = {
  /** GET /skillMetric/:id - Get a specific metric */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const metric = await skillRepository.findMetricById(input.id, userId);

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return metric;
    }),

  /** GET /skillMetric/bySubSkill - List metrics for a sub-skill */
  listBySubSkill: protectedProcedure
    .input(z.object({ subSkillId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const metrics = await skillRepository.findMetricsBySubSkillId(
        input.subSkillId,
        userId,
      );

      return metrics;
    }),

  /** POST /skillMetric - Create a new metric */
  create: protectedProcedure
    .input(createSkillMetricSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Verify sub-skill exists and belongs to user
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

      return metric;
    }),

  /** PUT /skillMetric - Update a metric */
  update: protectedProcedure
    .input(updateSkillMetricSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const { id, ...updates } = input;

      const metric = await skillRepository.updateMetric(id, userId, updates);

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return metric;
    }),

  /** POST /skillMetric/increment - Increment a metric's current value */
  increment: protectedProcedure
    .input(incrementSkillMetricSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const metric = await skillRepository.incrementMetric(
        input.id,
        userId,
        input.amount,
      );

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return metric;
    }),

  /** POST /skillMetric/bulkUpdate - Update multiple metrics at once */
  bulkUpdate: protectedProcedure
    .input(bulkUpdateSkillMetricsSchema)
    .mutation(async ({ ctx, input }) => {
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

      return results;
    }),

  /** DELETE /skillMetric - Delete a metric */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const metric = await skillRepository.deleteMetric(input.id, userId);

      if (!metric) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return metric;
    }),
};
