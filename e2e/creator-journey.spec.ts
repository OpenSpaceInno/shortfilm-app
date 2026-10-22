import { test, expect } from "@playwright/test";

test.describe("Creator Platform & Generative AI Studio Journey", () => {
  test("1. Creator Studio Dashboard renders performance KPIs and story catalog", async ({ page }) => {
    await page.goto("/creator/studio");

    // Verify creator dashboard title
    await expect(page.locator("h1, h2").filter({ hasText: /Creator Studio|Stories|My Studio/i }).first()).toBeVisible();

    // Verify story cards or studio metrics are visible
    const metricOrCard = page.locator("text=Views, text=Stories, text=Followers, text=Earnings").first();
    await expect(metricOrCard).toBeVisible();
  });

  test("2. Generative AI Studio mounts creative generators and prompt inputs", async ({ page }) => {
    await page.goto("/creator/ai-studio");

    // Verify AI Studio title
    await expect(page.locator("h1, h2").filter({ hasText: /AI Studio|Generative AI/i }).first()).toBeVisible();

    // Verify creative generator tabs exist
    await expect(page.locator("text=Concept Expander").first()).toBeVisible();
    await expect(page.locator("text=Character Forge").first()).toBeVisible();
    await expect(page.locator("text=Branch Dilemma").first()).toBeVisible();

    // Verify interactive prompt textarea exists
    const promptInput = page.locator("textarea, input[type='text']").first();
    await expect(promptInput).toBeVisible();

    // Verify Generate Action button exists
    const generateBtn = page.getByRole("button", { name: /Generate|Expand|Forge/i }).first();
    await expect(generateBtn).toBeVisible();
  });
});
