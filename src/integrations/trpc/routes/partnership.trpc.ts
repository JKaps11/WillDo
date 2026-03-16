import { TRPCError } from '@trpc/server';
import { startOfDay } from 'date-fns';

import { protectedProcedure, publicProcedure } from '../init';
import {
  createInviteSchema,
  acceptInviteSchema,
  revokeInviteSchema,
  getInviteByTokenSchema,
  getPartnershipSchema,
  updateSharingPrefsSchema,
  updatePartnershipSettingsSchema,
  partnershipActionSchema,
} from '@/lib/zod-schemas';
import { db } from '@/db/index';
import { partnershipRepository } from '@/db/repositories/partnership.repository';
import { checkInRepository } from '@/db/repositories/check_in.repository';
import { partnerNotificationRepository } from '@/db/repositories/partner_notification.repository';
import { userMetricsRepository } from '@/db/repositories/user_metrics.repository';
import { MAX_ACTIVE_PARTNERS } from '@/lib/constants/xp';
import { addWide } from '@/lib/logging/wideEventStore.server';

export const partnershipRouter = {
  /* ---------- Invites ---------- */

  createInvite: protectedProcedure
    .input(createInviteSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ action: 'create_partner_invite' });

      // Enforce max partner limit (active + pending invites)
      const activeCount = await partnershipRepository.countActive(ctx.userId);
      const pendingCount = await partnershipRepository.countPendingInvites(
        ctx.userId,
      );

      if (activeCount + pendingCount >= MAX_ACTIVE_PARTNERS) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Maximum ${MAX_ACTIVE_PARTNERS} active partners allowed`,
        });
      }

      const invite = await partnershipRepository.createInvite(
        ctx.userId,
        input.inviteeEmail,
      );

      addWide({ invite_id: invite.id });
      return invite;
    }),

  listInvites: protectedProcedure.query(async ({ ctx }) => {
    const invites = await partnershipRepository.listInvites(ctx.userId);
    addWide({ invites_count: invites.length });
    return invites;
  }),

  getInviteByToken: publicProcedure
    .input(getInviteByTokenSchema)
    .query(async ({ input }) => {
      const invite = await partnershipRepository.findInviteByToken(
        input.token,
      );

      if (!invite) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found' });
      }

      if (invite.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invite is ${invite.status}`,
        });
      }

      if (new Date() > invite.expiresAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invite has expired',
        });
      }

      return { inviterId: invite.inviterId, inviteeEmail: invite.inviteeEmail };
    }),

  acceptInvite: protectedProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ action: 'accept_partner_invite' });

      const invite = await partnershipRepository.findInviteByToken(
        input.token,
      );

      if (!invite) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found' });
      }

      if (invite.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invite is ${invite.status}`,
        });
      }

      if (new Date() > invite.expiresAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invite has expired',
        });
      }

      if (invite.inviterId === ctx.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot accept your own invite',
        });
      }

      // Enforce max partners for both users
      const inviterActiveCount = await partnershipRepository.countActive(
        invite.inviterId,
      );
      if (inviterActiveCount >= MAX_ACTIVE_PARTNERS) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Inviter has reached maximum partner limit',
        });
      }

      const inviteeActiveCount = await partnershipRepository.countActive(
        ctx.userId,
      );
      if (inviteeActiveCount >= MAX_ACTIVE_PARTNERS) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Maximum ${MAX_ACTIVE_PARTNERS} active partners allowed`,
        });
      }

      return db.transaction(async (tx) => {
        // Create partnership
        const partnership = await partnershipRepository.create(
          {
            inviterId: invite.inviterId,
            inviteeId: ctx.userId,
            status: 'active',
          },
          tx,
        );

        // Create sharing prefs for both users
        await partnershipRepository.createSharingPrefs(
          { partnershipId: partnership.id, userId: invite.inviterId },
          tx,
        );
        await partnershipRepository.createSharingPrefs(
          { partnershipId: partnership.id, userId: ctx.userId },
          tx,
        );

        // Update invite status
        await partnershipRepository.updateInviteStatus(
          invite.id,
          'accepted',
          partnership.id,
          tx,
        );

        // Notify inviter
        await partnerNotificationRepository.create(
          {
            userId: invite.inviterId,
            type: 'invite_accepted',
            partnershipId: partnership.id,
            data: { acceptedByUserId: ctx.userId },
          },
          tx,
        );

        addWide({ partnership_id: partnership.id });
        return partnership;
      });
    }),

  revokeInvite: protectedProcedure
    .input(revokeInviteSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({ action: 'revoke_partner_invite', invite_id: input.inviteId });

      const invite = await partnershipRepository.findInviteById(
        input.inviteId,
        ctx.userId,
      );

      if (!invite) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (invite.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only revoke pending invites',
        });
      }

      return partnershipRepository.updateInviteStatus(invite.id, 'revoked');
    }),

  /* ---------- Partnership CRUD ---------- */

  list: protectedProcedure.query(async ({ ctx }) => {
    const partnerships = await partnershipRepository.listAll(ctx.userId);
    addWide({ partnerships_count: partnerships.length });
    return partnerships;
  }),

  getPartnerDashboard: protectedProcedure
    .input(getPartnershipSchema)
    .query(async ({ ctx, input }) => {
      const partnership = await partnershipRepository.findById(
        input.partnershipId,
        ctx.userId,
      );

      if (!partnership) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const partnerId =
        partnership.inviterId === ctx.userId
          ? partnership.inviteeId
          : partnership.inviterId;

      // Get partner's sharing prefs (what they allow us to see)
      const partnerSharingPrefs =
        await partnershipRepository.getSharingPrefs(
          partnership.id,
          partnerId,
        );

      // Get our sharing prefs
      const mySharingPrefs = await partnershipRepository.getSharingPrefs(
        partnership.id,
        ctx.userId,
      );

      // Build dashboard based on sharing prefs
      const dashboard: Record<string, unknown> = {
        partnership,
        mySharingPrefs,
        partnerData: {},
      };

      if (
        partnerSharingPrefs?.shareStreaks &&
        partnerSharingPrefs.shareStreaks !== 'none'
      ) {
        const metrics = await userMetricsRepository.findByUserId(partnerId);
        if (metrics) {
          (dashboard.partnerData as Record<string, unknown>).streaks = {
            currentStreak: metrics.currentStreak,
            bestStreak: metrics.bestStreak,
          };
        }
      }

      if (
        partnerSharingPrefs?.shareXpLevel &&
        partnerSharingPrefs.shareXpLevel !== 'none'
      ) {
        const metrics = await userMetricsRepository.findByUserId(partnerId);
        if (metrics) {
          (dashboard.partnerData as Record<string, unknown>).xp = {
            totalXp: metrics.totalXp,
          };
        }
      }

      if (
        partnerSharingPrefs?.shareCompletionRate &&
        partnerSharingPrefs.shareCompletionRate !== 'none'
      ) {
        const metrics = await userMetricsRepository.findByUserId(partnerId);
        if (metrics) {
          (dashboard.partnerData as Record<string, unknown>).completionRate = {
            tasksCompleted: metrics.tasksCompleted,
            weeklyCompleted: metrics.weeklyCompleted,
            weeklyGoal: metrics.weeklyGoal,
          };
        }
      }

      // Shared streak
      const sharedStreak = await checkInRepository.calculateSharedStreak(
        partnership.id,
        partnership.inviterId,
        partnership.inviteeId,
      );
      (dashboard.partnerData as Record<string, unknown>).sharedStreak =
        sharedStreak;

      // Today's check-in status
      const today = startOfDay(new Date());
      const myCheckIn = await checkInRepository.findByPartnershipAndDate(
        partnership.id,
        ctx.userId,
        today,
      );
      const partnerCheckIn =
        await checkInRepository.findByPartnershipAndDate(
          partnership.id,
          partnerId,
          today,
        );

      (dashboard.partnerData as Record<string, unknown>).todayCheckIn = {
        myResponse: myCheckIn?.response ?? null,
        partnerResponded: partnerCheckIn !== null,
      };

      return dashboard;
    }),

  updateSharingPrefs: protectedProcedure
    .input(updateSharingPrefsSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({
        action: 'update_sharing_prefs',
        partnership_id: input.partnershipId,
      });

      const partnership = await partnershipRepository.findById(
        input.partnershipId,
        ctx.userId,
      );
      if (!partnership) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const { partnershipId, ...prefs } = input;
      return partnershipRepository.updateSharingPrefs(
        partnershipId,
        ctx.userId,
        prefs,
      );
    }),

  updateSettings: protectedProcedure
    .input(updatePartnershipSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({
        action: 'update_partnership_settings',
        partnership_id: input.partnershipId,
      });

      const { partnershipId, ...settings } = input;

      // If enabling damage, both partners must consent
      // For now, the inviter/invitee can toggle — future: require mutual consent
      return partnershipRepository.updateSettings(
        partnershipId,
        ctx.userId,
        settings,
      );
    }),

  end: protectedProcedure
    .input(partnershipActionSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({
        action: 'end_partnership',
        partnership_id: input.partnershipId,
      });

      return partnershipRepository.updateStatus(
        input.partnershipId,
        ctx.userId,
        'ended',
      );
    }),

  pause: protectedProcedure
    .input(partnershipActionSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({
        action: 'pause_partnership',
        partnership_id: input.partnershipId,
      });

      return partnershipRepository.updateStatus(
        input.partnershipId,
        ctx.userId,
        'paused',
      );
    }),

  resume: protectedProcedure
    .input(partnershipActionSchema)
    .mutation(async ({ ctx, input }) => {
      addWide({
        action: 'resume_partnership',
        partnership_id: input.partnershipId,
      });

      return partnershipRepository.updateStatus(
        input.partnershipId,
        ctx.userId,
        'active',
      );
    }),
};
