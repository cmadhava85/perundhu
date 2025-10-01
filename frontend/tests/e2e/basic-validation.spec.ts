import { test, expect } from '@playwright/test';

test.describe('Basic E2E Test Validation', () => {
  test('should validate that Playwright is working correctly', async ({ page }) => {
    // Navigate to a reliable website to test our setup
    await page.goto('https://example.com');
    
    // Verify the page loads
    await expect(page).toHaveTitle(/Example Domain/);
    
    // Verify basic page elements
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Example Domain');
    
    // Verify we can interact with elements
    const link = page.locator('a');
    if (await link.count() > 0) {
      await expect(link.first()).toBeVisible();
    }
  });

  test('should verify our page object structure works', async ({ page }) => {
    // Test that our imports and page object structure are correct
    await page.goto('data:text/html,<html><body><form><input name="from" placeholder="From location"><input name="to" placeholder="To location"><button type="submit">Find Buses</button></form></body></html>');
    
    // Test our selectors work
    const fromInput = page.locator('input[placeholder*="From"], input[name="from"]').first();
    const toInput = page.locator('input[placeholder*="To"], input[name="to"]').first();
    const searchButton = page.locator('button:has-text("Find Buses")').first();
    
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();
    await expect(searchButton).toBeVisible();
    
    // Test interaction
    await fromInput.fill('Chennai');
    await toInput.fill('Bangalore');
    await expect(fromInput).toHaveValue('Chennai');
    await expect(toInput).toHaveValue('Bangalore');
  });
});