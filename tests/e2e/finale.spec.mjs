import { test, expect } from "@playwright/test";

async function clearRound(page) {
  let safety = 50;
  while ((await page.locator(".animal:not(.counted)").count()) > 0 && safety-- > 0) {
    await page.locator(".animal:not(.counted)").first().click({ force: true });
  }
}

test("playing through all 10 rounds reveals the numbered bubble finale", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("/");
  await page.locator("#start-screen").click();

  for (let n = 1; n <= 10; n++) {
    await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n), { timeout: 6000 });
    await expect(page.locator(".animal")).toHaveCount(n);

    await clearRound(page);

    if (n < 10) {
      await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n + 1), { timeout: 6000 });
    }
  }

  await expect(page.locator(".finale")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".finale-title")).toHaveText("1 2 3 4 5 6 7 8 9 10");
  await expect(page.locator(".bubble-confetti i")).toHaveCount(36);
});
