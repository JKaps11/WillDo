import { getNotifications } from './expo-notifications';
import { STREAK_WARNING_MESSAGES } from './messages';

/** Notification identifier prefix for streak warnings. */
export const STREAK_WARNING_ID = 'streak-warning';

/**
 * Schedule a streak warning notification for this evening (8 PM)
 * if the user hasn't been active today.
 *
 * @param lastActivityDate - The user's last activity date string (YYYY-MM-DD) or null.
 * @param currentStreak    - The user's current streak count.
 */
export async function scheduleStreakWarning(
  lastActivityDate: string | null,
  currentStreak: number,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  // Cancel any existing streak warnings first
  await cancelStreakWarnings();

  // Only warn if user has a streak worth protecting
  if (currentStreak === 0) return;

  const today = new Date().toISOString().split('T')[0];

  // If user was already active today, no warning needed
  if (lastActivityDate === today) return;

  const message =
    STREAK_WARNING_MESSAGES[
      Math.floor(Math.random() * STREAK_WARNING_MESSAGES.length)
    ];

  // Schedule for 8 PM today
  const trigger = new Date();
  trigger.setHours(20, 0, 0, 0);

  // If it's already past 8 PM, don't schedule
  if (trigger.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_WARNING_ID,
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

/**
 * Cancel all scheduled streak warning notifications.
 */
export async function cancelStreakWarnings(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier === STREAK_WARNING_ID) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier,
      );
    }
  }
}
