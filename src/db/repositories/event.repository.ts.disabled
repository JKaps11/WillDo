import { and, eq, gte, lte } from 'drizzle-orm';
import type { Event, NewEvent } from '@/db/schemas/event.schema';
import { events } from '@/db/schemas/event.schema';
import { db } from '@/db/index';

export const eventRepository = {
  findById: async (id: string, userId: string): Promise<Event | null> => {
    const result = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .limit(1);

    return result[0] ?? null;
  },

  findByTimeRange: async (
    userId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Array<Event>> => {
    const result = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.userId, userId),
          gte(events.endTime, startTime),
          lte(events.startTime, endTime),
        ),
      )
      .orderBy(events.startTime);

    return result;
  },

  create: async (
    data: Omit<NewEvent, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Event | null> => {
    const result = await db.insert(events).values(data).returning();

    return result[0] ?? null;
  },

  update: async (
    id: string,
    userId: string,
    data: Partial<Omit<NewEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Event | null> => {
    const result = await db
      .update(events)
      .set(data)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  delete: async (id: string, userId: string): Promise<Event | null> => {
    const result = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();

    return result[0] ?? null;
  },

  findByGoogleEventId: async (
    googleEventId: string,
    userId: string,
  ): Promise<Event | null> => {
    const result = await db
      .select()
      .from(events)
      .where(
        and(eq(events.googleEventId, googleEventId), eq(events.userId, userId)),
      )
      .limit(1);

    return result[0] ?? null;
  },

  findPendingSync: async (userId: string): Promise<Array<Event>> => {
    const result = await db
      .select()
      .from(events)
      .where(and(eq(events.userId, userId), eq(events.syncStatus, 'pending')));

    return result;
  },
};
