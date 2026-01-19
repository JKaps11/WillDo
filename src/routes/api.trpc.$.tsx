import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createFileRoute } from '@tanstack/react-router';
import { createTRPCContext } from '@/integrations/trpc/context';
import { trpcRouter } from '@/integrations/trpc/routes/router';

async function handler({ request }: { request: Request }): Promise<Response> {
  const { addWide } = await import('@/lib/logging/wideEventStore.server');

  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: '/api/trpc',
    createContext: createTRPCContext,
    onError: ({ error, path }) => {
      addWide({
        error: {
          message: error.message,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        trpc_error_path: path,
      });
    },
  });
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
