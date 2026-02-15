import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await setupClerkTestingToken({ page });

  // Load the app so Clerk JS initializes
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Use Clerk's programmatic sign-in (sets session via testing token)
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_EMAIL!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Wait for Clerk to process the sign-in client-side
  await page.waitForTimeout(2000);

  // Now navigate to the app — the session should be active
  await page.goto('/app/dashboard');

  // The server-side auth check may redirect back to / if session isn't ready
  // Wait and retry if needed
  await page.waitForTimeout(2000);

  const url = page.url();
  if (!url.includes('/app/')) {
    // Retry navigation — Clerk session may need a moment to sync
    await page.goto('/app/dashboard');
    await page.waitForTimeout(3000);
  }

  // Verify we're in the app
  await expect(page).toHaveURL(/\/app\//, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
