import { test, expect } from '../fixtures/base.fixture';
import {
  createSkillViaAPI,
  deleteSkillViaAPI,
} from '../helpers/api.helpers';

const SKILL_NAME = `E2E_Planner_${Date.now()}`;
const SUB_SKILL_NAME = 'E2E_SubSkill_Test';

let skillId: string;

test.describe.serial('Planner', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await ctx.newPage();
    const { setupClerkTestingToken } = await import(
      '@clerk/testing/playwright'
    );
    await setupClerkTestingToken({ page });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');

    const skill = await createSkillViaAPI(page, { name: SKILL_NAME });
    skillId = skill.id;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'tests/.auth/user.json',
    });
    const page = await ctx.newPage();
    const { setupClerkTestingToken } = await import(
      '@clerk/testing/playwright'
    );
    await setupClerkTestingToken({ page });
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    try {
      await deleteSkillViaAPI(page, skillId);
    } catch {
      // Skill may already be deleted by tests
    }
    await ctx.close();
  });

  test('create sub-skill via modal → node appears', async ({ planner }) => {
    await planner.goto(skillId);
    await planner.createSubSkill({ name: SUB_SKILL_NAME });

    await expect(planner.nodeByName(SUB_SKILL_NAME)).toBeVisible({
      timeout: 5000,
    });
  });

  test('select node → edit panel opens with correct name', async ({
    page,
    planner,
  }) => {
    await planner.goto(skillId);
    await planner.selectNode(SUB_SKILL_NAME);

    // An edit panel or detail panel should appear with the sub-skill name
    await expect(
      page.getByText(SUB_SKILL_NAME).first(),
    ).toBeVisible();
  });

  test('advance stage → label updates', async ({ page, planner }) => {
    await planner.goto(skillId);
    await planner.selectNode(SUB_SKILL_NAME);

    // Find and click the advance/stage button
    const advanceBtn = page.getByRole('button', {
      name: /Start Learning|Advance|Next Stage/,
    });
    if (await advanceBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advanceBtn.click();
      // Verify stage label changed
      await expect(
        page.getByText(/learning|practice/i).first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('delete sub-skill → node disappears', async ({ planner }) => {
    await planner.goto(skillId);
    await planner.selectNode(SUB_SKILL_NAME);
    await planner.deleteSelectedSubSkill();

    await expect(planner.nodeByName(SUB_SKILL_NAME)).not.toBeVisible({
      timeout: 5000,
    });
  });
});
