import { test, expect } from '../fixtures/base.fixture';

test.describe('Dashboard', () => {
  test('all sections render', async ({ dashboard }) => {
    await dashboard.goto();

    await expect(dashboard.todaysTasks).toBeVisible();
    await expect(dashboard.skillsOverview).toBeVisible();
    await expect(dashboard.completionChart).toBeVisible();
    await expect(dashboard.metricsTotals).toBeVisible();
  });

  test('chart period selector switches between week/month/year', async ({
    dashboard,
  }) => {
    await dashboard.goto();

    // Default should be week
    const weekTab = dashboard.chartPeriodSelector.getByRole('tab', {
      name: 'Week',
    });
    await expect(weekTab).toHaveAttribute('aria-selected', 'true');

    // Switch to month
    await dashboard.selectChartPeriod('month');
    const monthTab = dashboard.chartPeriodSelector.getByRole('tab', {
      name: 'Month',
    });
    await expect(monthTab).toHaveAttribute('aria-selected', 'true');

    // Switch to year
    await dashboard.selectChartPeriod('year');
    const yearTab = dashboard.chartPeriodSelector.getByRole('tab', {
      name: 'Year',
    });
    await expect(yearTab).toHaveAttribute('aria-selected', 'true');
  });

  test('tasks section shows tasks or empty state', async ({ dashboard }) => {
    await dashboard.goto();

    const tasksCard = dashboard.todaysTasks;
    await expect(tasksCard).toBeVisible();

    // Should have either task cards or an empty state message
    const hasContent = await tasksCard
      .locator('.space-y-2')
      .isVisible()
      .catch(() => false);
    const hasEmpty = await tasksCard
      .getByText(/No tasks/)
      .isVisible()
      .catch(() => false);

    expect(hasContent || hasEmpty).toBe(true);
  });
});
