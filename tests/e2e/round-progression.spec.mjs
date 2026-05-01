import { test, expect } from "@playwright/test";

test("finishing round 1 advances to dolphin round with an empty ribbon", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();

  await expect(page.locator(".animal")).toHaveCount(1);

  await page.locator(".animal:not(.counted)").first().click({ force: true });

  await expect(page.locator("#stage")).toHaveAttribute("data-round", "2", { timeout: 6000 });
  await expect(page.locator("#stage")).toHaveAttribute("data-animal", "dolphin");
  await expect(page.locator(".animal")).toHaveCount(2);
  await expect(page.locator(".count-bubble")).toHaveCount(2);
  await expect(page.locator(".count-bubble.filled")).toHaveCount(0);
});
