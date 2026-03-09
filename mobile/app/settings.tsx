import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/client';
import { DEFAULT_USER_SETTINGS } from '@willdo/shared';
import type { UserSettings } from '@willdo/shared';
import {
  hasNotificationPermissions,
  rescheduleAllNotifications,
} from '@/lib/notifications';

const ACTIVE_COLOR = '#2DB88A';

type NotificationKey = keyof UserSettings['notifications'];

const NOTIFICATION_TOGGLES: Array<{
  key: NotificationKey;
  label: string;
  description: string;
}> = [
  {
    key: 'streakWarnings',
    label: 'Streak Warnings',
    description: 'Evening alert if your streak is at risk',
  },
  {
    key: 'nudges',
    label: 'Nudge Reminders',
    description: 'Escalating reminders after days of inactivity',
  },
  {
    key: 'celebrations',
    label: 'Celebrations',
    description: 'Notifications for streak milestones and level ups',
  },
  {
    key: 'taskReminders',
    label: 'Task Reminders',
    description: 'Morning reminder when you have tasks scheduled',
  },
];

export default function SettingsScreen(): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [permissionsDenied, setPermissionsDenied] = useState(false);

  const userQuery = useQuery(trpc.user.get.queryOptions());
  const metricsQuery = useQuery(trpc.metrics.getUserMetrics.queryOptions());
  const tasksQuery = useQuery(trpc.dashboard.getTodaysTasks.queryOptions());

  const notifSettings =
    userQuery.data?.settings?.notifications ??
    DEFAULT_USER_SETTINGS.notifications;

  // Check if OS permissions are denied
  useEffect(() => {
    hasNotificationPermissions().then((granted) =>
      setPermissionsDenied(!granted),
    );
  }, []);

  const patchMutation = useMutation(
    trpc.user.patchSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.get.queryKey() });
      },
    }),
  );

  const handleToggle = useCallback(
    (key: NotificationKey, value: boolean) => {
      const newSettings = { ...notifSettings, [key]: value };

      patchMutation.mutate({ notifications: newSettings });

      // Reschedule with new settings
      const metrics = metricsQuery.data;
      const tasks = tasksQuery.data ?? [];
      if (metrics) {
        rescheduleAllNotifications({
          settings: newSettings,
          currentStreak: metrics.currentStreak,
          lastActivityDate: metrics.lastActivityDate,
          incompleteTodayCount: tasks.filter((t) => !t.completed).length,
        });
      }
    },
    [notifSettings, patchMutation, metricsQuery.data, tasksQuery.data],
  );

  const openDeviceSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Settings', headerBackTitle: 'Back' }} />
      <ScrollView
        className="flex-1 bg-white dark:bg-gray-900"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Notifications
        </Text>

        {permissionsDenied ? (
          <Pressable
            onPress={openDeviceSettings}
            className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6"
          >
            <Text className="text-amber-800 dark:text-amber-200 font-semibold mb-1">
              Notifications are disabled
            </Text>
            <Text className="text-amber-700 dark:text-amber-300 text-sm">
              Tap here to open device settings and enable notifications for
              WillDo.
            </Text>
          </Pressable>
        ) : null}

        {NOTIFICATION_TOGGLES.map(({ key, label, description }) => (
          <View
            key={key}
            className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800"
          >
            <View className="flex-1 mr-4">
              <Text className="text-base font-medium text-gray-900 dark:text-white">
                {label}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </Text>
            </View>
            <Switch
              value={notifSettings[key]}
              onValueChange={(value) => handleToggle(key, value)}
              trackColor={{ false: '#D1D5DB', true: ACTIVE_COLOR }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </ScrollView>
    </>
  );
}
