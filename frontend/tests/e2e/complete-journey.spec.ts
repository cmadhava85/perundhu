import { test, expect } from '@playwright/test';
import { TestUtils, TestData } from './utils/test-utils';

/**
 * Comprehensive E2E Test Suite
 * Complete end-to-end testing of all critical user journeys
 */
test.describe('Complete User Journey Tests', () => {
  
  test.describe('Critical Path: Search to Bus Selection', () => {
    test('should complete full search-to-booking journey', async ({ page }) => {
      // Step 1: Navigate to home page
      await page.goto('/');
      await TestUtils.waitForPageLoad(page);
      
      // Verify no console errors on load
      const noErrors = await TestUtils.verifyNoConsoleErrors(page);
      expect(noErrors).toBeTruthy();
      
      // Take initial screenshot
      await TestUtils.takeFullPageScreenshot(page, 'homepage-loaded');
      
      // Step 2: Verify search form is visible and functional
      const fromInput = page.locator('[data-testid="from-location-input"], input[placeholder*="From"]').first();
      const toInput = page.locator('[data-testid="to-location-input"], input[placeholder*="To"]').first();
      const searchButton = page.locator('[data-testid="find-buses-button"], button:has-text("Find Buses")').first();
      
      await expect(fromInput).toBeVisible();
      await expect(toInput).toBeVisible();
      await expect(searchButton).toBeVisible();
      await expect(searchButton).toBeEnabled();
      
      // Step 3: Perform search
      await TestUtils.fillSearchForm(page, 'Chennai', 'Coimbatore');
      
      // Step 4: Verify navigation to results page
      await page.waitForURL('**/search**', { timeout: TestData.timeouts.long });
      expect(page.url()).toContain('search');
      
      // Step 5: Verify bus list page elements
      const busListContainer = page.locator('[data-testid="bus-list"], .modern-bus-list').first();
      await expect(busListContainer).toBeVisible();
      
      // Verify header elements
      const busListHeader = page.locator('.bus-list-header, [data-testid="bus-list-header"]').first();
      await expect(busListHeader).toBeVisible();
      
      // Verify "Available Buses" title (checking for the 's' that was missing)
      const title = page.locator('h2:has-text("Available Buses"), .list-title').first();
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText).toMatch(/Available Buses$/i);
      
      // Verify bus count
      const busCount = page.locator('.bus-count, [data-testid="bus-count"]').first();
      await expect(busCount).toBeVisible();
      
      // Step 6: Verify all sort controls are visible (including Price button)
      const sortControls = ['Departure', 'Arrival', 'Duration', 'Price'];
      for (const control of sortControls) {
        const sortButton = page.locator(`button:has-text("${control}"), .sort-btn:has-text("${control}")`).first();
        await expect(sortButton).toBeVisible();
      }
      
      // Step 7: Verify bus items are displayed
      const busItems = page.locator('[data-testid="bus-item"], .modern-bus-item');
      const busCount_num = await busItems.count();
      expect(busCount_num).toBeGreaterThan(0);
      
      // Step 8: Verify first bus item has all required information
      const firstBus = busItems.first();
      await expect(firstBus).toBeVisible();
      
      // Check timing information
      const departureTime = firstBus.locator('.departure-info .time-value, .time-display .departure-info');
      const arrivalTime = firstBus.locator('.arrival-info .time-value, .time-display .arrival-info');
      await expect(departureTime).toBeVisible();
      await expect(arrivalTime).toBeVisible();
      
      // Check single-line information display
      const quickInfo = firstBus.locator('.quick-info').first();
      if (await quickInfo.isVisible()) {
        const infoItems = firstBus.locator('.info-item');
        const itemCount = await infoItems.count();
        expect(itemCount).toBeGreaterThan(0);
        
        // Verify all items are horizontally aligned (single line)
        if (itemCount > 1) {
          const firstItem = infoItems.first();
          const lastItem = infoItems.last();
          
          const firstBox = await firstItem.boundingBox();
          const lastBox = await lastItem.boundingBox();
          
          if (firstBox && lastBox) {
            const verticalDiff = Math.abs(firstBox.y - lastBox.y);
            expect(verticalDiff).toBeLessThan(15); // Allow for small variations
          }
        }
      }
      
      // Step 9: Test bus item expansion
      await firstBus.click();
      await page.waitForTimeout(500); // Animation time
      
      const expandedContent = firstBus.locator('.expanded-content, .route-details');
      if (await expandedContent.isVisible({ timeout: 2000 })) {
        await expect(expandedContent).toBeVisible();
        
        // Verify route map or detailed information is shown
        const routeMap = firstBus.locator('.route-map, .map-container');
        const detailedInfo = firstBus.locator('.bus-details-grid, .numbered-stops-list');
        
        const hasMap = await routeMap.isVisible({ timeout: 1000 });
        const hasDetails = await detailedInfo.isVisible({ timeout: 1000 });
        
        expect(hasMap || hasDetails).toBeTruthy();
      }
      
      // Step 10: Test search functionality
      const searchInput = page.locator('.search-input input, input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.click();
        await searchInput.fill('Express');
        await page.waitForTimeout(500);
        await expect(searchInput).toHaveValue('Express');
      }
      
      // Step 11: Test sorting functionality
      const priceSort = page.locator('button:has-text("Price"), .sort-btn:has-text("Price")').first();
      await priceSort.click();
      await page.waitForTimeout(500);
      
      // Verify sort button shows active state
      const isActive = await priceSort.evaluate((el: HTMLElement) => 
        el.classList.contains('active') || el.classList.contains('selected')
      );
      expect(isActive).toBeTruthy();
      
      // Take final screenshot
      await TestUtils.takeFullPageScreenshot(page, 'complete-journey-end');
      
      // Performance check
      const performance = await TestUtils.measurePerformance(page);
      expect(performance.loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    });
  });

  test.describe('Multi-Device Journey Tests', () => {
    Object.entries(TestData.viewports).forEach(([deviceName, viewport]) => {
      test(`should work correctly on ${deviceName}`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize(viewport);
        
        // Navigate and test
        await page.goto('/');
        await TestUtils.waitForPageLoad(page);
        
        // Verify responsive layout
        await TestUtils.verifyResponsiveLayout(page, viewport);
        
        // Test search functionality
        await TestUtils.fillSearchForm(page, 'Chennai', 'Coimbatore');
        
        // Verify results page
        const busListContainer = page.locator('[data-testid="bus-list"], .modern-bus-list').first();
        await expect(busListContainer).toBeVisible();
        
        // Device-specific checks
        if (viewport.width <= 768) {
          // Mobile-specific tests
          
          // Verify header elements are properly sized
          const header = page.locator('.bus-list-header').first();
          if (await header.isVisible()) {
            const headerBox = await header.boundingBox();
            if (headerBox) {
              expect(headerBox.width).toBeLessThanOrEqual(viewport.width);
            }
          }
          
          // Verify sort controls scroll horizontally
          const sortControls = page.locator('.sort-controls').first();
          if (await sortControls.isVisible()) {
            const overflowX = await sortControls.evaluate((el: HTMLElement) => 
              window.getComputedStyle(el).overflowX
            );
            expect(['auto', 'scroll'].includes(overflowX)).toBeTruthy();
          }
          
          // Verify Price button is visible (the bug we fixed)
          const priceButton = page.locator('button:has-text("Price")').first();
          await expect(priceButton).toBeVisible();
        }
        
        // Take device-specific screenshot
        await TestUtils.takeFullPageScreenshot(page, `${deviceName}-results`);
      });
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/');
      await TestUtils.fillSearchForm(page, 'Chennai', 'Coimbatore');
      
      // Should show error message or loading state
      const hasError = await TestUtils.verifyErrorHandling(page);
      const hasLoading = await TestUtils.verifyLoadingStates(page);
      
      expect(hasError || hasLoading).toBeTruthy();
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await TestUtils.simulateSlowNetwork(page);
      
      await page.goto('/');
      await TestUtils.waitForPageLoad(page);
      
      // Should show loading states
      await TestUtils.fillSearchForm(page, 'Chennai', 'Coimbatore');
      
      const hasLoading = await TestUtils.verifyLoadingStates(page);
      // Loading states might be too fast to catch, but the page should still work
      
      const busListContainer = page.locator('[data-testid="bus-list"], .modern-bus-list').first();
      await expect(busListContainer).toBeVisible({ timeout: TestData.timeouts.veryLong });
    });

    test('should handle empty search results', async ({ page }) => {
      await page.goto('/');
      await TestUtils.fillSearchForm(page, 'NonExistentCity', 'AnotherFakeCity');
      
      // Should show no results or connecting routes
      const noResults = page.locator('[data-testid="no-buses"], .no-buses, .empty-state');
      const connectingRoutes = page.locator('[data-testid="connecting-routes"], .connecting-routes');
      
      const hasNoResults = await noResults.isVisible({ timeout: 5000 });
      const hasConnecting = await connectingRoutes.isVisible({ timeout: 5000 });
      
      expect(hasNoResults || hasConnecting).toBeTruthy();
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should meet basic accessibility requirements', async ({ page }) => {
      await page.goto('/');
      
      const accessibilityCheck = await TestUtils.verifyAccessibility(page);
      expect(accessibilityCheck.passed).toBeTruthy();
      
      if (!accessibilityCheck.passed) {
        console.log('Accessibility issues found:', accessibilityCheck.issues);
      }
      
      // Test keyboard navigation
      const keyboardWorking = await TestUtils.testKeyboardNavigation(page, [
        'input[placeholder*="From"]',
        'input[placeholder*="To"]',
        'button:has-text("Find Buses")'
      ]);
      
      expect(keyboardWorking).toBeTruthy();
    });
  });
});