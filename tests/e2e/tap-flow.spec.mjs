import { test, expect } from "@playwright/test";

test("round 1 counts the turtle and fills the first ribbon bubble", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();

  await expect(page.locator("#stage")).toBeVisible();
  await expect(page.locator("#stage")).toHaveAttribute("data-round", "1");
  await expect(page.locator("#stage")).toHaveAttribute("data-animal", "turtle");
  await expect(page.locator(".animal")).toHaveCount(1);
  await expect(page.locator(".count-bubble")).toHaveCount(1);

  await page.locator(".animal").click({ force: true });

  await expect(page.locator(".numeral.n-1")).toHaveCount(1);
  await expect(page.locator(".animal.counted")).toHaveCount(1);
  await expect(page.locator(".animal")).toHaveCount(1);
  await expect(page.locator(".count-bubble.filled")).toHaveCount(1);
});
