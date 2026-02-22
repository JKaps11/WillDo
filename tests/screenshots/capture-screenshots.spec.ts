import type { Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { test, expect } from '../fixtures/base.fixture';
import { seedScreenshotData, cleanupScreenshotData } from './screenshot-data';
import { join } from 'node:path';

const SCREENSHOTS_DIR = join(
  process.cwd(),
  'public',
  'images',
  'screenshots',
);

// Helper to wait for animations to settle before taking a screenshot.
// Uses a race between finishing animations and a timeout so infinite/looping
// animations don't hang the test.
async function waitForAnimations(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const animations = document.getAnimations();
    if (animations.length === 0) return true;
    // Race: either all finite animations finish, or 400ms elapses
    return Promise.race([
      Promise.all(
        animations
          .filter((a) => a.effect?.getComputedTiming().duration !== Infinity)
          .map((a) => a.finished),
      ).then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(true), 400)),
    ]);
  }, undefined, { timeout: 5000 }).catch(() => {
    // If it still times out somehow, just continue
  });
}

// Helper to save screenshot with consistent settings
async function saveScreenshot(
  page: Page,
  filename: string,
  options?: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } },
): Promise<void> {
  const filepath = join(SCREENSHOTS_DIR, `${filename}.png`);
  await page.screenshot({
    path: filepath,
    fullPage: options?.fullPage ?? false,
    clip: options?.clip,
  });
  console.log(`Saved: ${filename}.png`);
}

