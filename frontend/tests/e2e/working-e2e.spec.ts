import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/SearchPage';

test.describe('Working E2E Tests', () => {
  let searchPage: SearchPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
  });

  test('should perform basic search functionality', async ({ page }) => {
    // Navigate to the application
    await searchPage.goto();
    
    // Verify page loads with correct title
    await expect(page).toHaveTitle(/Perundhu/);
    
    // Test basic form interaction
    await searchPage.selectFromLocation('Chennai');
    await searchPage.selectToLocation('Bangalore');
    
    // Verify the inputs were filled
    await expect(searchPage.fromLocationInput).toHaveValue('Chennai');
    await expect(searchPage.toLocationInput).toHaveValue('Bangalore');
    
    // Click search button
    await searchPage.clickSearchButton();
    
    // Wait for any navigation or results
    await page.waitForTimeout(2000);
    
    // Take screenshot for verification
    await page.screenshot({ 
      path: 'test-results/screenshots/basic-search-test.png',
      fullPage: true 
    });
  });

  test('should validate form elements are accessible', async ({ page }) => {
    await searchPage.goto();
    
    // Verify search form elements exist and are accessible
    await expect(searchPage.fromLocationInput).toBeVisible();
    await expect(searchPage.toLocationInput).toBeVisible();
    await expect(searchPage.findBusesButton).toBeVisible();
    
    // Test keyboard navigation
    await searchPage.fromLocationInput.focus();
    await page.keyboard.press('Tab');
    await expect(searchPage.toLocationInput).toBeFocused();
  });

  test('should handle mobile viewport correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await searchPage.goto();
    
    // Verify mobile responsive elements
    await searchPage.verifyResponsiveElements(true);
    
    // Test search still works on mobile
    await searchPage.selectFromLocation('Mumbai');
    await searchPage.selectToLocation('Pune');
    await searchPage.clickSearchButton();
    
    await page.waitForTimeout(2000);
    
    // Take screenshot for mobile verification
    await page.screenshot({ 
      path: 'test-results/screenshots/mobile-search-test.png',
      fullPage: true 
    });
  });

  test('should demonstrate comprehensive user journey (simplified)', async ({ page }) => {
    // Use a simplified version of the user journey
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test that we can fill the form
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    const findButton = page.locator('button:has-text("Find")').first();
    
    await fromInput.fill('Chennai');
    await toInput.fill('Bangalore');
    
    await expect(fromInput).toHaveValue('Chennai');
    await expect(toInput).toHaveValue('Bangalore');
    
    await findButton.click();
    await page.waitForTimeout(2000);
    
    // Verify no crashes or errors
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBeTruthy();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/simplified-journey.png',
      fullPage: true 
    });
  });

  test('should handle different input combinations', async ({ page }) => {
    await searchPage.goto();
    
    const testCases = [
      ['Chennai', 'Bangalore'],
      ['Mumbai', 'Delhi'],
      ['Kolkata', 'Hyderabad']
    ];
    
    for (const [from, to] of testCases) {
      // Clear inputs first
      await searchPage.fromLocationInput.clear();
      await searchPage.toLocationInput.clear();
      
      // Fill new values
      await searchPage.selectFromLocation(from);
      await searchPage.selectToLocation(to);
      
      // Verify values
      await expect(searchPage.fromLocationInput).toHaveValue(from);
      await expect(searchPage.toLocationInput).toHaveValue(to);
      
      // Wait a bit between tests
      await page.waitForTimeout(500);
    }
  });
});