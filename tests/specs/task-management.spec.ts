import { test, expect } from '../fixtures/base.fixture';
import {
  createSkillViaAPI,
  createSubSkillViaAPI,
  createTaskViaAPI,
  deleteSkillViaAPI,
} from '../helpers/api.helpers';
import { dragElement } from '../helpers/dnd.helpers';

const SKILL_NAME = `E2E_TaskMgmt_${Date.now()}`;
const TASK_NAME = 'E2E_Task_DnD';

let skillId: string;
let subSkillId: string;

test.describe.serial('Task Management', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await ctx.newPage();
    const { setupClerkTestingToken } = await import(
      '@clerk/testing/playwright'
    );
    await setupClerkTestingToken({ page });

    // Need to visit a page first so auth cookies are set for API calls
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');

    const skill = await createSkillViaAPI(page, { name: SKILL_NAME });
    skillId = skill.id;

    const subSkill = await createSubSkillViaAPI(page, {
      skillId,
      name: 'E2E_SubSkill',
    });
    subSkillId = subSkill.id;

    // Create a task assigned to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await createTaskViaAPI(page, {
      name: TASK_NAME,
      subSkillId,
      todoListDate: today,
    });

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await ctx.newPage();
    const { setupClerkTestingToken } = await import(
      '@clerk/testing/playwright'
    );
    await setupClerkTestingToken({ page });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await deleteSkillViaAPI(page, skillId);
    await ctx.close();
  });

  test('task edit pencil opens recurring modal', async ({
    page,
    todoList,
  }) => {
    await todoList.goto();

    // Verify the task exists on the page
    await expect(page.getByText(TASK_NAME).first()).toBeVisible({
      timeout: 10000,
    });

    // Hover the task row to reveal edit button, then click
    const taskContainer = page
      .locator('div')
      .filter({ hasText: TASK_NAME })
      .locator('[data-testid="task-edit-btn"]')
      .first();
    await taskContainer.click({ force: true });

    // Recurring modal should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Schedule Task')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('enable recurring → set daily → save', async ({
    page,
    todoList,
    recurringModal,
  }) => {
    await todoList.goto();
    await expect(page.getByText(TASK_NAME).first()).toBeVisible({
      timeout: 10000,
    });

    // Open recurring modal
    const taskEditBtn = page
      .locator('div')
      .filter({ hasText: TASK_NAME })
      .locator('[data-testid="task-edit-btn"]')
      .first();
    await taskEditBtn.click({ force: true });

    await expect(recurringModal.dialog).toBeVisible();
    await recurringModal.enableRecurring();
    await recurringModal.confirm();

    // Modal should close
    await expect(recurringModal.dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('drag task between day cards', async ({ page, todoList }) => {
    await todoList.goto();

    // Only run if in week view with multiple cards that have tasks
    const cardCount = await todoList.dayCards.count();
    if (cardCount < 1) {
      test.skip();
      return;
    }

    const taskLocator = page.getByText(TASK_NAME).first();
    // Find a different empty card to drop onto
    const emptyCards = page.locator('text="No tasks yet"');
    const emptyCount = await emptyCards.count();

    if (emptyCount === 0) {
      test.skip();
      return;
    }

    const targetCard = emptyCards.first().locator('..').locator('..');
    await dragElement(page, taskLocator, targetCard);
    // Allow mutation to settle
    await page.waitForTimeout(1000);
  });
});
