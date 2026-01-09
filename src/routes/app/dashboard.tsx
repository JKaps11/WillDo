import { createFileRoute } from '@tanstack/react-router';

import { Dashboard } from '@/components/dashboard';
import { ensureUser } from '@/utils/auth';

export const Route = createFileRoute('/app/dashboard')({
  loader: async ({ context }) => {
    await ensureUser();
    // Prefetch dashboard data in parallel
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.dashboard.getTodaysTasks.queryOptions(),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.skill.list.queryOptions({ includeArchived: false }),
      ),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  return <Dashboard />;
}
