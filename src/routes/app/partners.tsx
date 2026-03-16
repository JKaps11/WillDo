import { createFileRoute } from '@tanstack/react-router';

import { PartnerHub } from '@/components/partners';
import { ensureUser } from '@/serverFunctions/auth';

export const Route = createFileRoute('/app/partners')({
  loader: async ({ context }) => {
    await ensureUser();
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.partnership.list.queryOptions(),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.checkIn.getPendingReminders.queryOptions(),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.partnership.listInvites.queryOptions(),
      ),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  return <PartnerHub />;
}
