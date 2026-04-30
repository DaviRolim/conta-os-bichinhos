import { test, expect } from "@playwright/test";

// Helper: advance from current round to next by tapping all bugs in DOM order.
async function clearRound(page) {
  // Refetch each loop because the bug list changes after each tap.
  let safety = 50;
  while ((await page.locator(".bug:not(.popped)").count()) > 0 && safety-- > 0) {
    const next = page.locator(".bug:not(.popped)").first();
    await next.click({ force: true });
  }
}

test("playing through all 10 rounds reveals the finale overlay", async ({ page }) => {
  test.setTimeout(120000); // 10 rounds × ~2s each + animations

  await page.goto("/");
  await page.locator("#start-screen").click();

  for (let n = 1; n <= 10; n++) {
    await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n), { timeout: 6000 });
    await expect(page.locator(".bug")).toHaveCount(n);
    await clearRound(page);
    if (n < 10) {
      // Wait for the next round's bugs to render.
      await expect(page.locator(".bug")).toHaveCount(n + 1, { timeout: 6000 });
    }
  }

  await expect(page.locator(".finale")).toBeVisible();
  await expect(page.locator(".finale .squad img")).toHaveCount(5);
});
