import { and, eq, gte, sql } from 'drizzle-orm';

import type { AiUsage, NewAiUsage } from '@/db/schemas/ai_usage.schema';
import type { DbClient } from '@/db/index';
import { aiUsage } from '@/db/schemas/ai_usage.schema';
import { db } from '@/db/index';
import { withDbError } from '@/db/withDbError';

/* ---------- Repository ---------- */

export const aiUsageRepository = {
  create: async (
    data: Omit<NewAiUsage, 'id' | 'createdAt' | 'updatedAt'>,
    dbClient: DbClient = db,
  ): Promise<AiUsage | null> => {
    return withDbError('aiUsage.create', async () => {
      const result = await dbClient.insert(aiUsage).values(data).returning();
      return result[0] ?? null;
    });
  },

  /**
   * Get total usage stats for a user
   */
  getUserStats: async (
    userId: string,
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: string;
  }> => {
    return withDbError('aiUsage.getUserStats', async () => {
      const result = await db
        .select({
          totalRequests: sql<number>`count(*)::int`,
          successfulRequests: sql<number>`sum(${aiUsage.success})::int`,
          totalInputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)::int`,
          totalOutputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)::int`,
          totalCost: sql<string>`coalesce(sum(${aiUsage.cost}), 0)::text`,
        })
        .from(aiUsage)
        .where(eq(aiUsage.userId, userId));

      return (
        result[0] ?? {
          totalRequests: 0,
          successfulRequests: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: '0',
        }
      );
    });
  },

  /**
   * Count how many AI requests a user has made since a given timestamp
   */
  countRecentUsage: async (userId: string, since: Date): Promise<number> => {
    return withDbError('aiUsage.countRecentUsage', async () => {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(aiUsage)
        .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, since)));
      return result[0]?.count ?? 0;
    });
  },

  /**
   * Get usage for a specific time period
   */
  getUsageInPeriod: async (
    userId: string,
    startDate: Date,
  ): Promise<Array<AiUsage>> => {
    return withDbError('aiUsage.getUsageInPeriod', async () => {
      return db
        .select()
        .from(aiUsage)
        .where(
          and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, startDate)),
        )
        .orderBy(aiUsage.createdAt);
    });
  },
};
