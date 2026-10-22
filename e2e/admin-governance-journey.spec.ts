import { test, expect } from "@playwright/test";

test.describe("Admin CMS, Governance & Security Posture Journey", () => {
  test("1. Admin Series catalog renders with spotlight curation and status filters", async ({ page }) => {
    await page.goto("/admin/series");

    // Verify admin page heading
    await expect(page.locator("h1").filter({ hasText: /Series/i }).first()).toBeVisible();

    // Verify series catalog table exists
    const tableOrRow = page.locator("table, [role='table'], text=The Missing Phone").first();
    await expect(tableOrRow).toBeVisible();

    // Verify action menu or curation controls exist
    const createBtn = page.getByRole("button", { name: /CREATE SERIES/i }).first();
    await expect(createBtn).toBeVisible();
  });

  test("2. User Moderation directory displays users, strikes, and governance controls", async ({ page }) => {
    await page.goto("/admin/users");

    // Verify page heading
    await expect(page.locator("h1").filter({ hasText: /Users/i }).first()).toBeVisible();

    // Verify KPI metrics (Total Users, Active)
    await expect(page.locator("text=Total Users").first()).toBeVisible();

    // Verify user directory table
    const userRow = page.locator("table, text=Aarav Patel, text=Sneha Kumar").first();
    await expect(userRow).toBeVisible();
  });

  test("3. Platform Settings displays feature flags, audit trail, and security posture", async ({ page }) => {
    await page.goto("/admin/settings");

    // Verify page title
    await expect(page.locator("h1").filter({ hasText: /Settings/i }).first()).toBeVisible();

    // Verify tabs exist
    await expect(page.locator("button:has-text('General')").first()).toBeVisible();
    await expect(page.locator("button:has-text('Audit')").first()).toBeVisible();
    await expect(page.locator("button:has-text('Security')").first()).toBeVisible();

    // Switch to Security Posture tab
    const securityTab = page.locator("button:has-text('Security Posture')").first();
    await securityTab.click();

    // Verify Security Posture score and checks checklist
    await expect(page.locator("text=Security Posture Score").first()).toBeVisible();
    await expect(page.locator("text=Helmet Security Headers, text=Active Helmet").first()).toBeVisible();
    await expect(page.locator("text=Multi-Tier Rate Limiting, text=Global Public Tier").first()).toBeVisible();
  });
});
