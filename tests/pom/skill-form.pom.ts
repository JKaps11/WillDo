import type { Locator, Page } from '@playwright/test';

export class SkillFormPom {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly goalInput: Locator;
  readonly nextButton: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByPlaceholder('e.g., Learn Spanish, Master Guitar');
    this.goalInput = page.getByPlaceholder('What do you want to achieve?');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.createButton = page.getByRole('button', { name: /Create Skill|Creating/ }).first();
  }

  async fillBasicInfo(opts: { name: string; goal?: string }): Promise<void> {
    await this.nameInput.fill(opts.name);
    if (opts.goal) {
      await this.goalInput.fill(opts.goal);
    }
  }

  async goToAIStep(): Promise<void> {
    await this.nextButton.click();
  }

  async createSkill(): Promise<void> {
    await this.createButton.click();
  }
}
