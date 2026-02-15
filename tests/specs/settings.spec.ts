import { test, expect } from '../fixtures/base.fixture';

test.describe('Settings', () => {
  test('appearance tab: theme toggles work', async ({ page, settings }) => {
    await settings.goto();
    await settings.switchTab('appearance');

    // Theme buttons are ToggleGroupItems with aria-label
    const lightBtn = page.getByLabel('Light mode');
    const darkBtn = page.getByLabel('Dark mode');

    await expect(lightBtn).toBeVisible();
    await expect(darkBtn).toBeVisible();

    // Toggle to dark
    await darkBtn.click();
    await page.waitForTimeout(500);

    // Toggle back to light
    await lightBtn.click();
    await page.waitForTimeout(500);
  });

  test('todo list tab: time span toggle persists', async ({
    page,
    settings,
  }) => {
    await settings.goto();
    await settings.switchTab('todo-list');

    // ToggleGroupItems have aria-label like "Day view", "Week view"
    const dayBtn = page.getByLabel('Day view');
    const weekBtn = page.getByLabel('Week view');
    await expect(dayBtn).toBeVisible();
    await expect(weekBtn).toBeVisible();

    // Toggle to week
    await weekBtn.click();
    await page.waitForTimeout(500);

    // Reload and verify persistence
    await settings.goto();
    await settings.switchTab('todo-list');
    await expect(weekBtn).toHaveAttribute('aria-pressed', 'true');

    // Restore to day
    await dayBtn.click();
  });

  test('todo list tab: show completed toggle persists', async ({
    page,
    settings,
  }) => {
    await settings.goto();
    await settings.switchTab('todo-list');

    // Base UI Switch puts id on hidden input, not the button.
    // Target the button[data-slot="switch"] that is a sibling/near the hidden input#show-completed
    const toggle = page.locator(
      '[data-slot="switch"]',
    ).first();
    await expect(toggle).toBeVisible();

    // Get initial state via data-checked attribute
    const wasChecked = await toggle
      .getAttribute('data-checked')
      .then((v) => v !== null);

    // Toggle
    await toggle.click();
    await page.waitForTimeout(500);

    // Reload and check
    await settings.goto();
    await settings.switchTab('todo-list');
    const reloadedToggle = page.locator(
      '[data-slot="switch"]',
    ).first();
    const isChecked = await reloadedToggle
      .getAttribute('data-checked')
      .then((v) => v !== null);
    expect(isChecked).toBe(!wasChecked);

    // Restore
    await reloadedToggle.click();
  });

  test('todo list tab: sort by changes persist', async ({
    page,
    settings,
  }) => {
    await settings.goto();
    await settings.switchTab('todo-list');

    const selectTrigger = page.getByRole('combobox');
    await expect(selectTrigger).toBeVisible();

    // Change to Alphabetical
    await selectTrigger.click();
    await page.getByRole('option', { name: /alphabetical/i }).click();
    await page.waitForTimeout(500);

    // Reload and verify
    await settings.goto();
    await settings.switchTab('todo-list');
    await expect(selectTrigger).toContainText(/alphabetical/i);

    // Restore to Priority (the default)
    await selectTrigger.click();
    await page.getByRole('option', { name: /priority/i }).click();
  });
});
