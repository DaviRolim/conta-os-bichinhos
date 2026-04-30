import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.spec.mjs"],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 60000
  },
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 14 landscape"] }
    }
  ]
});
