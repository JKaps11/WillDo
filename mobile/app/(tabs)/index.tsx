import { useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useTRPC } from '@/lib/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Checkbox, ProgressBar, PriorityBadge, EmptyState } from '@/components/ui';
import { Flame, Star, LayoutDashboard } from 'lucide-react-native';
import { getLevelName } from '@willdo/shared';
import type { UserMetricsResponse } from '@willdo/shared';
import { checkAndFireCelebrations, rescheduleAllNotifications } from '@/lib/notifications';
import { DEFAULT_USER_SETTINGS } from '@willdo/shared';
import { usePracticeSession } from '@/components/practice-session';

export default function DashboardScreen(): React.ReactElement {
  const { user } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { openSession } = usePracticeSession();

  const tasksQuery = useQuery(trpc.dashboard.getTodaysTasks.queryOptions());
  const metricsQuery = useQuery(trpc.metrics.getUserMetrics.queryOptions());
  const userQuery = useQuery(trpc.user.get.queryOptions());

  /** Snapshot metrics before mutation so we can detect milestones. */
  const previousMetricsRef = useRef<UserMetricsResponse | null>(null);

  const completeMutation = useMutation(
    trpc.task.completeWithMetricUpdate.mutationOptions({
      onMutate: () => {
        // Capture current metrics before the mutation
        previousMetricsRef.current = metricsQuery.data ?? null;
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.dashboard.getTodaysTasks.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.metrics.getUserMetrics.queryKey() }),
        ]);

        // After invalidation, get the fresh metrics from the cache
        const newMetrics = queryClient.getQueryData<UserMetricsResponse>(
          trpc.metrics.getUserMetrics.queryKey(),
        );
        const prev = previousMetricsRef.current;
        const notifSettings =
          userQuery.data?.settings?.notifications ??
          DEFAULT_USER_SETTINGS.notifications;

        // Fire celebration notifications if milestones were reached
        if (prev && newMetrics && notifSettings.celebrations) {
          checkAndFireCelebrations(prev, newMetrics);
        }

        // Reschedule notifications (streak status may have changed)
        if (newMetrics) {
          const tasks = queryClient.getQueryData<Array<{ completed: boolean }>>(
            trpc.dashboard.getTodaysTasks.queryKey(),
          );
          rescheduleAllNotifications({
            settings: notifSettings,
            currentStreak: newMetrics.currentStreak,
            lastActivityDate: newMetrics.lastActivityDate,
            incompleteTodayCount: (tasks ?? []).filter((t) => !t.completed).length,
          });
        }
      },
    }),
  );

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trpc.dashboard.getTodaysTasks.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.metrics.getUserMetrics.queryKey() });
  }, [queryClient, trpc]);

  const tasks = tasksQuery.data ?? [];
  const metrics = metricsQuery.data;

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={tasksQuery.isRefetching}
          onRefresh={onRefresh}
          tintColor="#2DB88A"
        />
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ListHeaderComponent={
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Hey, {user?.firstName ?? 'there'}!
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mb-4">
            Here's your progress today
          </Text>

          {/* Metrics Card */}
          {metrics ? (
            <Card className="mb-4">
              <View className="flex-row justify-between mb-3">
                <View className="flex-row items-center">
                  <Flame size={18} color="#EF4444" />
                  <Text className="text-base font-semibold text-gray-900 dark:text-white ml-1">
                    {metrics.currentStreak} day streak
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Star size={18} color="#F59E0B" />
                  <Text className="text-base font-semibold text-gray-900 dark:text-white ml-1">
                    Lvl {metrics.level} · {getLevelName(metrics.level)}
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={metrics.levelProgress}
                label={`${metrics.totalXp} XP`}
                showPercentage
              />

              <View className="mt-3">
                <ProgressBar
                  progress={
                    metrics.weeklyGoal > 0
                      ? (metrics.weeklyCompleted / metrics.weeklyGoal) * 100
                      : 0
                  }
                  label={`Weekly: ${metrics.weeklyCompleted}/${metrics.weeklyGoal} tasks`}
                  showPercentage
                  color="bg-blue-500"
                />
              </View>
            </Card>
          ) : metricsQuery.isLoading ? (
            <Card className="mb-4 items-center py-6">
              <ActivityIndicator color="#2DB88A" />
            </Card>
          ) : null}

          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Today's Tasks ({tasks.length})
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable className="mb-2">
          <Card>
            <View className="flex-row items-start">
              <Checkbox
                checked={item.completed}
                onToggle={() => {
                  if (!item.completed && item.subSkillId) {
                    openSession(
                      { id: item.id, name: item.name, subSkillId: item.subSkillId },
                      new Date(),
                    );
                  } else {
                    completeMutation.mutate({
                      id: item.id,
                      completed: !item.completed,
                    });
                  }
                }}
              />
              <View className="flex-1 ml-3">
                <Text
                  className={`text-base font-medium ${
                    item.completed
                      ? 'text-gray-400 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {item.name}
                </Text>
                <View className="flex-row items-center mt-1 gap-2">
                  {item.skill ? (
                    <View className="flex-row items-center">
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-1"
                        style={{ backgroundColor: item.skill.color }}
                      />
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        {item.skill.name}
                      </Text>
                    </View>
                  ) : null}
                  <PriorityBadge priority={item.priority} />
                </View>
              </View>
            </View>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        tasksQuery.isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#2DB88A" size="large" />
          </View>
        ) : (
          <EmptyState
            icon={LayoutDashboard}
            title="No tasks for today"
            description="Add tasks to your todo list to see them here"
          />
        )
      }
    />
  );
}
