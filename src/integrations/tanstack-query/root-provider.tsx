import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';

import type { TRPCRouter } from '@/integrations/trpc/routes/router';

import { TRPCProvider } from '@/integrations/trpc/react';

function getUrl(): string {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    return `http://localhost:${process.env.PORT ?? 3000}`;
  })();
  return `${base}/api/trpc`;
}

/** HTTP client for client-side usage */
export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchStreamLink({
      transformer: superjson,
      url: getUrl(),
    }),
  ],
});

export async function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });

  // On server: use direct procedure calls (bypasses HTTP, has auth context)
  // On client: use HTTP client
  const isServer = typeof window === 'undefined';

  let serverHelpers: ReturnType<typeof createTRPCOptionsProxy<TRPCRouter>>;

  if (isServer) {
    // Dynamic import to prevent server code from bundling into client
    const { trpcRouter } = await import('@/integrations/trpc/routes/router');
    const { createTRPCContext } = await import('@/integrations/trpc/context');

    serverHelpers = createTRPCOptionsProxy<TRPCRouter>({
      ctx: createTRPCContext,
      router: trpcRouter,
      queryClient: queryClient,
    });
  } else {
    // Client: use HTTP client
    serverHelpers = createTRPCOptionsProxy<TRPCRouter>({
      client: trpcClient,
      queryClient: queryClient,
    });
  }

  return {
    queryClient,
    trpc: serverHelpers,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  );
}
