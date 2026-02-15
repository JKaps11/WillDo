import type { Locator, Page } from '@playwright/test';

export class PlannerPom {
  readonly page: Page;
  readonly createSubSkillButton: Locator;
  readonly subSkillNameInput: Locator;
  readonly subSkillSubmitButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createSubSkillButton = page.locator('[data-testid="create-subskill-btn"]');
    this.subSkillNameInput = page.getByPlaceholder('Enter sub-skill name');
    this.subSkillSubmitButton = page.getByRole('button', {
      name: /Create Sub-skill|Creating/,
    });
    this.backButton = page.getByRole('link', { name: 'Back' });
  }

  async goto(skillId: string): Promise<void> {
    await this.page.goto(`/app/skills/${skillId}/planner`);
    await this.page.waitForLoadState('networkidle');
  }

  async createSubSkill(opts: { name: string }): Promise<void> {
    await this.createSubSkillButton.click();
    await this.subSkillNameInput.fill(opts.name);
    await this.subSkillSubmitButton.click();
  }

  nodeByName(name: string): Locator {
    return this.page.locator('.react-flow__node').filter({ hasText: name });
  }

  async selectNode(name: string): Promise<void> {
    await this.nodeByName(name).click();
  }

  async deleteSelectedSubSkill(): Promise<void> {
    await this.page.getByRole('button', { name: 'Delete' }).click();
    // Confirm dialog if present
    const confirmBtn = this.page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
}
