import { createMiddleware, createStart } from '@tanstack/react-start';
import { clerkMiddleware } from '@clerk/tanstack-react-start/server';
import type { AnyRequestMiddleware } from '@tanstack/react-start';
import type { WideEvent } from './lib/logging/types';

/**
 * Wide event logging middleware.
 * Initializes the request-scoped wide event and emits it on completion.
 * Uses dynamic imports to prevent server code from being bundled into client.
 */
const wideEventMiddleware: AnyRequestMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ request, next }) => {
  // Dynamic import to prevent bundling into client
  const { runWithWideEvent, getWideEvent } =
    await import('./lib/logging/wideEventStore.server');
  const { finalizeAndEmit } = await import('./lib/logging/logger.server');

  const url: URL = new URL(request.url);
  const start: number = performance.now();

  const wideEvent: WideEvent = {
    event: 'http_request',
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    status_code: null,
    duration_ms: null,
  };

  return runWithWideEvent(wideEvent, async () => {
    try {
      const result = await next();

      const event: WideEvent | undefined = getWideEvent();
      if (event) {
        event.status_code = result.response.status;
        event.duration_ms = Math.round(performance.now() - start);
      }

      return result;
    } catch (err: unknown) {
      const event: WideEvent | undefined = getWideEvent();
      if (event) {
        event.status_code = 500;
        event.duration_ms = Math.round(performance.now() - start);
        if (err instanceof Error) {
          event.error = {
            message: err.message,
            stack:
              process.env.NODE_ENV === 'development' ? err.stack : undefined,
          };
        }
      }
      throw err;
    } finally {
      const event: WideEvent | undefined = getWideEvent();
      if (event) {
        finalizeAndEmit(event);
      }
    }
  });
});

/**
 * Middleware to enrich wide event with user context from Clerk.
 * Must run after clerkMiddleware to access auth state.
 */
const enrichUserMiddleware: AnyRequestMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ next }) => {
  const result = await next();

  // Try to enrich user info from Clerk's auth context
  try {
    const { auth } = await import('@clerk/tanstack-react-start/server');
    const { addWideUser } = await import('./lib/logging/wideEventStore.server');
    const { userId } = await auth();
    if (userId) {
      addWideUser({ id: userId });
    }
  } catch {
    // Auth not available, skip enrichment
  }

  return result;
});

/**
 * TanStack Start instance configuration.
 */
export const startInstance = createStart(() => {
  return {
    requestMiddleware: [
      wideEventMiddleware,
      clerkMiddleware(),
      enrichUserMiddleware,
    ],
  };
});
