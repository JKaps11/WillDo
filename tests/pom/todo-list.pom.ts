import type { Locator, Page } from '@playwright/test';

export class TodoListPom {
  readonly page: Page;
  readonly dayCards: Locator;
  readonly taskCountBadges: Locator;
  readonly allCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dayCards = page.locator('[data-testid="todo-list-card"]');
    this.taskCountBadges = page.locator('[data-testid="task-count-badge"]');
    // All cards including empty ones (the grid items)
    this.allCards = page.locator('.grid > div');
  }

  async goto(): Promise<void> {
    await this.page.goto('/app/todolist');
    await this.page.waitForLoadState('networkidle');
  }

  taskByName(name: string): Locator {
    return this.page.locator(`text="${name}"`).first();
  }

  async completeTask(name: string): Promise<void> {
    // Find the task row containing the name, then click its checkbox
    const taskRow = this.page
      .locator('[data-testid="task-checkbox"]')
      .locator('..')
      .locator('..')
      .filter({ hasText: name })
      .locator('[data-testid="task-checkbox"]')
      .first();
    await taskRow.click();
  }

  async uncompleteTask(name: string): Promise<void> {
    await this.completeTask(name); // same action toggles
  }

  async getTaskNames(): Promise<Array<string>> {
    // Only get task name spans inside card content areas
    const tasks = this.dayCards.locator('.truncate');
    const count = await tasks.count();
    const seen = new Set<string>();
    const names: Array<string> = [];
    for (let i = 0; i < count; i++) {
      const text = await tasks.nth(i).textContent();
      if (text && !seen.has(text.trim())) {
        seen.add(text.trim());
        names.push(text.trim());
      }
    }
    return names;
  }

  async getTaskBoundingBox(
    name: string,
  ): Promise<{ x: number; y: number; width: number; height: number } | null> {
    const task = this.taskByName(name);
    return task.boundingBox();
  }

  async getDayCardBoundingBox(
    dayText: string,
  ): Promise<{ x: number; y: number; width: number; height: number } | null> {
    const card = this.dayCards.filter({ hasText: dayText });
    return card.boundingBox();
  }
}
