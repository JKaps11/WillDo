import type { Locator, Page } from '@playwright/test';

export class SidebarPom {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly sidebarWrapper: Locator;
  readonly toggleButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[data-sidebar="sidebar"]');
    this.sidebarWrapper = page.locator('[data-slot="sidebar"]');
    this.toggleButton = page.locator('[data-sidebar="trigger"]');
  }

  navLink(name: string): Locator {
    return this.sidebar.getByRole('link', { name });
  }

  async navigateTo(name: string): Promise<void> {
    await this.navLink(name).click();
  }

  async toggle(): Promise<void> {
    await this.toggleButton.click();
  }
}
