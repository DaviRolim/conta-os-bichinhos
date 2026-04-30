import { test, expect } from "@playwright/test";

test("round 1: tap the only bug, see numeral, bug disappears", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();
  await expect(page.locator("#stage")).toBeVisible();
  await expect(page.locator(".bug")).toHaveCount(1);

  // Tap the bug. force:true bypasses stability check from bug-bob CSS animation.
  await page.locator(".bug").click({ force: true });

  // Numeral 1 floats up.
  await expect(page.locator(".numeral.n-1")).toHaveCount(1);

  // Bug eventually disappears.
  await expect(page.locator(".bug")).toHaveCount(0, { timeout: 2000 });
});
