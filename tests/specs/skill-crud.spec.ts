import { test, expect } from '../fixtures/base.fixture';
import { deleteSkillViaAPI } from '../helpers/api.helpers';

const SKILL_NAME = `E2E_Skill_${Date.now()}`;
let createdSkillId: string | undefined;

test.describe.serial('Skill CRUD', () => {
  test.afterAll(async ({ browser }) => {
    if (!createdSkillId) return;
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
      await deleteSkillViaAPI(page, createdSkillId);
    } catch {
      // Skill may already be deleted by the last test
    }
    await ctx.close();
  });

  test('create skill via form → lands on planner', async ({
    page,
    skillsHub,
    skillForm,
  }) => {
    await skillsHub.goto();
    await expect(skillsHub.newSkillButton).toBeVisible({ timeout: 10000 });
    await skillsHub.newSkillButton.click();
    await expect(page).toHaveURL(/\/skills\/new/, { timeout: 10000 });

    await skillForm.fillBasicInfo({ name: SKILL_NAME, goal: 'E2E test goal' });
    await skillForm.goToAIStep();
    await skillForm.createSkill();

    // Should redirect to planner
    await expect(page).toHaveURL(/\/planner/, { timeout: 15000 });
    await expect(page.getByText(SKILL_NAME).first()).toBeVisible();

    // Capture skill ID from URL for targeted cleanup
    const match = page.url().match(/\/skills\/([^/]+)\/planner/);
    if (match) createdSkillId = match[1];
  });

  test('edit skill name via popover → name updates', async ({
    page,
    skillsHub,
  }) => {
    await skillsHub.goto();

    await skillsHub.editSkill(SKILL_NAME);

    const nameInput = page.getByLabel('Skill Name *');
    await expect(nameInput).toBeVisible();

    // Change name then save
    const updatedName = `${SKILL_NAME}_edited`;
    await nameInput.clear();
    await nameInput.fill(updatedName);
    await page.getByRole('button', { name: /Save Changes|Saving/ }).click();

    // Verify name updated
    await expect(skillsHub.cardByName(updatedName)).toBeVisible({
      timeout: 5000,
    });

    // Revert name for subsequent tests
    await skillsHub.editSkill(updatedName);
    const revertInput = page.getByLabel('Skill Name *');
    await revertInput.clear();
    await revertInput.fill(SKILL_NAME);
    await page.getByRole('button', { name: /Save Changes|Saving/ }).click();
    await expect(skillsHub.cardByName(SKILL_NAME)).toBeVisible({
      timeout: 5000,
    });
  });

  test('archive skill → disappears from list', async ({ skillsHub }) => {
    await skillsHub.goto();
    const initialNames = await skillsHub.getSkillNames();
    expect(initialNames).toContain(SKILL_NAME);

    await skillsHub.archiveSkill(SKILL_NAME);

    // Should no longer be in the default (non-archived) list
    await expect(skillsHub.cardByName(SKILL_NAME)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('unarchive skill → reappears', async ({ page, skillsHub }) => {
    await skillsHub.goto();

    // Toggle archived view on
    await skillsHub.showArchivedButton.click();
    await expect(skillsHub.cardByName(SKILL_NAME)).toBeVisible({
      timeout: 5000,
    });

    // Unarchive
    await skillsHub.openCardMenu(SKILL_NAME);
    // The archive button becomes "Unarchive" when viewing archived skills
    await page
      .getByRole('button', { name: /Unarchive|Archive/ })
      .click();

    // Toggle archived view off
    await skillsHub.showArchivedButton.click();
    await expect(skillsHub.cardByName(SKILL_NAME)).toBeVisible({
      timeout: 5000,
    });
  });

  test('delete skill with confirm → removed', async ({
    page,
    skillsHub,
  }) => {
    await skillsHub.goto();
    await skillsHub.deleteSkill(SKILL_NAME);

    // Confirm deletion dialog
    const confirmBtn = page.getByRole('button', { name: /Delete Skill|Deleting/ });
    await confirmBtn.click();

    await expect(skillsHub.cardByName(SKILL_NAME)).not.toBeVisible({
      timeout: 5000,
    });
  });
});
