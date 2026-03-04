import { and, count, eq, gte, lt, sql } from 'drizzle-orm';

import type {
  CompletionEvent,
  CompletionEventType,
  NewCompletionEvent,
} from '@/db/schemas/completion_event.schema';
import type { DbClient } from '@/db/index';
import { db } from '@/db/index';
import { completionEvents } from '@/db/schemas/completion_event.schema';
import { withDbError } from '@/db/withDbError';

/* ---------- Types ---------- */

export interface TimeSeriesPoint {
  date: string;
  tasks: number;
  subSkills: number;
  skills: number;
}

/* ---------- Repository ---------- */

export const completionEventRepository = {
  create: async (
    data: Omit<NewCompletionEvent, 'id' | 'createdAt' | 'updatedAt'>,
    dbClient: DbClient = db,
  ): Promise<CompletionEvent | null> => {
    return withDbError('completionEvent.create', async () => {
      const result = await dbClient
        .insert(completionEvents)
        .values(data)
        .returning();

      return result[0] ?? null;
    });
  },

  delete: async (
    userId: string,
    entityId: string,
    eventType: CompletionEventType,
    dbClient: DbClient = db,
  ): Promise<CompletionEvent | null> => {
    return withDbError('completionEvent.delete', async () => {
      const result = await dbClient
        .delete(completionEvents)
        .where(
          and(
            eq(completionEvents.userId, userId),
            eq(completionEvents.entityId, entityId),
            eq(completionEvents.eventType, eventType),
          ),
        )
        .returning();

      return result[0] ?? null;
    });
  },

  findByEntity: async (
    userId: string,
    entityId: string,
    eventType: CompletionEventType,
  ): Promise<CompletionEvent | null> => {
    return withDbError('completionEvent.findByEntity', async () => {
      const result = await db
        .select()
        .from(completionEvents)
        .where(
          and(
            eq(completionEvents.userId, userId),
            eq(completionEvents.entityId, entityId),
            eq(completionEvents.eventType, eventType),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    });
  },

  /**
   * Get time series data grouped by day for week/month views.
   * Returns an array with one entry per day, containing counts for all 3 event types.
   */
  getTimeSeriesByDay: async (
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<TimeSeriesPoint>> => {
    return withDbError('completionEvent.getTimeSeriesByDay', async () => {
      const result = await db
        .select({
          date: sql<string>`DATE(${completionEvents.completedAt})`.as('date'),
          eventType: completionEvents.eventType,
          count: count(),
        })
        .from(completionEvents)
        .where(
          and(
            eq(completionEvents.userId, userId),
            gte(completionEvents.completedAt, startDate),
            lt(completionEvents.completedAt, endDate),
          ),
        )
        .groupBy(
          sql`DATE(${completionEvents.completedAt})`,
          completionEvents.eventType,
        )
        .orderBy(sql`DATE(${completionEvents.completedAt})`);

      return aggregateTimeSeries(result);
    });
  },

  /**
   * Get time series data grouped by month for year view.
   * Returns an array with one entry per month, containing counts for all 3 event types.
   */
  getTimeSeriesByMonth: async (
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<TimeSeriesPoint>> => {
    return withDbError('completionEvent.getTimeSeriesByMonth', async () => {
      const result = await db
        .select({
          date: sql<string>`TO_CHAR(${completionEvents.completedAt}, 'YYYY-MM')`.as(
            'month',
          ),
          eventType: completionEvents.eventType,
          count: count(),
        })
        .from(completionEvents)
        .where(
          and(
            eq(completionEvents.userId, userId),
            gte(completionEvents.completedAt, startDate),
            lt(completionEvents.completedAt, endDate),
          ),
        )
        .groupBy(
          sql`TO_CHAR(${completionEvents.completedAt}, 'YYYY-MM')`,
          completionEvents.eventType,
        )
        .orderBy(sql`TO_CHAR(${completionEvents.completedAt}, 'YYYY-MM')`);

      return aggregateTimeSeries(result);
    });
  },

  /**
   * Count events on a specific date (for streak calculation).
   */
  countByDate: async (userId: string, date: Date): Promise<number> => {
    return withDbError('completionEvent.countByDate', async () => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const result = await db
        .select({ count: count() })
        .from(completionEvents)
        .where(
          and(
            eq(completionEvents.userId, userId),
            gte(completionEvents.completedAt, date),
            lt(completionEvents.completedAt, nextDay),
          ),
        );

      return result[0]?.count ?? 0;
    });
  },

  /**
   * Get all distinct dates with activity (for streak recalculation).
   */
  getActivityDates: async (
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<Date>> => {
    return withDbError('completionEvent.getActivityDates', async () => {
      const result = await db
        .selectDistinct({
          date: sql<string>`DATE(${completionEvents.completedAt})`.as('date'),
        })
        .from(completionEvents)
        .where(
          and(
            eq(completionEvents.userId, userId),
            gte(completionEvents.completedAt, startDate),
            lt(completionEvents.completedAt, endDate),
          ),
        )
        .orderBy(sql`DATE(${completionEvents.completedAt})`);

      return result.map((r) => new Date(r.date));
    });
  },
};

/* ---------- Helpers ---------- */

interface RawTimeSeriesRow {
  date: string;
  eventType: CompletionEventType;
  count: number;
}

function aggregateTimeSeries(
  rows: Array<RawTimeSeriesRow>,
): Array<TimeSeriesPoint> {
  const map = new Map<string, TimeSeriesPoint>();

  for (const row of rows) {
    let point = map.get(row.date);
    if (!point) {
      point = { date: row.date, tasks: 0, subSkills: 0, skills: 0 };
      map.set(row.date, point);
    }

    switch (row.eventType) {
      case 'task_completed':
        point.tasks = row.count;
        break;
      case 'subskill_completed':
        point.subSkills = row.count;
        break;
      case 'skill_archived':
        point.skills = row.count;
        break;
      default:
        row.eventType satisfies never;
    }
  }

  return Array.from(map.values());
}
