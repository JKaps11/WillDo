import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import superjson from 'superjson';
import type { TRPCRouter } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Vanilla tRPC client (for use outside React).
 * Accepts a getToken function to inject the auth header.
 */
export function createTrpcClient(getToken: () => Promise<string | null>): ReturnType<typeof createTRPCClient<TRPCRouter>> {
  return createTRPCClient<TRPCRouter>({
    links: [
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
        transformer: superjson,
        async headers() {
          const token = await getToken();
          return {
            Authorization: token ? `Bearer ${token}` : '',
          };
        },
      }),
    ],
  });
}

/**
 * React tRPC context for hooks.
 */
export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
