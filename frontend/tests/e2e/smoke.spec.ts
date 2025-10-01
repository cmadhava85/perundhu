import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title contains our app name
    await expect(page).toHaveTitle(/Perundhu/i);
    
    // Verify basic elements are present
    const searchForm = page.locator('form');
    await expect(searchForm).toBeVisible();
    
    console.log('✅ Homepage loaded successfully');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check if mobile layout is working
    const searchForm = page.locator('form');
    await expect(searchForm).toBeVisible();
    
    console.log('✅ Mobile responsiveness verified');
  });

  test('should work across different browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Basic functionality should work in all browsers
    const searchForm = page.locator('form');
    await expect(searchForm).toBeVisible();
    
    console.log(`✅ Working correctly in ${browserName}`);
  });
});