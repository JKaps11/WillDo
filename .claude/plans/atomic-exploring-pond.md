# Comprehensive Screenshot & Help Docs Audit + Dark Mode

## Context

After visually inspecting all 22 screenshots and cross-referencing with the actual UI components and help docs, there are systemic quality issues:

**Visual issues found in screenshots:**
- All screenshots are light mode — should be dark mode
- "SCREENSHOT_" prefix visible in skill names (planner header, dashboard task cards, skills hub cards)
- E2E test data ("E2E Test Skill...", "test") leaking into skills hub overview
- Active Skill card shows "No active skill selected" — seed never sets active skill
- Dashboard shows only 1 task — screenshots are date-dependent, only Saturday task shows
- `help-planner-node` captures an EMPTY canvas (nodes not yet rendered when clip fires)
- `help-tips-recurring` and `help-todo-schedule-modal` are still pixel-identical (MD5 confirmed)
- `help-todo-task-card` clips only completed/strikethrough tasks — bad "anatomy" example
- `help-todo-assign-panel` shows "No unassigned tasks" — empty panel

**Help docs inaccuracies:**
- "Step 3: Review & Create" described in Skills Hub section — wizard only has 2 steps
- "Priority badge" listed in Todo task card features — priority badges are commented out in `Task.tsx`
- "When you drop a task, a schedule modal appears" — drag-drop directly moves tasks, no modal opens

---

## Plan

### Step 1: Enable Dark Mode for Screenshots

**File: `tests/screenshots/capture-screenshots.spec.ts`**

Add `page.addInitScript` in every test (or a shared helper) BEFORE any navigation:
```ts
await page.addInitScript(() => {
  localStorage.setItem('willdo-theme', 'dark');
});
```

The app reads `willdo-theme` from localStorage in `src/lib/theme.tsx` and adds the `dark` class to `<html>`. This must be called before the first `goto`.

**Implementation:** Create a helper function `setupDarkMode(page)` that calls `addInitScript` and use it at the start of every test, OR better — modify the test setup to inject it once. Since these are serial tests sharing a page context, add it in `beforeAll` or as a fixture override.

Actually, the simplest approach: the `page` fixture in `base.fixture.ts` sets up Clerk tokens. We can add dark mode there, or — since it only applies to screenshots — add `page.addInitScript(...)` at the top of each test. But since these are serial tests, adding it once in the first test or in a `beforeEach` is cleaner.

**Best approach:** Add to the Playwright config for the screenshots project:
```ts
{
  name: 'screenshots',
  testDir: './tests/screenshots',
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'tests/.auth/user.json',
    colorScheme: 'dark',  // Adds prefers-color-scheme: dark
  },
}
```

BUT the app uses localStorage, not `prefers-color-scheme` directly (unless theme is "system"). Since default is "system", setting `colorScheme: 'dark'` in Playwright WILL work — the app's init script checks `prefers-color-scheme` when theme is "system". This is the cleanest solution.

### Step 2: Fix Seed Data

**File: `tests/screenshots/screenshot-data.ts`**

#### 2a. Remove SCREENSHOT_ prefix from display names
- Change skill names to clean values: `'Learn Spanish'`, `'Learn Guitar'`
- Remove `SCREENSHOT_PREFIX` constant usage in skill names

#### 2b. Update cleanup to use stored IDs
- `seedScreenshotData` already returns `{ skills, subSkills, tasks }` with IDs
- Change `cleanupScreenshotData` to accept an optional list of skill IDs to delete
- For the `beforeAll` initial cleanup (before seed): query all skills and delete any that match the known clean names ("Learn Spanish", "Learn Guitar") to handle leftover data from previous failed runs
- For `afterAll` cleanup: delete by the IDs returned from `seedScreenshotData`

#### 2c. Clean up E2E test data before screenshots
- In `beforeAll`, also call `deleteAllTestSkills(page)` from `tests/helpers/api.helpers.ts` to remove E2E-prefixed skills
- Also delete any skills named "test" (leftover manual data)

#### 2d. Set active skill
- After creating the Spanish skill, call `trpcMutate(page, 'user.setActiveSkill', { skillId: spanishSkill.id })`

