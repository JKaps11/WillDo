import type { TRPCRouter } from '@/integrations/trpc/routes/router';
import { createTRPCContext } from '@trpc/tanstack-react-query';

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
