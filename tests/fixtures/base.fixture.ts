import { test as base } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

import { SidebarPom } from '../pom/sidebar.pom';
import { SkillsHubPom } from '../pom/skills-hub.pom';
import { SkillFormPom } from '../pom/skill-form.pom';
import { PlannerPom } from '../pom/planner.pom';
import { TodoListPom } from '../pom/todo-list.pom';
import { RecurringModalPom } from '../pom/recurring-modal.pom';
import { SettingsPom } from '../pom/settings.pom';
import { DashboardPom } from '../pom/dashboard.pom';

interface PomFixtures {
  sidebar: SidebarPom;
  skillsHub: SkillsHubPom;
  skillForm: SkillFormPom;
  planner: PlannerPom;
  todoList: TodoListPom;
  recurringModal: RecurringModalPom;
  settings: SettingsPom;
  dashboard: DashboardPom;
}

export const test = base.extend<PomFixtures>({
  page: async ({ page }, use) => {
    await setupClerkTestingToken({ page });
    await use(page);
  },
  sidebar: async ({ page }, use) => {
    await use(new SidebarPom(page));
  },
  skillsHub: async ({ page }, use) => {
    await use(new SkillsHubPom(page));
  },
  skillForm: async ({ page }, use) => {
    await use(new SkillFormPom(page));
  },
  planner: async ({ page }, use) => {
    await use(new PlannerPom(page));
  },
  todoList: async ({ page }, use) => {
    await use(new TodoListPom(page));
  },
  recurringModal: async ({ page }, use) => {
    await use(new RecurringModalPom(page));
  },
  settings: async ({ page }, use) => {
    await use(new SettingsPom(page));
  },
  dashboard: async ({ page }, use) => {
    await use(new DashboardPom(page));
  },
});

export { expect } from '@playwright/test';
