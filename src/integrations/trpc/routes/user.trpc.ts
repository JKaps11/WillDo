import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';

import type { NewUser, UserSettings } from '@/db/schemas/user.schema';
import {
    todoListSortByEnum,
    todoListTimeSpanEnum,
    users
} from '@/db/schemas/user.schema';

/* ---------- Shared Enum Schemas ---------- */

const todoListSortBySchema = z.enum(todoListSortByEnum.enumValues);
const todoListTimeSpanSchema = z.enum(todoListTimeSpanEnum.enumValues);

/* ---------- Settings Schema (Drizzle-constrained) ---------- */

const userSettingsSchema: z.ZodType<UserSettings> = z.object({
    todoList: z.object({
        sortBy: todoListSortBySchema,
        timeSpan: todoListTimeSpanSchema,
        showCompleted: z.boolean(),
    }),
});

/* ---------- Input Types (derived from DB) ---------- */

type CreateUserInput = Omit<NewUser, 'id'>;
type UpdateUserInput = Partial<Pick<NewUser, 'name' | 'settings'>>;

/* ---------- Input Schemas ---------- */

const createUserSchema: z.ZodType<CreateUserInput> = z.object({
    email: z.email(),
    name: z.string(),
    settings: userSettingsSchema.optional(),
});

const updateUserSchema: z.ZodType<UpdateUserInput> = z.object({
    name: z.string().optional(),
    settings: userSettingsSchema.optional(),
});

/* ---------- Router ---------- */

export const userRouter = {
    /** GET /user */
    get: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.userId;
        const result = await ctx.db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (result.length === 0) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }

        return result[0];
    }),

    /** POST /user */
    create: protectedProcedure
        .input(createUserSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            try {
                await ctx.db.insert(users).values({
                    id: userId,
                    ...input,
                });
            } catch (err) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create user',
                    cause: err,
                });
            }
        }),

    /** PUT /user */
    update: protectedProcedure
        .input(updateUserSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            try {
                await ctx.db
                    .update(users)
                    .set(input)
                    .where(eq(users.id, userId));
            } catch (err) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to update user',
                    cause: err,
                });
            }
        }),

    /** DELETE /user */
    delete: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.userId;
        try {
            await ctx.db.delete(users).where(eq(users.id, userId));
        } catch (err) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to delete user',
                cause: err,
            });
        }
    }),
};