test.describe.serial('Screenshot Capture', () => {
  let screenshotData: Awaited<ReturnType<typeof seedScreenshotData>>;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await context.newPage();
    await setupClerkTestingToken({ page });
    // Clean up all leftover data (previous runs, E2E tests, etc.)
    await cleanupScreenshotData(page);
    screenshotData = await seedScreenshotData(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await context.newPage();
    await setupClerkTestingToken({ page });
    // Navigate to refresh Clerk session before API calls
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    // Clean up by stored IDs + name matching for robustness
    const skillIds = screenshotData.skills.map((s) => s.id);
    await cleanupScreenshotData(page, skillIds);
    await context.close();
  });

  // ===================
  // LANDING PAGE (4)
  // ===================

  test('landing-hero-dashboard: Dashboard overview for hero section', async ({
    page,
    dashboard,
  }) => {
    await dashboard.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page); // Allow animations to complete
    await saveScreenshot(page, 'landing-hero-dashboard');
  });

  test('landing-feature-skill-planner: Skill planner flowchart', async ({
    page,
    planner,
  }) => {
    const skillId = screenshotData.skills[0]?.id;
    expect(skillId).toBeDefined();
    await planner.goto(skillId!);
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    // Fit the view to show all nodes
    const fitButton = page.locator('[aria-label="fit view"]').first();
    if (await fitButton.isVisible()) {
      await fitButton.click();
      await waitForAnimations(page);
    }
    await saveScreenshot(page, 'landing-feature-skill-planner');
  });

  test('landing-feature-stages: Sub-skill stages in edit panel', async ({
    page,
    planner,
  }) => {
    const skillId = screenshotData.skills[0]?.id;
    expect(skillId).toBeDefined();
    await planner.goto(skillId!);
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Click on a sub-skill node to open edit panel
    const grammarNode = page
      .locator('.react-flow__node')
      .filter({ hasText: 'Grammar Fundamentals' });
    if (await grammarNode.isVisible()) {
      await grammarNode.click();
      await waitForAnimations(page);
    }
    await saveScreenshot(page, 'landing-feature-stages');
  });

  test('landing-feature-todolist: Todo list weekly view', async ({
    page,
    todoList,
  }) => {
    await todoList.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    await saveScreenshot(page, 'landing-feature-todolist');
  });

  // ===================
  // HELP CONTENT (18)
  // ===================

  // Note: help-getting-started-workflow is a static SVG, created separately
  // help-getting-started-overview reuses help-dashboard-full (slug updated in HelpContent)
  // help-getting-started-stages reuses landing-feature-stages (slug updated in HelpContent)

  // Dashboard Section (3)
  test('help-dashboard-full: Full dashboard view', async ({
    page,
    dashboard,
  }) => {
    await dashboard.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    await saveScreenshot(page, 'help-dashboard-full');
  });

  test('help-dashboard-task-card: Task card anatomy', async ({
    page,
    dashboard,
  }) => {
    await dashboard.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Capture an uncompleted task card via DashboardPom helper
    const card = await dashboard.findFirstUncompletedTaskCard();
    if (card && (await card.isVisible())) {
      const box = await card.boundingBox();
      if (box) {
        const padding = 20;
        await saveScreenshot(page, 'help-dashboard-task-card', {
          clip: {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + padding * 2,
            height: box.height + padding * 2,
          },
        });
        return;
      }
    }
    // Final fallback to full page
    await saveScreenshot(page, 'help-dashboard-task-card');
  });

  test('help-dashboard-active-skill: Active Skill card', async ({
    page,
    dashboard,
  }) => {
    await dashboard.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Capture the ActiveSkill card
    const activeSkill = page.locator('[data-testid="active-skill"]').first();
    if (await activeSkill.isVisible()) {
      const box = await activeSkill.boundingBox();
      if (box) {
        const padding = 10;
        await saveScreenshot(page, 'help-dashboard-active-skill', {
          clip: {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + padding * 2,
            height: box.height + padding * 2,
          },
        });
        return;
      }
    }
    // Fallback to full page
    await saveScreenshot(page, 'help-dashboard-active-skill');
  });

  // Skills Hub Section (4)
  test('help-skills-hub-overview: Skills Hub overview', async ({
    page,
    skillsHub,
  }) => {
    await skillsHub.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    await saveScreenshot(page, 'help-skills-hub-overview');
  });

  test('help-skills-hub-basic-info: Skill creation basic info step', async ({
    page,
    skillsHub,
    skillForm,
  }) => {
    await skillsHub.goto();
    await page.waitForLoadState('networkidle');
    await skillsHub.newSkillButton.click();
    await waitForAnimations(page);
    // Fill in some example data
    await skillForm.nameInput.fill('Learn Photography');
    await skillForm.goalInput.fill('Capture beautiful landscape photos');
    await waitForAnimations(page);
    await saveScreenshot(page, 'help-skills-hub-basic-info');
    // Close the modal
    await page.keyboard.press('Escape');
  });

  test('help-skills-hub-ai-planning: AI Planning interface', async ({
    page,
    skillsHub,
    skillForm,
  }) => {
    await skillsHub.goto();
    await page.waitForLoadState('networkidle');
    await skillsHub.newSkillButton.click();
    await waitForAnimations(page);
    // Fill in step 1
    await skillForm.nameInput.fill('Learn Photography');
    await skillForm.goalInput.fill('Capture beautiful landscape photos');
    // Move to step 2 (AI Planning)
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await waitForAnimations(page);
    }
    await saveScreenshot(page, 'help-skills-hub-ai-planning');
    // Close the modal
    await page.keyboard.press('Escape');
  });

  test('help-skills-hub-card: Skill card anatomy', async ({
    page,
    skillsHub,
  }) => {
    await skillsHub.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Try to capture a skill card
    const skillCard = page
      .locator('[data-testid="skill-card"]')
      .first();
    if (await skillCard.isVisible()) {
      const box = await skillCard.boundingBox();
      if (box) {
        const padding = 20;
        await saveScreenshot(page, 'help-skills-hub-card', {
          clip: {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + padding * 2,
            height: box.height + padding * 2,
          },
        });
        return;
      }
    }
    // Fallback to full page
    await saveScreenshot(page, 'help-skills-hub-card');
  });

  // Skill Planner Section (4)
  test('help-planner-canvas: Skill Planner canvas view', async ({
    page,
    planner,
  }) => {
    const skillId = screenshotData.skills[0]?.id;
    expect(skillId).toBeDefined();
    await planner.goto(skillId!);
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    const fitButton = page.locator('[aria-label="fit view"]').first();
    if (await fitButton.isVisible()) {
      await fitButton.click();
      await waitForAnimations(page);
    }
    await saveScreenshot(page, 'help-planner-canvas');
  });

  test('help-planner-node: Sub-skill node anatomy', async ({
    page,
    planner,
  }) => {
    const skillId = screenshotData.skills[0]?.id;
    expect(skillId).toBeDefined();
    await planner.goto(skillId!);
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Fit view first to ensure nodes are positioned in viewport
    const fitButton = page.locator('[aria-label="fit view"]').first();
    if (await fitButton.isVisible()) {
      await fitButton.click();
      await waitForAnimations(page); // Wait for fit-view animation to complete
    }

    // Try to capture a single node
    const node = page
      .locator('.react-flow__node')
      .filter({ hasText: 'Grammar Fundamentals' });
    await node.waitFor({ state: 'visible', timeout: 5000 });
    const box = await node.boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      const padding = 30;
      await saveScreenshot(page, 'help-planner-node', {
        clip: {
          x: Math.max(0, box.x - padding),
          y: Math.max(0, box.y - padding),
          width: box.width + padding * 2,
          height: box.height + padding * 2,
        },
      });
      return;
    }
    // Fallback to full page
    await saveScreenshot(page, 'help-planner-node');
  });

  test('help-planner-edit-panel: Sub-skill edit panel', async ({
    page,
    planner,
  }) => {
    const skillId = screenshotData.skills[0]?.id;
    expect(skillId).toBeDefined();
    await planner.goto(skillId!);
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Click on a node to open edit panel
    const node = page
      .locator('.react-flow__node')
      .filter({ hasText: 'Grammar Fundamentals' });
    if (await node.isVisible()) {
      await node.click();
      await waitForAnimations(page);
    }
    await saveScreenshot(page, 'help-planner-edit-panel');
  });

  test('help-planner-create-modal: Create sub-skill modal', async ({
    page,
    planner,
  }) => {
    const skillId = screenshotData.skills[0]?.id;
    expect(skillId).toBeDefined();
    await planner.goto(skillId!);
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Open create sub-skill modal
    await planner.createSubSkillButton.click();
    await waitForAnimations(page);
    // Fill in some example data
    await planner.subSkillNameInput.fill('Advanced Conversation');
    await waitForAnimations(page);
    await saveScreenshot(page, 'help-planner-create-modal');
    // Close the modal
    await page.keyboard.press('Escape');
  });

  // Todo List Section (4)
  test('help-todo-weekly: Todo List weekly view', async ({ page, todoList }) => {
    await todoList.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    await saveScreenshot(page, 'help-todo-weekly');
  });

  test('help-todo-task-card: Task card in todo list', async ({
    page,
    todoList,
  }) => {
    await todoList.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Capture today's day card which has the most tasks (mix of completed/uncompleted)
    const todayCard = page.locator('[data-testid="todo-list-card"]').filter({
      hasText: 'Complete grammar exercises',
    });
    if (await todayCard.isVisible()) {
      const box = await todayCard.boundingBox();
      if (box) {
        const padding = 20;
        await saveScreenshot(page, 'help-todo-task-card', {
          clip: {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + padding * 2,
            height: box.height + padding * 2,
          },
        });
        return;
      }
    }
    // Fallback: use first card
    const firstCard = page.locator('[data-testid="todo-list-card"]').first();
    if (await firstCard.isVisible()) {
      const box = await firstCard.boundingBox();
      if (box) {
        const padding = 20;
        await saveScreenshot(page, 'help-todo-task-card', {
          clip: {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + padding * 2,
            height: box.height + padding * 2,
          },
        });
        return;
      }
    }
    // Final fallback to full page
    await saveScreenshot(page, 'help-todo-task-card');
  });

  test('help-todo-assign-panel: Assign Tasks panel', async ({
    page,
    todoList,
  }) => {
    await todoList.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Open the assign tasks sheet
    const assignButton = page.getByRole('button', { name: /assign/i });
    if (await assignButton.isVisible()) {
      await assignButton.click();
      await waitForAnimations(page);
    }
    await saveScreenshot(page, 'help-todo-assign-panel');
  });

  test('help-todo-schedule-modal: Schedule modal with recurrence', async ({
    page,
    todoList,
  }) => {
    await todoList.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Click edit button on a recurring task to show its existing daily recurrence
    const editButton = page
      .locator('[data-testid="task-edit-btn"]')
      .first();
    await editButton.scrollIntoViewIfNeeded();
    await expect(editButton).toBeVisible();
    await editButton.click();
    await waitForAnimations(page);
    await saveScreenshot(page, 'help-todo-schedule-modal');
    // Close the modal
    await page.keyboard.press('Escape');
  });

  // Tips Section (2)
  test('help-tips-recurring: Recurring task setup example', async ({
    page,
    todoList,
  }) => {
    await todoList.goto();
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);

    // Find a non-recurring task's edit button to show enabling recurrence
    // Target a task that is NOT already recurring (e.g., "Complete grammar exercises")
    const nonRecurringTask = page
      .locator('[data-testid="todo-list-card"]')
      .filter({ hasText: 'Complete grammar exercises' })
      .locator('[data-testid="task-edit-btn"]')
      .first();
    await nonRecurringTask.scrollIntoViewIfNeeded();
    await expect(nonRecurringTask).toBeVisible();
    await nonRecurringTask.click();
    await waitForAnimations(page);

    // Toggle recurring on
    const recurringToggle = page.locator('[data-testid="recurring-toggle"]');
    if (await recurringToggle.isVisible()) {
      const isChecked = await recurringToggle.isChecked();
      if (!isChecked) {
        await recurringToggle.click();
        await waitForAnimations(page);
      }
    }

    // Switch to weekly frequency to differentiate from schedule-modal (which shows daily)
    const frequencyTrigger = page.locator('[data-testid="recurrence-frequency"]');
    if (await frequencyTrigger.isVisible()) {
      await frequencyTrigger.click();
      await waitForAnimations(page);
      // Click the "weekly" option in the dropdown
      const weeklyOption = page.getByRole('option', { name: /week/i });
      if (await weeklyOption.isVisible()) {
        await weeklyOption.click();
        await waitForAnimations(page);
      }
    }

    await saveScreenshot(page, 'help-tips-recurring');
    // Close the modal
    await page.keyboard.press('Escape');
  });

  test('help-tips-celebration: Planner showing completed sub-skill', async ({
    page,
    planner,
  }) => {
    // Navigate to Spanish skill planner — Basic Vocabulary has "complete" stage
    const skillId = screenshotData.skills[0]?.id;
    expect(skillId).toBeDefined();
    await planner.goto(skillId!);
    await page.waitForLoadState('networkidle');
    await waitForAnimations(page);
    const fitButton = page.locator('[aria-label="fit view"]').first();
    if (await fitButton.isVisible()) {
      await fitButton.click();
      await waitForAnimations(page);
    }
    // Click the completed "Basic Vocabulary" node to show its green Complete state
    const completedNode = page
      .locator('.react-flow__node')
      .filter({ hasText: 'Basic Vocabulary' });
    if (await completedNode.isVisible()) {
      await completedNode.click();
      await waitForAnimations(page);
    }
    await saveScreenshot(page, 'help-tips-celebration');
  });
});
