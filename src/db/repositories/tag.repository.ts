import type { NewTag, Tag } from '@/db/schemas/tag.schema';
import { tags } from '@/db/schemas/tag.schema';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/index';

export const tagRepository = {
  findById: async (tagId: string, userId: string): Promise<Tag | null> => {
    const result = await db
      .select()
      .from(tags)
      .where(and(eq(tags.tagId, tagId), eq(tags.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  },

  findAllByUserId: async (userId: string): Promise<Array<Tag>> => {
    const result = await db.select().from(tags).where(eq(tags.userId, userId));

    return result;
  },

  create: async (
    data: Omit<NewTag, 'tagId' | 'createdAt' | 'updatedAt'>,
  ): Promise<Tag | null> => {
    const result = await db.insert(tags).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    tagId: string,
    userId: string,
    data: Partial<Omit<NewTag, 'tagId' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Tag | null> => {
    const result = await db
      .update(tags)
      .set(data)
      .where(and(eq(tags.tagId, tagId), eq(tags.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  delete: async (tagId: string, userId: string): Promise<Tag | null> => {
    const result = await db
      .delete(tags)
      .where(and(eq(tags.tagId, tagId), eq(tags.userId, userId)))
      .returning();

    return result[0] ?? null;
  },
};
