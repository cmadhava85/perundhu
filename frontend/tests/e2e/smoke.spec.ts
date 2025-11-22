import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title contains our app name
    await expect(page).toHaveTitle(/Perundhu/i);
    
    // Verify search inputs are present (actual elements that exist)
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();
    
    console.log('✅ Homepage loaded successfully');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check if search inputs are visible on mobile
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await expect(fromInput).toBeVisible();
    
    console.log('✅ Mobile responsiveness verified');
  });

  test('should work across different browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Basic functionality should work in all browsers
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await expect(fromInput).toBeVisible();
    
    console.log(`✅ Working correctly in ${browserName}`);
  });
});