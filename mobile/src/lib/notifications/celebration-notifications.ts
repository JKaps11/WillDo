import { getNotifications } from './expo-notifications';
import {
  STREAK_MILESTONE_MESSAGES,
  getLevelUpMessage,
  WEEKLY_GOAL_COMPLETE_MESSAGE,
} from './messages';
import type { UserMetricsResponse } from '@willdo/shared';

/**
 * Fire an immediate celebration notification for a streak milestone.
 */
export async function fireCelebrationIfStreakMilestone(
  streak: number,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  const message = STREAK_MILESTONE_MESSAGES[streak];
  if (!message) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
    },
    trigger: null, // Immediate
  });
}

/**
 * Fire an immediate celebration notification for a level up.
 */
export async function fireCelebrationIfLevelUp(
  previousLevel: number,
  newLevel: number,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  if (newLevel <= previousLevel) return;

  const message = getLevelUpMessage(newLevel);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
    },
    trigger: null,
  });
}

/**
 * Fire an immediate celebration notification for weekly goal completion.
 */
export async function fireCelebrationIfWeeklyGoalComplete(
  previousCompleted: number,
  newCompleted: number,
  weeklyGoal: number,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  // Fire only when crossing the threshold
  if (previousCompleted >= weeklyGoal || newCompleted < weeklyGoal) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: WEEKLY_GOAL_COMPLETE_MESSAGE.title,
      body: WEEKLY_GOAL_COMPLETE_MESSAGE.body,
      sound: 'default',
    },
    trigger: null,
  });
}

/**
 * Check all celebration conditions and fire appropriate notifications.
 * Compares previous metrics with new metrics after a task completion.
 */
export async function checkAndFireCelebrations(
  previousMetrics: UserMetricsResponse,
  newMetrics: UserMetricsResponse,
): Promise<void> {
  await Promise.all([
    fireCelebrationIfStreakMilestone(newMetrics.currentStreak),
    fireCelebrationIfLevelUp(previousMetrics.level, newMetrics.level),
    fireCelebrationIfWeeklyGoalComplete(
      previousMetrics.weeklyCompleted,
      newMetrics.weeklyCompleted,
      newMetrics.weeklyGoal,
    ),
  ]);
}
