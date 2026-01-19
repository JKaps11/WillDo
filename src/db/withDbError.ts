import type { WideEventDbError } from '@/lib/logging/types';
import { addWide } from '@/lib/logging/wideEventStore.server';

/**
 * Wraps a database operation and captures any errors to the wide event.
 * Use this to ensure DB errors are always logged with context.
 *
 * @example
 * const result = await withDbError('skill.delete', () =>
 *   db.delete(skills).where(...).returning()
 * );
 */
export async function withDbError<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (err instanceof Error) {
      // Extract Drizzle query info if available
      const drizzleErr = err as Error & {
        query?: string;
        params?: Array<unknown>;
        cause?: Error;
      };

      const dbError: WideEventDbError = {
        operation,
        message: err.message,
        query: drizzleErr.query,
        params: drizzleErr.params,
        cause: drizzleErr.cause?.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      };

      addWide({ dbError });
    }

    throw err;
  }
}
