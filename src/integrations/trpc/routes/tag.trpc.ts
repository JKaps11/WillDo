import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import { tagRepository } from '@/db/repositories/tag.repository';
import {
    createTagSchema,
    deleteTagSchema,
    getTagSchema,
    updateTagSchema,
} from '@/lib/zod-schemas';

export const tagRouter = {
    /** GET /tag - Get a specific tag */
    get: protectedProcedure
        .input(getTagSchema)
        .query(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const tag = await tagRepository.findById(input.tagId, userId);

            if (!tag) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return tag;
        }),

    /** GET /tag/list - Get all tags for the user */
    list: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.userId;
            const tags = await tagRepository.findAllByUserId(userId);
            return tags;
        }),

    /** POST /tag - Create a new tag */
    create: protectedProcedure
        .input(createTagSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;

            const tag = await tagRepository.create({
                ...input,
                userId,
            });

            if (!tag) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create tag',
                });
            }

            return tag;
        }),

    /** PUT /tag - Update a tag */
    update: protectedProcedure
        .input(updateTagSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const { tagId, ...updates } = input;

            const tag = await tagRepository.update(tagId, userId, updates);

            if (!tag) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return tag;
        }),

    /** DELETE /tag - Delete a tag */
    delete: protectedProcedure
        .input(deleteTagSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const tag = await tagRepository.delete(input.tagId, userId);

            if (!tag) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            return tag;
        }),
};
