import { TRPCError } from '@trpc/server';
import { startOfDay } from 'date-fns';

import { protectedProcedure } from '../init';
import {
  submitCheckInSchema,
  getCheckInHistorySchema,
} from '@/lib/zod-schemas';
import { db } from '@/db/index';
import { partnershipRepository } from '@/db/repositories/partnership.repository';
import { checkInRepository } from '@/db/repositories/check_in.repository';
import { partnerNotificationRepository } from '@/db/repositories/partner_notification.repository';
import { userMetricsRepository } from '@/db/repositories/user_metrics.repository';
import {
  XP_CHECK_IN_SUBMITTED,
  XP_CHECK_IN_YES_BONUS,
  XP_SHARED_STREAK_DAY,
  XP_SHARED_STREAK_7_DAY,
  XP_SHARED_STREAK_30_DAY,
  SHARED_STREAK_MILESTONES,
} from '@/lib/constants/xp';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const checkInRouter = {
  submit: protectedProcedure
    .input(submitCheckInSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({
        action: 'submit_check_in',
        partnership_id: input.partnershipId,
        response: input.response,
      });

      const partnership = await partnershipRepository.findById(
        input.partnershipId,
        ctx.userId,
      );

      if (!partnership || partnership.status !== 'active') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active partnership not found',
        });
      }

      const today = startOfDay(new Date());

      // Check if already checked in today
      const existing = await checkInRepository.findByPartnershipAndDate(
        input.partnershipId,
        ctx.userId,
        today,
      );

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Already checked in today for this partnership',
        });
      }

      // Calculate XP
      let xpAwarded = XP_CHECK_IN_SUBMITTED;
      if (input.response === 'yes') {
        xpAwarded += XP_CHECK_IN_YES_BONUS;
      }

      return db.transaction(async (tx) => {
        // Create check-in
        const checkIn = await checkInRepository.create(
          {
            partnershipId: input.partnershipId,
            userId: ctx.userId,
            date: today,
            response: input.response,
            note: input.note,
            xpAwarded,
          },
          tx,
        );

        // Award XP
        await userMetricsRepository.addXp(ctx.userId, xpAwarded, tx);

        // Increment check-in counter on user metrics
        await userMetricsRepository.incrementPartnerCheckIns(ctx.userId, tx);

        // Check shared streak
        const partnerId =
          partnership.inviterId === ctx.userId
            ? partnership.inviteeId
            : partnership.inviterId;

        const partnerCheckIn =
          await checkInRepository.findByPartnershipAndDate(
            input.partnershipId,
            partnerId,
            today,
          );

        if (partnerCheckIn) {
          // Both checked in today — increment shared streak bonus
          await userMetricsRepository.addXp(
            ctx.userId,
            XP_SHARED_STREAK_DAY,
            tx,
          );
          await userMetricsRepository.addXp(
            partnerId,
            XP_SHARED_STREAK_DAY,
            tx,
          );

          // Calculate shared streak
          const sharedStreak = await checkInRepository.calculateSharedStreak(
            partnership.id,
            partnership.inviterId,
            partnership.inviteeId,
          );

          // Check milestones
          for (const milestone of SHARED_STREAK_MILESTONES) {
            if (sharedStreak === milestone) {
              const bonusXp =
                milestone === 7
                  ? XP_SHARED_STREAK_7_DAY
                  : milestone === 30
                    ? XP_SHARED_STREAK_30_DAY
                    : XP_SHARED_STREAK_30_DAY;

              await userMetricsRepository.addXp(ctx.userId, bonusXp, tx);
              await userMetricsRepository.addXp(partnerId, bonusXp, tx);

              // Notify both
              await partnerNotificationRepository.create(
                {
                  userId: ctx.userId,
                  type: 'shared_streak_milestone',
                  partnershipId: partnership.id,
                  data: { milestone: sharedStreak },
                },
                tx,
              );
              await partnerNotificationRepository.create(
                {
                  userId: partnerId,
                  type: 'shared_streak_milestone',
                  partnershipId: partnership.id,
                  data: { milestone: sharedStreak },
                },
                tx,
              );
            }
          }
        }

        // Notify partner
        await partnerNotificationRepository.create(
          {
            userId: partnerId,
            type: 'partner_checked_in',
            partnershipId: partnership.id,
            data: {
              response: input.response,
              checkedInByUserId: ctx.userId,
            },
          },
          tx,
        );

        addWide({
          check_in_id: checkIn.id,
          xp_awarded: xpAwarded,
        });

        return checkIn;
      });
    }),

  getToday: protectedProcedure.query(async ({ ctx }) => {
    const checkIns = await checkInRepository.getTodayCheckIns(ctx.userId);
    addWide({ today_check_ins_count: checkIns.length });
    return checkIns;
  }),

  getHistory: protectedProcedure
    .input(getCheckInHistorySchema)
    .query(async ({ ctx, input }) => {
      const partnership = await partnershipRepository.findById(
        input.partnershipId,
        ctx.userId,
      );

      if (!partnership) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return checkInRepository.getHistory(
        input.partnershipId,
        ctx.userId,
        input.cursor,
        input.limit,
      );
    }),

  getPendingReminders: protectedProcedure.query(async ({ ctx }) => {
    const pending = await checkInRepository.getPendingPartnerships(ctx.userId);
    addWide({ pending_check_ins: pending.length });
    return pending;
  }),
};
