import crypto from 'node:crypto';
import { and, count, eq, or, sql } from 'drizzle-orm';
import { addDays } from 'date-fns';

import type { DbClient } from '@/db/index';
import type {
  NewPartnership,
  Partnership,
} from '@/db/schemas/partnership.schema';
import type { PartnershipSharing } from '@/db/schemas/partnership_sharing.schema';
import type { PartnerInvite } from '@/db/schemas/partner_invite.schema';
import { db } from '@/db/index';
import { partnerships } from '@/db/schemas/partnership.schema';
import { partnershipSharing } from '@/db/schemas/partnership_sharing.schema';
import { partnerInvites } from '@/db/schemas/partner_invite.schema';
import { users } from '@/db/schemas/user.schema';
import { withDbError } from '@/db/withDbError';

/* ---------- Projection Types ---------- */

export interface PartnershipWithPartner extends Partnership {
  partnerName: string;
  partnerEmail: string;
}

/* ---------- Repository ---------- */

export const partnershipRepository = {
  /* ---------- Partnership CRUD ---------- */

  findById: async (id: string, userId: string): Promise<Partnership | null> => {
    return withDbError('partnership.findById', async () => {
      const result = await db
        .select()
        .from(partnerships)
        .where(
          and(
            eq(partnerships.id, id),
            or(
              eq(partnerships.inviterId, userId),
              eq(partnerships.inviteeId, userId),
            ),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    });
  },

  listActive: async (
    userId: string,
  ): Promise<Array<PartnershipWithPartner>> => {
    return withDbError('partnership.listActive', async () => {
      const result = await db
        .select({
          id: partnerships.id,
          inviterId: partnerships.inviterId,
          inviteeId: partnerships.inviteeId,
          status: partnerships.status,
          checkInFrequency: partnerships.checkInFrequency,
          damageEnabled: partnerships.damageEnabled,
          createdAt: partnerships.createdAt,
          updatedAt: partnerships.updatedAt,
          partnerName: users.name,
          partnerEmail: users.email,
        })
        .from(partnerships)
        .innerJoin(
          users,
          sql`CASE
            WHEN ${partnerships.inviterId} = ${userId} THEN ${partnerships.inviteeId} = ${users.id}
            ELSE ${partnerships.inviterId} = ${users.id}
          END`,
        )
        .where(
          and(
            or(
              eq(partnerships.inviterId, userId),
              eq(partnerships.inviteeId, userId),
            ),
            eq(partnerships.status, 'active'),
          ),
        );

      return result;
    });
  },

  listAll: async (userId: string): Promise<Array<PartnershipWithPartner>> => {
    return withDbError('partnership.listAll', async () => {
      const result = await db
        .select({
          id: partnerships.id,
          inviterId: partnerships.inviterId,
          inviteeId: partnerships.inviteeId,
          status: partnerships.status,
          checkInFrequency: partnerships.checkInFrequency,
          damageEnabled: partnerships.damageEnabled,
          createdAt: partnerships.createdAt,
          updatedAt: partnerships.updatedAt,
          partnerName: users.name,
          partnerEmail: users.email,
        })
        .from(partnerships)
        .innerJoin(
          users,
          sql`CASE
            WHEN ${partnerships.inviterId} = ${userId} THEN ${partnerships.inviteeId} = ${users.id}
            ELSE ${partnerships.inviterId} = ${users.id}
          END`,
        )
        .where(
          or(
            eq(partnerships.inviterId, userId),
            eq(partnerships.inviteeId, userId),
          ),
        );

      return result;
    });
  },

  countActive: async (userId: string): Promise<number> => {
    return withDbError('partnership.countActive', async () => {
      const result = await db
        .select({ count: count() })
        .from(partnerships)
        .where(
          and(
            or(
              eq(partnerships.inviterId, userId),
              eq(partnerships.inviteeId, userId),
            ),
            eq(partnerships.status, 'active'),
          ),
        );

      return result[0]?.count ?? 0;
    });
  },

  create: async (
    data: NewPartnership,
    dbClient: DbClient = db,
  ): Promise<Partnership> => {
    return withDbError('partnership.create', async () => {
      const result = await dbClient
        .insert(partnerships)
        .values(data)
        .returning();

      return result[0];
    });
  },

  updateStatus: async (
    id: string,
    userId: string,
    status: Partnership['status'],
    dbClient: DbClient = db,
  ): Promise<Partnership | null> => {
    return withDbError('partnership.updateStatus', async () => {
      const result = await dbClient
        .update(partnerships)
        .set({ status, updatedAt: new Date() })
        .where(
          and(
            eq(partnerships.id, id),
            or(
              eq(partnerships.inviterId, userId),
              eq(partnerships.inviteeId, userId),
            ),
          ),
        )
        .returning();

      return result[0] ?? null;
    });
  },

  updateSettings: async (
    id: string,
    userId: string,
    settings: {
      checkInFrequency?: Partnership['checkInFrequency'];
      damageEnabled?: boolean;
    },
    dbClient: DbClient = db,
  ): Promise<Partnership | null> => {
    return withDbError('partnership.updateSettings', async () => {
      const result = await dbClient
        .update(partnerships)
        .set({ ...settings, updatedAt: new Date() })
        .where(
          and(
            eq(partnerships.id, id),
            or(
              eq(partnerships.inviterId, userId),
              eq(partnerships.inviteeId, userId),
            ),
          ),
        )
        .returning();

      return result[0] ?? null;
    });
  },

  /* ---------- Sharing Prefs ---------- */

  getSharingPrefs: async (
    partnershipId: string,
    userId: string,
  ): Promise<PartnershipSharing | null> => {
    return withDbError('partnership.getSharingPrefs', async () => {
      const result = await db
        .select()
        .from(partnershipSharing)
        .where(
          and(
            eq(partnershipSharing.partnershipId, partnershipId),
            eq(partnershipSharing.userId, userId),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    });
  },

  createSharingPrefs: async (
    data: { partnershipId: string; userId: string },
    dbClient: DbClient = db,
  ): Promise<PartnershipSharing> => {
    return withDbError('partnership.createSharingPrefs', async () => {
      const result = await dbClient
        .insert(partnershipSharing)
        .values(data)
        .returning();

      return result[0];
    });
  },

  updateSharingPrefs: async (
    partnershipId: string,
    userId: string,
    prefs: Partial<
      Pick<
        PartnershipSharing,
        | 'shareStreaks'
        | 'shareCompletionRate'
        | 'shareSkillNames'
        | 'shareSkillTree'
        | 'shareTasks'
        | 'shareXpLevel'
      >
    >,
    dbClient: DbClient = db,
  ): Promise<PartnershipSharing | null> => {
    return withDbError('partnership.updateSharingPrefs', async () => {
      const result = await dbClient
        .update(partnershipSharing)
        .set({ ...prefs, updatedAt: new Date() })
        .where(
          and(
            eq(partnershipSharing.partnershipId, partnershipId),
            eq(partnershipSharing.userId, userId),
          ),
        )
        .returning();

      return result[0] ?? null;
    });
  },

  /* ---------- Invites ---------- */

  createInvite: async (
    inviterId: string,
    inviteeEmail?: string,
    dbClient: DbClient = db,
  ): Promise<PartnerInvite> => {
    return withDbError('partnership.createInvite', async () => {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = addDays(new Date(), 7);

      const result = await dbClient
        .insert(partnerInvites)
        .values({
          inviterId,
          token,
          inviteeEmail: inviteeEmail ?? null,
          expiresAt,
        })
        .returning();

      return result[0];
    });
  },

  findInviteByToken: async (token: string): Promise<PartnerInvite | null> => {
    return withDbError('partnership.findInviteByToken', async () => {
      const result = await db
        .select()
        .from(partnerInvites)
        .where(eq(partnerInvites.token, token))
        .limit(1);

      return result[0] ?? null;
    });
  },

  findInviteByTokenPublic: async (
    token: string,
  ): Promise<{
    inviterName: string;
    status: PartnerInvite['status'];
    expiresAt: Date;
    inviteeEmail: string | null;
  } | null> => {
    return withDbError('partnership.findInviteByTokenPublic', async () => {
      const result = await db
        .select({
          inviterName: users.name,
          status: partnerInvites.status,
          expiresAt: partnerInvites.expiresAt,
          inviteeEmail: partnerInvites.inviteeEmail,
        })
        .from(partnerInvites)
        .innerJoin(users, eq(partnerInvites.inviterId, users.id))
        .where(eq(partnerInvites.token, token))
        .limit(1);

      return result[0] ?? null;
    });
  },

  findInviteById: async (
    id: string,
    inviterId: string,
  ): Promise<PartnerInvite | null> => {
    return withDbError('partnership.findInviteById', async () => {
      const result = await db
        .select()
        .from(partnerInvites)
        .where(
          and(
            eq(partnerInvites.id, id),
            eq(partnerInvites.inviterId, inviterId),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    });
  },

  listInvites: async (userId: string): Promise<Array<PartnerInvite>> => {
    return withDbError('partnership.listInvites', async () => {
      return db
        .select()
        .from(partnerInvites)
        .where(
          and(
            eq(partnerInvites.inviterId, userId),
            eq(partnerInvites.status, 'pending'),
          ),
        );
    });
  },

  updateInviteStatus: async (
    id: string,
    status: PartnerInvite['status'],
    partnershipId?: string,
    dbClient: DbClient = db,
  ): Promise<PartnerInvite | null> => {
    return withDbError('partnership.updateInviteStatus', async () => {
      const result = await dbClient
        .update(partnerInvites)
        .set({
          status,
          partnershipId: partnershipId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(partnerInvites.id, id))
        .returning();

      return result[0] ?? null;
    });
  },

  countPendingInvites: async (userId: string): Promise<number> => {
    return withDbError('partnership.countPendingInvites', async () => {
      const result = await db
        .select({ count: count() })
        .from(partnerInvites)
        .where(
          and(
            eq(partnerInvites.inviterId, userId),
            eq(partnerInvites.status, 'pending'),
          ),
        );

      return result[0]?.count ?? 0;
    });
  },
};
