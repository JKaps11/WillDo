/* ---------- Streak Warning Messages ---------- */

export const STREAK_WARNING_MESSAGES: Array<{
  title: string;
  body: string;
}> = [
  {
    title: "Don't lose your streak!",
    body: "You haven't completed any tasks today. Keep your streak alive!",
  },
  {
    title: 'Your streak is at risk!',
    body: "There's still time to complete a task and keep your streak going.",
  },
  {
    title: 'Streak check-in',
    body: 'A quick task is all it takes to keep your streak alive.',
  },
];

/* ---------- Task Reminder Messages ---------- */

export const TASK_REMINDER_MESSAGES: Array<{
  title: string;
  body: string;
}> = [
  {
    title: 'Good morning!',
    body: 'You have tasks waiting for you today. Time to get productive!',
  },
  {
    title: 'Rise and grind!',
    body: "Today's tasks are ready. Let's make some progress!",
  },
  {
    title: 'New day, new tasks',
    body: 'Your todo list is calling. Start checking things off!',
  },
];

/* ---------- Celebration Messages ---------- */

export const STREAK_MILESTONE_MESSAGES: Record<
  number,
  { title: string; body: string }
> = {
  7: { title: '1 Week Streak!', body: '7 days in a row! You are on fire!' },
  14: {
    title: '2 Week Streak!',
    body: "14 days strong! You're building a real habit.",
  },
  30: {
    title: '1 Month Streak!',
    body: '30 days! Your consistency is truly impressive.',
  },
  50: {
    title: '50 Day Streak!',
    body: "Half a century of productivity! You're unstoppable.",
  },
  100: {
    title: '100 Day Streak!',
    body: 'Triple digits! You are a productivity legend.',
  },
  365: {
    title: '1 YEAR STREAK!',
    body: '365 days of consistent effort. Absolutely incredible.',
  },
};

export function getLevelUpMessage(level: number): {
  title: string;
  body: string;
} {
  return {
    title: `Level ${level} Reached!`,
    body: `Congratulations! You've leveled up to level ${level}. Keep going!`,
  };
}

export const WEEKLY_GOAL_COMPLETE_MESSAGE = {
  title: 'Weekly Goal Complete!',
  body: "You've hit your weekly goal! Amazing work this week.",
};

/* ---------- Passive-Aggressive Nudge Messages ---------- */

export const NUDGE_MESSAGES: Array<{ title: string; body: string }> = [
  // Day 2
  {
    title: 'Hey, just checking in...',
    body: 'Your tasks are starting to pile up.',
  },
  // Day 3
  {
    title: 'We miss you!',
    body: 'Your tasks have been lonely for 3 days.',
  },
  // Day 4
  {
    title: "These reminders don't seem to be working...",
    body: "Your tasks aren't going to complete themselves.",
  },
  // Day 5
  {
    title: 'Still here. Still waiting.',
    body: "We're starting to think you forgot about us.",
  },
  // Day 6
  {
    title: 'Okay, this is getting awkward',
    body: 'Your todo list is judging you silently.',
  },
  // Day 7
  {
    title: 'Your streak called.',
    body: "It's filing for divorce.",
  },
  // Day 8
  {
    title: "We've been ghosted before...",
    body: "But this one hurts different.",
  },
  // Day 9
  {
    title: 'Plot twist:',
    body: 'The tasks were inside you all along. Please do them.',
  },
  // Day 10
  {
    title: "At this point, we're impressed",
    body: 'Ignoring us for this long takes real commitment.',
  },
  // Day 11
  {
    title: 'Final warning (not really)',
    body: "We'll keep sending these forever. You know that, right?",
  },
  // Day 12+
  {
    title: "We're running out of passive-aggressive things to say",
    body: 'Please just open the app. We made it really nice for you.',
  },
];