#### 2e. Schedule tasks for today
- Currently tasks are spread Mon-Sat using `getCurrentWeekDates()`. The dashboard shows "Today's Tasks" so we need tasks on today specifically.
- Change: schedule 3-4 tasks for `new Date()` (today) with varied states:
  - 1 completed task with metrics
  - 1-2 uncompleted tasks with metrics/recurring
  - Keep some tasks spread across the week for todo-weekly screenshots
- Create at least 2 tasks with `todoListDate: undefined/null` (unassigned) for the assign panel screenshot

### Step 3: Fix Broken/Poor Screenshots

**File: `tests/screenshots/capture-screenshots.spec.ts`**

#### 3a. `help-planner-node` — empty canvas
- Issue: Node clip fires before fit-view animation positions nodes
- Fix: After clicking fit-view, wait for the node to have a valid bounding box with `page.waitForFunction` or increase timeout significantly (500ms → 1500ms), then verify `boundingBox()` returns non-null within viewport before clipping

#### 3b. `help-tips-recurring` — identical to schedule-modal
- Issue: Both open the same task's modal with recurring already toggled on (daily)
- Fix: Open on a different (non-recurring) task, toggle recurring ON, switch frequency to "weekly", select specific days (Mon/Wed/Fri) — making it visually distinct

#### 3c. `help-todo-task-card` — only completed tasks
- Fix: Target a day card that has a mix of completed and uncompleted tasks (with better seed data, Wednesday has 4 tasks with mixed states)

#### 3d. `help-todo-assign-panel` — "No unassigned tasks"
- Fix: With unassigned tasks added to seed data (step 2e), the panel will show actual tasks

#### 3e. `help-dashboard-full` / `landing-hero-dashboard` — sparse
- Fix: With more today-tasks seeded (step 2e) and active skill set (step 2d), the dashboard will look fuller

### Step 4: Fix Help Documentation

**File: `src/components/help/HelpContent.tsx`**

#### 4a. Remove "Step 3: Review & Create" from Skills Hub section
- Lines 342-346: Delete the "Step 3" heading and paragraph. The actual wizard only has 2 steps: "Basic Info" and "AI Planning". The skill is created directly from step 2.

#### 4b. Fix Todo List "Task Cards" section
- Line 556-558: Remove the "Priority badge" bullet — priority badges are commented out in `Task.tsx` (line 137-139)
- The visible elements in a todo task card are: skill color line, task name, edit button (appears on hover), checkbox

#### 4c. Fix "Rescheduling Tasks" description
- Lines 575-586: Currently says "When you drop a task, a schedule modal appears"
- Reality: Drag-and-drop directly moves the task to the target day. The schedule modal is opened separately via the edit (pencil) button on each task.
- Rewrite to: "Drag any task from one day to another to reschedule it instantly." Then separately describe the edit button opening the schedule modal for recurrence settings.

---

## Files to Modify

| File | Changes |
|---|---|
| `playwright.config.ts` | Add `colorScheme: 'dark'` to screenshots project |
| `tests/screenshots/screenshot-data.ts` | Clean skill names, set active skill, add today-tasks, add unassigned tasks, ID-based cleanup |
| `tests/screenshots/capture-screenshots.spec.ts` | Fix node timing, differentiate recurring screenshot, fix task-card clip, clean E2E data in beforeAll |
| `src/components/help/HelpContent.tsx` | Remove Step 3, remove Priority badge, fix rescheduling text |

## Verification

1. `bunx playwright test --project=screenshots` — all tests pass
2. Visually inspect screenshots:
   - All are dark mode (dark backgrounds, light text)
   - No "SCREENSHOT_" or "E2E" prefixes visible anywhere
   - Dashboard shows multiple tasks, populated active skill, metrics/chart
   - `help-planner-node` shows an actual rendered node with stage color
   - `help-todo-assign-panel` shows tasks available to assign
   - `help-tips-recurring` is visually distinct from `help-todo-schedule-modal`
   - `help-todo-task-card` shows uncompleted tasks with visible features
3. `md5sum public/images/screenshots/help-*.png | sort` — no duplicate hashes among help screenshots
4. Read help content and confirm it matches actual UI (no Step 3, no priority badge, correct rescheduling behavior)
