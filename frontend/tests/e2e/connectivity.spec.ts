import { test, expect } from '@playwright/test';

test.describe('Application Connectivity', () => {
  
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page title
    await expect(page).toHaveTitle(/Perundhu/i);
    
    // Verify page is responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display search inputs on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    
    await expect(fromInput).toBeVisible({ timeout: 10000 });
    await expect(toInput).toBeVisible({ timeout: 10000 });
  });

  test('should allow user interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    
    // Test typing
    await fromInput.fill('Test Location');
    await expect(fromInput).toHaveValue('Test Location');
    
    // Test clearing
    await fromInput.clear();
    await expect(fromInput).toHaveValue('');
  });

  test('should not have critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Filter out non-critical errors (favicon, 404s, etc.)
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('net::ERR')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
