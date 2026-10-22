import { defineConfig, devices } from "@playwright/test";

/**
 * ShortReel Playwright E2E Configuration
 * Tests cover the Golden Consumer Journey (Browse ➔ Stream ➔ Choice ➔ XP),
 * Creator Studio submission, and Super Admin governance.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari (iPhone 14 - 9:16 Portrait)",
      use: { ...devices["iPhone 14"] },
    },
  ],

  webServer: {
    command: "npm run preview",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
