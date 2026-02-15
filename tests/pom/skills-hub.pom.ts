import type { Locator, Page } from '@playwright/test';

export class SkillsHubPom {
  readonly page: Page;
  readonly cards: Locator;
  readonly emptyStateCta: Locator;
  readonly newSkillButton: Locator;
  readonly showArchivedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cards = page.locator('[data-testid="skill-card"]');
    this.emptyStateCta = page.locator('[data-testid="create-first-skill"]');
    this.newSkillButton = page.locator('a', { hasText: 'New Skill' });
    this.showArchivedButton = page.getByRole('button', {
      name: /Show Archived|Showing Archived/,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/app/skills');
    await this.page.waitForURL(/\/app\/skills\/?$/);
    await this.page.waitForLoadState('networkidle');
  }

  cardByName(name: string): Locator {
    return this.cards.filter({ hasText: name });
  }

  async openCardMenu(name: string): Promise<void> {
    const card = this.cardByName(name);
    // Hover to reveal the menu button
    await card.hover();
    await card.locator('[data-testid="skill-card-menu"]').click();
  }

  async editSkill(name: string): Promise<void> {
    await this.openCardMenu(name);
    await this.page.getByRole('button', { name: 'Edit' }).click();
  }

  async archiveSkill(name: string): Promise<void> {
    await this.openCardMenu(name);
    await this.page.getByRole('button', { name: 'Archive' }).click();
  }

  async deleteSkill(name: string): Promise<void> {
    await this.openCardMenu(name);
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  async getSkillNames(): Promise<Array<string>> {
    const count = await this.cards.count();
    const names: Array<string> = [];
    for (let i = 0; i < count; i++) {
      const card = this.cards.nth(i);
      const link = card.locator('a[href*="/planner"]').first();
      const text = await link.textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }
}
