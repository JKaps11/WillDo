import { patchUserSettingsSchema, updateUserSchema } from '@/lib/zod-schemas';
import { userRepository } from '@/db/repositories/user.repository';
import { protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';

export const userRouter = {
  /** GET /user */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return user;
  }),

  /** PUT /user */
  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
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

  /** PATCH /user/settings - Partial settings update */
  patchSettings: protectedProcedure
    .input(patchUserSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
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

  /** DELETE /user */
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
