import { getNotifications } from './expo-notifications';
import { TASK_REMINDER_MESSAGES } from './messages';

/** Notification identifier for task reminders. */
export const TASK_REMINDER_ID = 'task-reminder';

/**
 * Schedule a morning task reminder if the user has incomplete tasks today.
 *
 * @param incompleteTodayCount - Number of incomplete tasks for today.
 */
export async function scheduleTaskReminder(
  incompleteTodayCount: number,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  // Cancel any existing task reminders first
  await cancelTaskReminders();

  if (incompleteTodayCount === 0) return;

  const message =
    TASK_REMINDER_MESSAGES[
      Math.floor(Math.random() * TASK_REMINDER_MESSAGES.length)
    ];

  // Schedule for 8 AM tomorrow
  const trigger = new Date();
  trigger.setDate(trigger.getDate() + 1);
  trigger.setHours(8, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: TASK_REMINDER_ID,
    content: {
      title: message.title,
      body: `${incompleteTodayCount} task${incompleteTodayCount === 1 ? '' : 's'} waiting for you. ${message.body}`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

/**
 * Cancel all scheduled task reminder notifications.
 */
export async function cancelTaskReminders(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier === TASK_REMINDER_ID) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier,
      );
    }
  }
}
