import { getNotifications } from './expo-notifications';
import type { UserSettings } from '@willdo/shared';
import { scheduleStreakWarning, cancelStreakWarnings } from './streak-notifications';
import { scheduleNudges, cancelNudges } from './nudge-notifications';
import { scheduleTaskReminder, cancelTaskReminders } from './task-reminder-notifications';

export interface SchedulerInput {
  /** User's notification settings. */
  settings: UserSettings['notifications'];
  /** User's current streak count. */
  currentStreak: number;
  /** User's last activity date (YYYY-MM-DD) or null. */
  lastActivityDate: string | null;
  /** Number of incomplete tasks for today. */
  incompleteTodayCount: number;
}

/**
 * Cancel all scheduled notifications and reschedule based on
 * current metrics, tasks, and user settings.
 */
export async function rescheduleAllNotifications(
  input: SchedulerInput,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  // Cancel everything first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { settings, currentStreak, lastActivityDate, incompleteTodayCount } =
    input;

  const promises: Array<Promise<void>> = [];

  if (settings.streakWarnings) {
    promises.push(scheduleStreakWarning(lastActivityDate, currentStreak));
  } else {
    promises.push(cancelStreakWarnings());
  }

  if (settings.nudges) {
    promises.push(scheduleNudges(lastActivityDate));
  } else {
    promises.push(cancelNudges());
  }

  if (settings.taskReminders) {
    promises.push(scheduleTaskReminder(incompleteTodayCount));
  } else {
    promises.push(cancelTaskReminders());
  }

  await Promise.all(promises);
}
