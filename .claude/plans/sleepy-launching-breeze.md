# Duolingo-Style Notifications for Mobile App

## Context
The WillDo mobile app (Expo + React Native) has streaks, XP, levels, and weekly goals but **no notification infrastructure**. Users can silently lose streaks with no reminders. Adding Duolingo-style local push notifications will drive engagement by warning about streak loss, celebrating milestones, reminding about tasks, and sending escalating nudges for inactivity.

## Notification Types
1. **Streak warnings** — evening alert if user hasn't been active today and streak is at risk
2. **Task reminders** — morning reminder when user has tasks scheduled for today
3. **Celebration pushes** — immediate notification on streak milestones, level ups, weekly goal completion
4. **Passive-aggressive nudges** — escalating guilt messages after 2+ days of inactivity

## Approach: Local Scheduling via `expo-notifications`
All notifications scheduled on-device. No push server needed. Reschedule on every app open + task completion + settings change.

---

## Implementation Steps

### 1. Install dependencies
```bash
cd mobile && npx expo install expo-notifications expo-device
```

Update `mobile/app.json` — add `expo-notifications` plugin and Android notification permissions.

### 2. Add notification toggles to existing UserSettings

No new DB table or migration needed. Add a `notifications` section to the existing `UserSettings` JSONB structure. The repository's `patchSettings` already deep-merges, so existing users without this key will get defaults automatically.

**Modify `packages/shared/src/db-types.ts`** — extend `UserSettings` interface:
```typescript
export interface UserSettings {
  appearance: { theme: AppearanceTheme };
  todoList: { sortBy: TodoListSortBy; timeSpan: TodoListTimeSpan; showCompleted: boolean };
  notifications: {
    streakWarnings: boolean;   // default: true
    nudges: boolean;           // default: true
    celebrations: boolean;     // default: true
    taskReminders: boolean;    // default: true
  };
}
```

Update `DEFAULT_USER_SETTINGS` to include `notifications` defaults (all `true`).

**Modify `packages/shared/src/zod-schemas/user.ts`** — add `notifications` to `userSettingsSchema` and `patchUserSettingsSchema`.

**No changes needed to**: DB schema, repository, tRPC routes, or router.ts — the existing `user.patchSettings` endpoint handles everything.

### 3. Notification utilities (mobile)
**New directory**: `mobile/src/lib/notifications/`

| File | Purpose |
|------|---------|
| `permissions.ts` | Request permissions, setup Android channel |
| `messages.ts` | All notification copy (streak warnings, 11 escalating nudge messages, celebration milestones, task reminders) |
| `streak-notifications.ts` | Schedule streak warning if `lastActivityDate` is not today |
| `nudge-notifications.ts` | Schedule 5 future escalating nudges if inactive 2+ days |
| `task-reminder-notifications.ts` | Schedule morning reminder if user has incomplete tasks today |
| `celebration-notifications.ts` | Fire immediate notifications on streak milestones (7/14/30/50/100/365), level ups, weekly goal completion |
| `scheduler.ts` | Orchestrator — cancel all, reschedule based on current metrics + tasks + settings |
| `useNotificationSetup.ts` | React hook — fetches metrics/tasks/user settings, runs scheduler on mount and app foreground |
| `index.ts` | Re-exports |

### 4. Root layout integration
**Modify**: `mobile/app/_layout.tsx`
- Add `useNotificationSetup()` call inside `AuthGuard`
- Configure `Notifications.setNotificationHandler` for foreground display

### 5. Celebration integration on task completion
**Modify**: `mobile/app/(tabs)/index.tsx`
- In `completeMutation.onSuccess`: capture previous metrics, compare with new metrics after invalidation, fire celebration notifications for streak/level/weekly milestones
- Also reschedule all notifications (streak status changed)

### 6. Settings screen
**New file**: `mobile/app/settings.tsx`
- 4 toggle switches: Streak Warnings, Nudge Reminders, Celebrations, Task Reminders
- Uses existing `trpc.user.get` to read settings and `trpc.user.patchSettings` to update
- On toggle change → patch settings → reschedule notifications
- If OS permissions denied → show banner with link to device settings

**Modify**: `mobile/app/(tabs)/_layout.tsx`
- Add settings gear icon in Dashboard header → navigates to `/settings`

---

## Key Files to Modify
- `packages/shared/src/db-types.ts` — add `notifications` to `UserSettings` interface + defaults
- `packages/shared/src/zod-schemas/user.ts` — add `notifications` to settings + patch schemas
- `mobile/app.json` — add expo-notifications plugin
- `mobile/app/_layout.tsx` — notification setup hook + handler
- `mobile/app/(tabs)/_layout.tsx` — settings nav button
- `mobile/app/(tabs)/index.tsx` — celebration triggers on task completion

## Key Files to Create
- `mobile/src/lib/notifications/` (8 files: permissions, messages, streak/nudge/task-reminder/celebration notifications, scheduler, hook, index)
- `mobile/app/settings.tsx`

## Passive-Aggressive Nudge Messages (escalating)
- Day 2: "Hey, just checking in..." / "Your tasks are starting to pile up."
- Day 3: "We miss you!" / "Your tasks have been lonely for 3 days."
- Day 4: "These reminders don't seem to be working..." / "Your tasks aren't going to complete themselves."
- Day 5: "Still here. Still waiting." / "We're starting to think you forgot about us."
- Day 6: "Okay, this is getting awkward" / "Your todo list is judging you silently."
- Day 7: "Your streak called. It's filing for divorce."
- Day 8+: Continues escalating through 11 messages, ending with "We're running out of passive-aggressive things to say"

## Verification
1. `bun run check` — linting/formatting passes
2. Start mobile app in Expo Go → permissions prompt appears on first sign-in
3. Settings screen → toggles update via `patchSettings` and reschedule notifications
4. Complete a task → celebration notification fires (if milestone hit)
5. Close app → streak warning fires at configured hour if no activity
6. Go inactive 2+ days → nudge notifications appear with escalating tone
