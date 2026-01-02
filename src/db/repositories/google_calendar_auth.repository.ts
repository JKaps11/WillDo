import { eq } from 'drizzle-orm';
import type {
  GoogleCalendarAuth,
  NewGoogleCalendarAuth,
} from '@/db/schemas/google_calendar_auth.schema';
import { googleCalendarAuth } from '@/db/schemas/google_calendar_auth.schema';
import { db } from '@/db/index';

export const googleCalendarAuthRepository = {
  findByUserId: async (userId: string): Promise<GoogleCalendarAuth | null> => {
    const result = await db
      .select()
      .from(googleCalendarAuth)
      .where(eq(googleCalendarAuth.userId, userId))
      .limit(1);

    return result[0] ?? null;
  },

  create: async (
    data: Omit<NewGoogleCalendarAuth, 'createdAt' | 'updatedAt'>,
  ): Promise<GoogleCalendarAuth | null> => {
    const result = await db.insert(googleCalendarAuth).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    userId: string,
    data: Partial<
      Omit<NewGoogleCalendarAuth, 'userId' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<GoogleCalendarAuth | null> => {
    const result = await db
      .update(googleCalendarAuth)
      .set(data)
      .where(eq(googleCalendarAuth.userId, userId))
      .returning();

    return result[0] ?? null;
  },

  delete: async (userId: string): Promise<GoogleCalendarAuth | null> => {
    const result = await db
      .delete(googleCalendarAuth)
      .where(eq(googleCalendarAuth.userId, userId))
      .returning();

    return result[0] ?? null;
  },
};
