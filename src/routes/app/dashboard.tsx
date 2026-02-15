import { createFileRoute } from '@tanstack/react-router';

import { Dashboard } from '@/components/dashboard';
import { ensureUser } from '@/serverFunctions/auth';

export const Route = createFileRoute('/app/dashboard')({
  loader: async ({ context }) => {
    await ensureUser();
    await Promise.all([
      // User data (needed for active skill)
      context.queryClient.ensureQueryData(context.trpc.user.get.queryOptions()),
      // Existing queries
      context.queryClient.ensureQueryData(
        context.trpc.dashboard.getTodaysTasks.queryOptions(),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.skill.list.queryOptions({ includeArchived: false }),
      ),
      // Metrics queries
      context.queryClient.ensureQueryData(
        context.trpc.metrics.getUserMetrics.queryOptions(),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.metrics.getInsights.queryOptions(),
      ),
      // Chart data - preload all 3 periods
      context.queryClient.ensureQueryData(
        context.trpc.metrics.getTimeSeries.queryOptions({ period: 'week' }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.metrics.getTimeSeries.queryOptions({ period: 'month' }),
      ),
      context.queryClient.ensureQueryData(
        context.trpc.metrics.getTimeSeries.queryOptions({ period: 'year' }),
      ),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  return <Dashboard />;
}
