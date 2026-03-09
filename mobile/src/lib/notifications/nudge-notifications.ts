import { getNotifications } from './expo-notifications';
import { NUDGE_MESSAGES } from './messages';

/** Notification identifier prefix for nudge messages. */
const NUDGE_ID_PREFIX = 'nudge-';

/** Number of future nudges to schedule at once. */
const NUDGE_SCHEDULE_COUNT = 5;

/**
 * Schedule escalating passive-aggressive nudge notifications
 * if the user has been inactive for 2+ days.
 *
 * Schedules one nudge per day for the next NUDGE_SCHEDULE_COUNT days,
 * with messages that escalate in tone.
 *
 * @param lastActivityDate - The user's last activity date string (YYYY-MM-DD) or null.
 */
export async function scheduleNudges(
  lastActivityDate: string | null,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  // Cancel any existing nudges first
  await cancelNudges();

  if (!lastActivityDate) return;

  const lastActive = new Date(lastActivityDate);
  const now = new Date();
  const daysSinceActive = Math.floor(
    (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Only start nudging after 2+ days of inactivity
  if (daysSinceActive < 2) return;

  for (let i = 0; i < NUDGE_SCHEDULE_COUNT; i++) {
    const nudgeDay = daysSinceActive + i;
    // Map nudge day to message index (day 2 = index 0), capping at last message
    const messageIndex = Math.min(nudgeDay - 2, NUDGE_MESSAGES.length - 1);
    const message = NUDGE_MESSAGES[messageIndex];

    // Schedule for 10 AM, i days from now
    const trigger = new Date();
    trigger.setDate(trigger.getDate() + i);
    trigger.setHours(10, 0, 0, 0);

    // Skip if trigger is in the past
    if (trigger.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${NUDGE_ID_PREFIX}${i}`,
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
}

/**
 * Cancel all scheduled nudge notifications.
 */
export async function cancelNudges(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith(NUDGE_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier,
      );
    }
  }
}
