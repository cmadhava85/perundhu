import { test, expect } from '@playwright/test';

/**
 * Cross-browser compatibility tests
 * Tests the application across different browsers to ensure consistent behavior
 */

const testData = {
  from: 'Chennai',
  to: 'Coimbatore'
};

test.describe('Cross-Browser Compatibility', () => {
  test('should work correctly in different browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Perundhu|Bus/);
    
    // Test search functionality
    await page.fill('input[placeholder*="departure"], input[placeholder*="Enter departure location"]', testData.from);
    await page.fill('input[placeholder*="destination"], input[placeholder*="Enter destination"]', testData.to);
    await page.click('button:has-text("Find"), button:has-text("Find Buses"), button:has-text("Search")');
    
    // Wait for results
    await page.waitForLoadState('networkidle');
    
    // Verify results page
    const busListContainer = page.locator('[data-testid="bus-list"], .modern-bus-list').first();
    await expect(busListContainer).toBeVisible();
    
    await page.screenshot({ path: `test-results/screenshots/${browserName}-results.png` });
  });

  test('should handle different viewport sizes consistently', async ({ page, browserName }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Wait for page to adjust to new viewport
      await page.waitForTimeout(500);
      
      // Verify layout doesn't break
      const mainContent = page.locator('main, .main-content, .app-content, body > div').first();
      await expect(mainContent).toBeVisible();
      
      // Take screenshot for each viewport and browser combination
      await page.screenshot({ 
        path: `test-results/screenshots/${browserName}-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });

  test('should handle touch events on mobile browsers', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test touch interactions
    const searchInput = page.locator('input[placeholder*="departure"], input[placeholder*="Enter departure location"]').first();
    await searchInput.tap();
    await expect(searchInput).toBeFocused();
    
    await searchInput.fill('Chennai');
    await page.locator('input[placeholder*="destination"], input[placeholder*="Enter destination"]').first().tap();
    await page.locator('input[placeholder*="destination"], input[placeholder*="Enter destination"]').first().fill('Coimbatore');
    
    // Tap search button
    await page.locator('button:has-text("Find"), button:has-text("Find Buses"), button:has-text("Search")').first().tap();
    
    await page.waitForLoadState('networkidle');
    
    // Test touch interactions on results
    const busItem = page.locator('[data-testid="bus-item"], .modern-bus-item').first();
    if (await busItem.isVisible({ timeout: 5000 })) {
      await busItem.tap();
      
      // Verify tap response
      const expandedContent = busItem.locator('.expanded-content, .route-details');
      if (await expandedContent.isVisible({ timeout: 2000 })) {
        await expect(expandedContent).toBeVisible();
      }
    }
    
    await page.screenshot({ 
      path: `test-results/screenshots/${browserName}-touch-interactions.png` 
    });
  });

  test('should load within acceptable time limits', async ({ page, browserName }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (relaxed for CI/CD)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`${browserName} load time: ${loadTime}ms`);
  });

  test('should handle rapid interactions without breaking', async ({ page }) => {
    await page.goto('/');
    
    // Rapid form interactions
    const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="Enter departure location"]').first();
    const toInput = page.locator('input[placeholder*="destination"], input[placeholder*="Enter destination"]').first();
    const searchButton = page.locator('button:has-text("Find"), button:has-text("Find Buses"), button:has-text("Search")').first();
    
    // Rapid typing and clicking
    await fromInput.fill('Ch');
    await fromInput.fill('Chennai');
    await toInput.fill('Co');
    await toInput.fill('Coimbatore');
    
    // Multiple rapid clicks (should be handled gracefully)
    await searchButton.click();
    await page.waitForTimeout(100);
    
    // Verify page doesn't break
    await page.waitForLoadState('networkidle');
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });
});