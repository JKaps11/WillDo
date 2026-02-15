import type { Locator, Page } from '@playwright/test';

/**
 * Simulate drag-and-drop for @dnd-kit by moving the pointer
 * in intermediate steps so the library registers the gesture.
 */
export async function dragElement(
  page: Page,
  source: Locator,
  target: Locator,
): Promise<void> {
  const srcBox = await source.boundingBox();
  const tgtBox = await target.boundingBox();

  if (!srcBox || !tgtBox) {
    throw new Error('Could not get bounding boxes for drag source/target');
  }

  const srcCenter = {
    x: srcBox.x + srcBox.width / 2,
    y: srcBox.y + srcBox.height / 2,
  };
  const tgtCenter = {
    x: tgtBox.x + tgtBox.width / 2,
    y: tgtBox.y + tgtBox.height / 2,
  };

  // Move to source, press, then move in steps to target
  await page.mouse.move(srcCenter.x, srcCenter.y);
  await page.mouse.down();

  // Intermediate steps so dnd-kit registers the drag
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps;
    await page.mouse.move(
      srcCenter.x + (tgtCenter.x - srcCenter.x) * ratio,
      srcCenter.y + (tgtCenter.y - srcCenter.y) * ratio,
    );
    await page.waitForTimeout(50);
  }

  await page.mouse.up();
}
