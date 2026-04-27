import { test, expect } from '@playwright/test';

/**
 * Core search interaction tests.
 */
test.describe('Search Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads with Perundhu title', async ({ page }) => {
    await expect(page).toHaveTitle(/Perundhu/i);
  });

  test('from and to inputs are visible', async ({ page }) => {
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    await expect(fromInput).toBeVisible({ timeout: 10000 });
    await expect(toInput).toBeVisible({ timeout: 10000 });
  });

  test('user can type in from input', async ({ page }) => {
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await fromInput.fill('Chennai');
    await expect(fromInput).toHaveValue('Chennai');
  });

  test('user can type in to input', async ({ page }) => {
    const toInput = page.locator('input[placeholder*="destination"]').first();
    await toInput.fill('Coimbatore');
    await expect(toInput).toHaveValue('Coimbatore');
  });

  test('from input can be cleared', async ({ page }) => {
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await fromInput.fill('Chennai');
    await fromInput.clear();
    await expect(fromInput).toHaveValue('');
  });

  test('mobile viewport: inputs are visible and usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await expect(fromInput).toBeVisible();
    await fromInput.fill('Madurai');
    await expect(fromInput).toHaveValue('Madurai');
  });
});
