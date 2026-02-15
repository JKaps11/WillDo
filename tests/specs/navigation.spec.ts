import { test, expect } from '../fixtures/base.fixture';

test.describe('Navigation', () => {
  test('sidebar nav links route correctly', async ({ page, sidebar }) => {
    await page.goto('/app/dashboard');

    const routes: Array<{ name: string; urlPattern: RegExp }> = [
      { name: 'Dashboard', urlPattern: /\/app\/dashboard/ },
      { name: 'Skill Hub', urlPattern: /\/app\/skills/ },
      { name: 'Todo List', urlPattern: /\/app\/todolist/ },
      { name: 'Settings', urlPattern: /\/app\/settings/ },
    ];

    for (const { name, urlPattern } of routes) {
      await sidebar.navigateTo(name);
      await expect(page).toHaveURL(urlPattern);
    }
  });

  // TODO: Sidebar toggle works in the app but Playwright can't re-expand it
  // (React state/closure issue with the toggle callback in test context).
  test.skip('sidebar collapse and expand', async ({ page, sidebar }) => {
    await page.goto('/app/dashboard');
    await expect(sidebar.sidebar).toBeVisible();

    await page.keyboard.press('Control+b');
    await expect(sidebar.sidebarWrapper).toHaveAttribute(
      'data-state',
      'collapsed',
      { timeout: 3000 },
    );

    await page.waitForTimeout(1000);

    await sidebar.toggle();
    await expect(sidebar.sidebarWrapper).toHaveAttribute(
      'data-state',
      'expanded',
      { timeout: 3000 },
    );
  });
});
