import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';

import type { TRPCContext } from './context';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

/**
 * Middleware to enrich the wide event with tRPC procedure info.
 * This runs for every tRPC call and adds RPC context to the canonical log.
 * Uses dynamic imports to prevent server code from being bundled into client.
 */
const wideEventMiddleware = t.middleware(async ({ path, type, next }) => {
  // Dynamic import to prevent bundling into client
  const { addWideRpc, addWideError } =
    await import('@/lib/logging/wideEventStore.server');

  // Add RPC context to the wide event
  addWideRpc({
    system: 'trpc',
    procedure: path,
  });

  try {
    return await next();
  } catch (err) {
    if (err instanceof Error) {
      const code = err instanceof TRPCError ? err.code : undefined;
      addWideError(err, code);
    }
    throw err;
  }
});

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

export const createTRPCRouter = t.router;

// Base procedure with wide event logging
export const publicProcedure = t.procedure.use(wideEventMiddleware);
export const protectedProcedure = t.procedure
  .use(wideEventMiddleware)
  .use(isAuthed);
