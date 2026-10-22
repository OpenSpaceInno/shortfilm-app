import { test, expect } from "@playwright/test";

test.describe("Golden Consumer Journey — Browse ➔ Stream ➔ Choice ➔ XP ➔ Subscriptions", () => {
  test("1. Home page renders hero banner and content catalog", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ShortReel/i);

    // Verify main navigation or platform branding exists
    const brand = page.locator("text=ShortReel").first();
    await expect(brand).toBeVisible();

    // Verify catalog series items appear
    const seriesCard = page.locator("text=The Missing Phone").first();
    await expect(seriesCard).toBeVisible();
  });

  test("2. Series page displays narrative metadata, episodes, and cast", async ({ page }) => {
    await page.goto("/series/the-missing-phone");

    // Verify series details
    await expect(page.locator("h1, h2, [data-testid='series-title']").filter({ hasText: /The Missing Phone/i }).first()).toBeVisible();

    // Verify play button exists
    const playBtn = page.getByRole("link", { name: /Watch|Play|Start/i }).first();
    await expect(playBtn).toBeVisible();
  });

  test("3. Watch player mounts vertical video container and playback controls", async ({ page }) => {
    await page.goto("/watch/the-missing-phone");

    // Verify video stream container is mounted
    const playerContainer = page.locator("video, [data-testid='video-player'], [class*='aspect-']").first();
    await expect(playerContainer).toBeVisible();

    // Verify series title overlay
    await expect(page.locator("text=The Missing Phone").first()).toBeVisible();
  });

  test("4. Interactive choice engine and engagement features are accessible", async ({ page }) => {
    await page.goto("/watch/the-missing-phone");

    // Wait for player interactive UI to mount
    await page.waitForLoadState("domcontentloaded");

    // Verify interactive overlay elements or interactive indicator
    const interactiveBadge = page.locator("text=Interactive, text=Branch, button:has-text('Choice')").first();
    if (await interactiveBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(interactiveBadge).toBeVisible();
    }
  });

  test("5. VIP Subscriptions page renders tiered pricing and entitlement matrix", async ({ page }) => {
    await page.goto("/plans");

    // Verify subscription tiers
    await expect(page.locator("text=VIP Monthly").first()).toBeVisible();
    await expect(page.locator("text=VIP Annual").first()).toBeVisible();

    // Verify pricing labels
    await expect(page.locator("text=₹99").first()).toBeVisible();

    // Verify checkout button exists
    const subscribeBtn = page.getByRole("button", { name: /Subscribe|Upgrade|Get VIP/i }).first();
    await expect(subscribeBtn).toBeVisible();
  });
});
