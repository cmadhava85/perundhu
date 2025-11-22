import { test, expect } from '@playwright/test';

test.describe('Working E2E Tests', () => {

  test('should load the page and show search inputs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads with correct title
    await expect(page).toHaveTitle(/Perundhu/);
    
    // Verify inputs are visible
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();
  });

  test('should allow typing in search inputs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    
    // Type in the inputs
    await fromInput.fill('Chennai');
    await toInput.fill('Bangalore');
    
    // Verify the values
    await expect(fromInput).toHaveValue('Chennai');
    await expect(toInput).toHaveValue('Bangalore');
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile responsive elements
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await expect(fromInput).toBeVisible();
    
    // Test typing still works on mobile
    await fromInput.fill('Mumbai');
    await expect(fromInput).toHaveValue('Mumbai');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    
    // Test keyboard navigation
    await fromInput.focus();
    await page.keyboard.press('Tab');
    await expect(toInput).toBeFocused();
  });

  test('should display page without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});