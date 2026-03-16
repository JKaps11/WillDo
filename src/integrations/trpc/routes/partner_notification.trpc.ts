import { protectedProcedure } from '../init';
import {
  markNotificationReadSchema,
  listNotificationsSchema,
} from '@/lib/zod-schemas';
import { partnerNotificationRepository } from '@/db/repositories/partner_notification.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const partnerNotificationRouter = {
  list: protectedProcedure
    .input(listNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const notifications = await partnerNotificationRepository.list(
        ctx.userId,
        input.cursor,
        input.limit,
      );
      addWide({ notifications_count: notifications.length });
      return notifications;
    }),

  markRead: protectedProcedure
    .input(markNotificationReadSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ action: 'mark_notification_read' });

      if (input.markAll) {
        await partnerNotificationRepository.markAllRead(ctx.userId);
        return { success: true };
      }

      if (input.notificationId) {
        const notification = await partnerNotificationRepository.markRead(
          input.notificationId,
          ctx.userId,
        );
        return { success: notification !== null };
      }

      return { success: false };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await partnerNotificationRepository.getUnreadCount(
      ctx.userId,
    );
    return { count };
  }),
};
