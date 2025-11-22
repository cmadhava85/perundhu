import { test, expect } from '@playwright/test';

test.describe('Simple E2E Tests', () => {
  
  test('page loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/Perundhu/i);
  });

  test('search inputs are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    
    await expect(fromInput).toBeVisible({ timeout: 10000 });
    await expect(toInput).toBeVisible({ timeout: 10000 });
  });

  test('can type in search inputs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await fromInput.fill('Chennai');
    await expect(fromInput).toHaveValue('Chennai');
  });

  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await expect(fromInput).toBeVisible();
  });
});
