import { test, expect } from "@playwright/test";

const ROUND_TRANSITION_TIMEOUT_MS = 15000;

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
    await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n), {
      timeout: ROUND_TRANSITION_TIMEOUT_MS
    });
    await expect(page.locator(".animal")).toHaveCount(n);

    await clearRound(page);

    if (n < 10) {
      await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n + 1), {
        timeout: ROUND_TRANSITION_TIMEOUT_MS
      });
    }
  }

  await expect(page.locator(".finale")).toBeVisible({ timeout: ROUND_TRANSITION_TIMEOUT_MS });
  await expect(page.locator(".finale-title")).toHaveText("1 2 3 4 5 6 7 8 9 10");
  await expect(page.locator(".bubble-confetti i")).toHaveCount(36);
});
