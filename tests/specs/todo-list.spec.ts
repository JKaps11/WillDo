import { test, expect } from '../fixtures/base.fixture';

test.describe('Todo List', () => {
  test('page loads with header and date info', async ({ todoList }) => {
    await todoList.goto();

    // Should show either "This Week" or "Today" heading
    const header = todoList.page.getByText(/This Week|Today/);
    await expect(header.first()).toBeVisible();
  });

  test('shows day cards or empty state', async ({ todoList }) => {
    await todoList.goto();

    // In week view there should be 7 day cards (with or without tasks)
    // In day view there should be at least 1 card
    // Check for any card content — either task cards or "No tasks yet" text
    const hasTaskCards = (await todoList.dayCards.count()) > 0;
    const hasEmptyText = await todoList.page
      .getByText('No tasks yet')
      .first()
      .isVisible()
      .catch(() => false);
    const hasDayView = await todoList.page
      .getByText('Start by creating')
      .isVisible()
      .catch(() => false);

    expect(hasTaskCards || hasEmptyText || hasDayView).toBe(true);
  });

  test('complete task via checkbox → line-through applied', async ({
    todoList,
  }) => {
    await todoList.goto();

    const taskNames = await todoList.getTaskNames();
    if (taskNames.length === 0) {
      test.skip();
      return;
    }

    const targetTask = taskNames[0];

    // Verify the task is still on the page before interacting
    const taskVisible = await todoList.page
      .getByText(targetTask)
      .first()
      .isVisible()
      .catch(() => false);
    if (!taskVisible) {
      test.skip();
      return;
    }

    await todoList.completeTask(targetTask);

    // Verify line-through class is applied
    const taskText = todoList.page
      .locator('.line-through')
      .filter({ hasText: targetTask })
      .first();
    await expect(taskText).toBeVisible({ timeout: 5000 });

    // Uncomplete to restore state
    await todoList.uncompleteTask(targetTask);
  });

  test('uncomplete task → line-through removed', async ({ todoList }) => {
    await todoList.goto();

    const taskNames = await todoList.getTaskNames();
    if (taskNames.length === 0) {
      test.skip();
      return;
    }

    const targetTask = taskNames[0];

    // Complete first
    await todoList.completeTask(targetTask);
    // Wait for mutation to settle and UI to update
    await todoList.page.waitForTimeout(1000);
    await todoList.page.waitForLoadState('networkidle');

    // Then uncomplete
    await todoList.uncompleteTask(targetTask);
    // Wait for mutation to settle
    await todoList.page.waitForTimeout(1000);
    await todoList.page.waitForLoadState('networkidle');

    // Reload to get clean state and verify line-through is removed
    await todoList.goto();
    const taskText = todoList.page
      .locator('[data-testid="todo-list-card"] .truncate')
      .filter({ hasText: targetTask })
      .first();
    await expect(taskText).not.toHaveClass(/line-through/, {
      timeout: 5000,
    });
  });
});
