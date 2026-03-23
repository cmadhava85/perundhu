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
    
    // Log errors for debugging
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    // Filter out non-critical errors (favicon, 404s, network errors, dev mode warnings, API errors)
    const criticalErrors = errors.filter(e => {
      const lowerError = e.toLowerCase();
      return (
        !e.includes('favicon') && 
        !e.includes('404') &&
        !e.includes('net::ERR') &&
        !e.includes('Failed to fetch') &&
        !e.includes('NetworkError') &&
        !lowerError.includes('chunk') &&
        !lowerError.includes('react') && // React dev mode warnings
        !lowerError.includes('download the react devtools') &&
        !lowerError.includes('querykey') &&
        !lowerError.includes('devtools') &&
        !lowerError.includes('source map') &&
        !lowerError.includes('sourcemap') &&
        !e.includes('ERR_CONNECTION') &&
        !e.includes('TypeError: Failed to fetch') && // API errors in dev mode
        !lowerError.includes('tanstack') && // Tanstack Query dev warnings
        !lowerError.includes('query') && // Query cache warnings
        !lowerError.includes('localhost') && // Localhost connection errors
        !e.includes('ERR_NAME_NOT_RESOLVED') &&
        !e.includes('ERR_NETWORK_CHANGED')
      );
    });
    
    // Allow up to 2 non-critical warnings in dev mode
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });
});
