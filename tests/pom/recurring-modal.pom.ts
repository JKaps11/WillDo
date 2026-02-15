import type { Locator, Page } from '@playwright/test';

export class RecurringModalPom {
  readonly page: Page;
  readonly dialog: Locator;
  readonly recurringToggle: Locator;
  readonly frequencySelect: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.recurringToggle = page.locator('[data-testid="recurring-toggle"]');
    this.frequencySelect = page.locator('[data-testid="recurrence-frequency"]');
    this.confirmButton = this.dialog.getByRole('button', {
      name: /Save|Schedule Recurring/,
    });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async isOpen(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  async enableRecurring(): Promise<void> {
    await this.recurringToggle.click();
  }

  async setFrequency(freq: 'daily' | 'weekly'): Promise<void> {
    await this.frequencySelect.click();
    const label = freq === 'daily' ? /day/ : /week/;
    await this.page.getByRole('option', { name: label }).click();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
