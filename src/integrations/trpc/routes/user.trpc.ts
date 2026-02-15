import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  patchUserSettingsSchema,
  setActiveSkillSchema,
  updateUserSchema,
} from '@/lib/zod-schemas';
import { userRepository } from '@/db/repositories/user.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const userRouter = {
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return user;
  }),

  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      addWide({ settings_keys: Object.keys(input) });
      try {
        const user = await userRepository.update(userId, input);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return user;
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user',
          cause: err,
        });
      }
    }),

  patchSettings: protectedProcedure
    .input(patchUserSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      addWide({ settings_keys: Object.keys(input) });
      try {
        const user = await userRepository.patchSettings(userId, input);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return user;
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to patch user settings',
          cause: err,
        });
      }
    }),

  setActiveSkill: protectedProcedure
    .input(setActiveSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      try {
        const user = await userRepository.setActiveSkill(userId, input.skillId);
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return user;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set active skill',
          cause: err,
        });
      }
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;
    try {
      const user = await userRepository.delete(userId);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return user;
    } catch (err) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user',
        cause: err,
      });
    }
  }),
};
