import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';
import { DEFAULT_USER_SETTINGS } from '@willdo/shared';
import { requestNotificationPermissions } from './permissions';
import { rescheduleAllNotifications } from './scheduler';

/**
 * Hook that sets up notification scheduling.
 * - Requests permissions on first sign-in.
 * - Reschedules notifications on mount and when app returns to foreground.
 */
export function useNotificationSetup(): void {
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const hasRequestedPermissions = useRef(false);

  const userQuery = useQuery({
    ...trpc.user.get.queryOptions(),
    enabled: !!isSignedIn,
  });

  const metricsQuery = useQuery({
    ...trpc.metrics.getUserMetrics.queryOptions(),
    enabled: !!isSignedIn,
  });

  const tasksQuery = useQuery({
    ...trpc.dashboard.getTodaysTasks.queryOptions(),
    enabled: !!isSignedIn,
  });

  // Request permissions once when user is first signed in
  useEffect(() => {
    if (isSignedIn && !hasRequestedPermissions.current) {
      hasRequestedPermissions.current = true;
      requestNotificationPermissions();
    }
  }, [isSignedIn]);

  // Reschedule notifications when data changes
  useEffect(() => {
    if (!isSignedIn || !userQuery.data || !metricsQuery.data) return;

    const settings =
      userQuery.data.settings?.notifications ??
      DEFAULT_USER_SETTINGS.notifications;
    const metrics = metricsQuery.data;
    const tasks = tasksQuery.data ?? [];
    const incompleteTodayCount = tasks.filter((t) => !t.completed).length;

    rescheduleAllNotifications({
      settings,
      currentStreak: metrics.currentStreak,
      lastActivityDate: metrics.lastActivityDate,
      incompleteTodayCount,
    });
  }, [isSignedIn, userQuery.data, metricsQuery.data, tasksQuery.data]);

  // Reschedule on app foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus): void => {
      if (nextState === 'active' && isSignedIn) {
        // Invalidate queries to get fresh data, which will trigger reschedule
        queryClient.invalidateQueries({
          queryKey: trpc.metrics.getUserMetrics.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getTodaysTasks.queryKey(),
        });
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [isSignedIn, queryClient, trpc]);
}
