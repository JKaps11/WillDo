import { useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { TRPCProvider } from './client';
import type { TRPCRouter } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function TRPCQueryProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { getToken } = useAuth();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 2,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    createTRPCClient<TRPCRouter>({
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
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
