import type { Locator, Page } from '@playwright/test';

export class DashboardPom {
  readonly page: Page;
  readonly todaysTasks: Locator;
  readonly activeSkill: Locator;
  readonly completionChart: Locator;
  readonly metricsTotals: Locator;
  readonly chartPeriodSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.todaysTasks = page.locator('[data-testid="todays-tasks"]');
    this.activeSkill = page.locator('[data-testid="active-skill"]');
    this.completionChart = page.locator('[data-testid="completion-chart"]');
    this.metricsTotals = page.locator('[data-testid="metrics-totals"]');
    this.chartPeriodSelector = page.locator(
      '[data-testid="chart-period-selector"]',
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/app/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async isSectionVisible(
    name: 'todaysTasks' | 'activeSkill' | 'completionChart' | 'metricsTotals',
  ): Promise<boolean> {
    return this[name].isVisible();
  }

  async selectChartPeriod(period: 'week' | 'month' | 'year'): Promise<void> {
    const label = period.charAt(0).toUpperCase() + period.slice(1);
    await this.chartPeriodSelector
      .getByRole('tab', { name: label })
      .click();
  }
}
