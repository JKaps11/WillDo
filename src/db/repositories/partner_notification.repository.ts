import { and, count, desc, eq, lt } from 'drizzle-orm';

import type { DbClient } from '@/db/index';
import { db } from '@/db/index';
import {
  partnerNotifications,
  type PartnerNotification,
  type PartnerNotificationType,
} from '@/db/schemas/partner_notification.schema';
import { withDbError } from '@/db/withDbError';

/* ---------- Repository ---------- */

export const partnerNotificationRepository = {
  create: async (
    data: {
      userId: string;
      type: PartnerNotificationType;
      partnershipId?: string;
      data?: Record<string, unknown>;
    },
    dbClient: DbClient = db,
  ): Promise<PartnerNotification> => {
    return withDbError('partnerNotification.create', async () => {
      const result = await dbClient
        .insert(partnerNotifications)
        .values({
          userId: data.userId,
          type: data.type,
          partnershipId: data.partnershipId ?? null,
          data: data.data ?? null,
        })
        .returning();

      return result[0];
    });
  },

  list: async (
    userId: string,
    cursor?: Date,
    limit: number = 20,
  ): Promise<PartnerNotification[]> => {
    return withDbError('partnerNotification.list', async () => {
      const conditions = [eq(partnerNotifications.userId, userId)];

      if (cursor) {
        conditions.push(lt(partnerNotifications.createdAt, cursor));
      }

      return db
        .select()
        .from(partnerNotifications)
        .where(and(...conditions))
        .orderBy(desc(partnerNotifications.createdAt))
        .limit(limit);
    });
  },

  markRead: async (
    notificationId: string,
    userId: string,
    dbClient: DbClient = db,
  ): Promise<PartnerNotification | null> => {
    return withDbError('partnerNotification.markRead', async () => {
      const result = await dbClient
        .update(partnerNotifications)
        .set({ read: true, updatedAt: new Date() })
        .where(
          and(
            eq(partnerNotifications.id, notificationId),
            eq(partnerNotifications.userId, userId),
          ),
        )
        .returning();

      return result[0] ?? null;
    });
  },

  markAllRead: async (
    userId: string,
    dbClient: DbClient = db,
  ): Promise<void> => {
    return withDbError('partnerNotification.markAllRead', async () => {
      await dbClient
        .update(partnerNotifications)
        .set({ read: true, updatedAt: new Date() })
        .where(
          and(
            eq(partnerNotifications.userId, userId),
            eq(partnerNotifications.read, false),
          ),
        );
    });
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    return withDbError('partnerNotification.getUnreadCount', async () => {
      const result = await db
        .select({ count: count() })
        .from(partnerNotifications)
        .where(
          and(
            eq(partnerNotifications.userId, userId),
            eq(partnerNotifications.read, false),
          ),
        );

      return result[0]?.count ?? 0;
    });
  },
};
