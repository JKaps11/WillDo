import { and, count, desc, eq, lt, sql } from 'drizzle-orm';
import { startOfDay } from 'date-fns';

import type { DbClient } from '@/db/index';
import { db } from '@/db/index';
import { checkIns, type CheckIn } from '@/db/schemas/check_in.schema';
import { partnerships } from '@/db/schemas/partnership.schema';
import { withDbError } from '@/db/withDbError';

/* ---------- Projection Types ---------- */

export interface PendingCheckIn {
  partnershipId: string;
  checkInFrequency: string;
}

/* ---------- Repository ---------- */

export const checkInRepository = {
  create: async (
    data: {
      partnershipId: string;
      userId: string;
      date: Date;
      response: CheckIn['response'];
      note?: string | null;
      xpAwarded: number;
    },
    dbClient: DbClient = db,
  ): Promise<CheckIn> => {
    return withDbError('checkIn.create', async () => {
      const result = await dbClient
        .insert(checkIns)
        .values({
          partnershipId: data.partnershipId,
          userId: data.userId,
          date: data.date,
          response: data.response,
          note: data.note ?? null,
          xpAwarded: data.xpAwarded,
        })
        .returning();

      return result[0];
    });
  },

  findByPartnershipAndDate: async (
    partnershipId: string,
    userId: string,
    date: Date,
  ): Promise<CheckIn | null> => {
    return withDbError('checkIn.findByPartnershipAndDate', async () => {
      const result = await db
        .select()
        .from(checkIns)
        .where(
          and(
            eq(checkIns.partnershipId, partnershipId),
            eq(checkIns.userId, userId),
            eq(checkIns.date, startOfDay(date)),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    });
  },

  getTodayCheckIns: async (userId: string): Promise<CheckIn[]> => {
    return withDbError('checkIn.getTodayCheckIns', async () => {
      const today = startOfDay(new Date());
      return db
        .select()
        .from(checkIns)
        .where(and(eq(checkIns.userId, userId), eq(checkIns.date, today)));
    });
  },

  getHistory: async (
    partnershipId: string,
    userId: string,
    cursor?: Date,
    limit: number = 20,
  ): Promise<CheckIn[]> => {
    return withDbError('checkIn.getHistory', async () => {
      const conditions = [
        eq(checkIns.partnershipId, partnershipId),
        eq(checkIns.userId, userId),
      ];

      if (cursor) {
        conditions.push(lt(checkIns.date, cursor));
      }

      return db
        .select()
        .from(checkIns)
        .where(and(...conditions))
        .orderBy(desc(checkIns.date))
        .limit(limit);
    });
  },

  getPendingPartnerships: async (
    userId: string,
  ): Promise<PendingCheckIn[]> => {
    return withDbError('checkIn.getPendingPartnerships', async () => {
      const today = startOfDay(new Date());

      // Get active partnerships where user hasn't checked in today
      const activePartnerships = await db
        .select({
          partnershipId: partnerships.id,
          checkInFrequency: partnerships.checkInFrequency,
        })
        .from(partnerships)
        .where(
          and(
            sql`(${partnerships.inviterId} = ${userId} OR ${partnerships.inviteeId} = ${userId})`,
            eq(partnerships.status, 'active'),
          ),
        );

      // Filter out partnerships where user has already checked in today
      const todayCheckIns = await db
        .select({ partnershipId: checkIns.partnershipId })
        .from(checkIns)
        .where(and(eq(checkIns.userId, userId), eq(checkIns.date, today)));

      const checkedInIds = new Set(
        todayCheckIns.map((c) => c.partnershipId),
      );

      return activePartnerships.filter(
        (p) => !checkedInIds.has(p.partnershipId),
      );
    });
  },

  /**
   * Count consecutive days where BOTH partners checked in for a partnership.
   * Used to calculate shared streak.
   */
  calculateSharedStreak: async (
    partnershipId: string,
    inviterId: string,
    inviteeId: string,
  ): Promise<number> => {
    return withDbError('checkIn.calculateSharedStreak', async () => {
      // Get dates where both partners checked in
      const result = await db.execute<{ check_date: string }>(sql`
        SELECT a.date AS check_date
        FROM check_in a
        INNER JOIN check_in b
          ON a.partnership_id = b.partnership_id
          AND a.date = b.date
        WHERE a.partnership_id = ${partnershipId}
          AND a.user_id = ${inviterId}
          AND b.user_id = ${inviteeId}
        ORDER BY a.date DESC
      `);

      if (result.rows.length === 0) return 0;

      let streak = 0;
      const today = startOfDay(new Date());

      for (const row of result.rows) {
        const checkDate = startOfDay(new Date(row.check_date));
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);

        if (checkDate.getTime() === startOfDay(expectedDate).getTime()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    });
  },

  /**
   * Get check-ins since a given date for damage calculation.
   */
  getMissedCheckInDates: async (
    partnershipId: string,
    userId: string,
    since: Date,
  ): Promise<number> => {
    return withDbError('checkIn.getMissedCheckInDates', async () => {
      const result = await db
        .select({ count: count() })
        .from(checkIns)
        .where(
          and(
            eq(checkIns.partnershipId, partnershipId),
            eq(checkIns.userId, userId),
            sql`${checkIns.date} >= ${since}`,
            eq(checkIns.response, 'no'),
          ),
        );

      return result[0]?.count ?? 0;
    });
  },
};
