import { test, expect } from "@playwright/test";

test("round transition sounds wait until final number feedback is clear", async ({ page }) => {
  await page.addInitScript(() => {
    window.__audioPlays = [];

    window.Audio = class MockAudio extends EventTarget {
      constructor(src) {
        super();
        this.src = src;
        this.preload = "";
      }

      play() {
        window.__audioPlays.push({ src: this.src, time: performance.now() });
        this.dispatchEvent(new Event("playing"));
        return Promise.resolve();
      }
    };
  });

  await page.goto("/");
  await page.locator("#start-screen").click();
  await page.locator(".animal").click({ force: true });
  await page.waitForTimeout(500);

  const plays = await page.evaluate(() => window.__audioPlays);

  expect(plays.some((play) => play.src.endsWith("assets/voice/one.mp3"))).toBe(true);
  expect(plays.some((play) => play.src.endsWith("assets/voice/amazing.mp3"))).toBe(false);
  expect(plays.some((play) => play.src.endsWith("assets/sounds/drain-swoosh.wav"))).toBe(false);

  await expect
    .poll(async () =>
      page.evaluate(() =>
        window.__audioPlays.some((play) => play.src.endsWith("assets/voice/amazing.mp3"))
      )
    )
    .toBe(true);

  const transitionPlays = await page.evaluate(() => window.__audioPlays);
  expect(transitionPlays.some((play) => play.src.endsWith("assets/sounds/drain-swoosh.wav"))).toBe(false);
});
