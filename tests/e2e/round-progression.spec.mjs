import { test, expect } from "@playwright/test";

test("finishing round 1 advances to round 2 with 2 bugs", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();
  await expect(page.locator(".bug")).toHaveCount(1);

  // force:true bypasses stability check from bug-bob CSS animation.
  await page.locator(".bug").click({ force: true });

  // After ~1.5s celebration, round 2 loads.
  await expect(page.locator(".bug")).toHaveCount(2, { timeout: 4000 });
  await expect(page.locator("#stage")).toHaveAttribute("data-round", "2");
});
