import type { Locator, Page } from '@playwright/test';

export class SettingsPom {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/app/settings');
    await this.page.waitForLoadState('networkidle');
  }

  tabButton(tab: 'appearance' | 'todo-list'): Locator {
    return this.page.locator(`[data-testid="settings-tab-${tab}"]`);
  }

  async switchTab(tab: 'appearance' | 'todo-list'): Promise<void> {
    await this.tabButton(tab).click();
    await this.page.waitForLoadState('networkidle');
  }

  // Appearance tab - ToggleGroupItems are buttons with aria-pressed
  themeToggle(mode: 'light' | 'dark' | 'system'): Locator {
    return this.page.getByRole('button', { name: new RegExp(mode, 'i') });
  }

  async setTheme(mode: 'light' | 'dark' | 'system'): Promise<void> {
    await this.themeToggle(mode).click();
  }

  // Todo list tab
  timeSpanToggle(span: 'day' | 'week'): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`^${span}$`, 'i'),
    });
  }

  async setTimeSpan(span: 'day' | 'week'): Promise<void> {
    await this.timeSpanToggle(span).click();
  }

  get showCompletedSwitch(): Locator {
    return this.page.locator('#show-completed');
  }

  async toggleShowCompleted(): Promise<void> {
    await this.showCompletedSwitch.click();
  }

  get sortBySelect(): Locator {
    return this.page.getByRole('combobox');
  }

  async setSortBy(value: string): Promise<void> {
    await this.sortBySelect.click();
    await this.page.getByRole('option', { name: value }).click();
  }
}
