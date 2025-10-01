import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/SearchPage';
import { BusListPage } from './pages/BusListPage';

/**
 * Mobile-specific E2E Tests
 * Tests that verify mobile functionality and responsive design
 */
test.describe('Mobile Responsive Tests', () => {
  test.describe('Mobile Portrait', () => {
    test.use({ 
      viewport: { width: 375, height: 667 } // iPhone SE size
    });

    test('should display mobile search page correctly', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      
      // Verify mobile-specific elements
      await searchPage.verifyResponsiveElements(true);
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/mobile-search-page.png',
        fullPage: true 
      });
    });

    test('should show single-line bus information on mobile', async ({ page }) => {
      const searchPage = new SearchPage(page);
      const busListPage = new BusListPage(page);
      
      await searchPage.goto();
      await searchPage.searchBuses('Chennai', 'Coimbatore');
      
      // Wait for results
      await page.waitForLoadState('networkidle');
      
      // Verify mobile bus list elements
      await busListPage.verifyMobileBusListElements();
      
      // Specifically verify the fixes we made:
      // 1. "Available Buses" should show the 's'
      const title = page.locator('h2:has-text("Available Buses"), .list-title').first();
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText).toMatch(/Available Buses$/); // Should end with 's'
      
      // 2. Image should be fully displayed (not cut off)
      const busIcons = page.locator('.bus-icon');
      if (await busIcons.first().isVisible()) {
        const iconBox = await busIcons.first().boundingBox();
        expect(iconBox?.width).toBeGreaterThan(0);
        expect(iconBox?.height).toBeGreaterThan(0);
      }
      
      // 3. Price sorting button should be visible
      const priceButton = page.locator('button:has-text("Price"), .sort-btn:has-text("Price")').first();
      await expect(priceButton).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/mobile-bus-list.png',
        fullPage: true 
      });
    });

    test('should handle horizontal scrolling for sort controls', async ({ page }) => {
      const searchPage = new SearchPage(page);
      const busListPage = new BusListPage(page);
      
      await searchPage.goto();
      await searchPage.searchBuses('Chennai', 'Coimbatore');
      await page.waitForLoadState('networkidle');
      
      // Test horizontal scrolling of sort controls
      const sortControls = busListPage.sortControls;
      await expect(sortControls).toBeVisible();
      
      // All sort buttons should be present but may require scrolling
      const allSortButtons = ['Departure', 'Arrival', 'Duration', 'Price'];
      for (const buttonText of allSortButtons) {
        const button = page.locator(`button:has-text("${buttonText}"), .sort-btn:has-text("${buttonText}")`).first();
        
        // Button might not be immediately visible due to horizontal scroll
        if (!(await button.isVisible())) {
          // Scroll horizontally to find the button
          await sortControls.scrollIntoViewIfNeeded();
          await page.mouse.wheel(100, 0); // Scroll right
        }
        
        // Now the button should be accessible
        expect(await button.isVisible() || await button.isInViewport()).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Landscape', () => {
    test.use({ 
      viewport: { width: 667, height: 375 } // iPhone SE landscape
    });

    test('should adapt to landscape mode', async ({ page }) => {
      const searchPage = new SearchPage(page);
      const busListPage = new BusListPage(page);
      
      await searchPage.goto();
      await searchPage.searchBuses('Chennai', 'Coimbatore');
      await page.waitForLoadState('networkidle');
      
      // Verify elements are still visible in landscape
      await busListPage.verifyBusListPageElements();
      
      // Take landscape screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/mobile-landscape-bus-list.png',
        fullPage: true 
      });
    });
  });

  test.describe('Tablet', () => {
    test.use({ 
      viewport: { width: 768, height: 1024 } // iPad size
    });

    test('should display tablet layout correctly', async ({ page }) => {
      const searchPage = new SearchPage(page);
      const busListPage = new BusListPage(page);
      
      await searchPage.goto();
      await searchPage.verifyResponsiveElements(false); // Not mobile
      
      await searchPage.searchBuses('Chennai', 'Coimbatore');
      await page.waitForLoadState('networkidle');
      
      await busListPage.verifyBusListPageElements();
      
      // Take tablet screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/tablet-bus-list.png',
        fullPage: true 
      });
    });
  });
});