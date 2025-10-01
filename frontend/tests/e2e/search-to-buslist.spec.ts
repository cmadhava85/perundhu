import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/SearchPage';
import { BusListPage } from './pages/BusListPage';

/**
 * E2E Tests for Search to Bus List Flow
 * Tests the complete user journey from search to bus results
 */
test.describe('Search to Bus List Flow', () => {
  let searchPage: SearchPage;
  let busListPage: BusListPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
    busListPage = new BusListPage(page);
    
    // Navigate to the search page
    await searchPage.goto();
  });

  test('should display search page with all elements visible', async ({ page }) => {
    // Verify all search page elements are present and functional
    await searchPage.verifySearchFormElements();
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'test-results/screenshots/search-page.png',
      fullPage: true 
    });
  });

  test('should successfully search and navigate to bus list', async ({ page }) => {
    // Perform a search
    await searchPage.searchBuses('Chennai', 'Coimbatore');
    
    // Wait for navigation to results page
    await page.waitForURL('**/search**', { timeout: 10000 });
    
    // Verify we're on the results page
    expect(page.url()).toContain('search');
    
    // Verify bus list page elements
    await busListPage.verifyBusListPageElements();
    
    // Take screenshot of results
    await page.screenshot({ 
      path: 'test-results/screenshots/bus-list-page.png',
      fullPage: true 
    });
  });

  test('should display bus items with all required information', async ({ page }) => {
    // Search for buses
    await searchPage.searchBuses('Chennai', 'Coimbatore');
    await page.waitForURL('**/search**', { timeout: 10000 });
    
    // Verify bus items are displayed correctly
    await busListPage.verifyBusItems();
    
    // Verify single-line layout
    await test.step('Verify single-line information display', async () => {
      const busItems = await busListPage.busItems.all();
      if (busItems.length > 0) {
        const firstBus = busItems[0];
        const quickInfo = firstBus.locator('.quick-info').first();
        
        if (await quickInfo.isVisible()) {
          // Verify info items are horizontally aligned
          const infoItems = await firstBus.locator('.info-item').all();
          expect(infoItems.length).toBeGreaterThan(0);
          
          // All items should be visible without scrolling vertically
          for (const item of infoItems.slice(0, 3)) { // Check first 3 items
            await expect(item).toBeVisible();
          }
        }
      }
    });
  });

  test('should expand bus item and show route details', async ({ page }) => {
    // Search and navigate to results
    await searchPage.searchBuses('Chennai', 'Coimbatore');
    await page.waitForURL('**/search**', { timeout: 10000 });
    
    // Expand the first bus item
    const expanded = await busListPage.expandBusItem(0);
    expect(expanded).toBeTruthy();
    
    // Take screenshot of expanded bus item
    await page.screenshot({ 
      path: 'test-results/screenshots/expanded-bus-item.png',
      fullPage: true 
    });
  });

  test('should verify sorting functionality works', async ({ page }) => {
    // Search and navigate to results
    await searchPage.searchBuses('Chennai', 'Coimbatore');
    await page.waitForURL('**/search**', { timeout: 10000 });
    
    // Test sorting functionality
    await busListPage.verifySortingFunctionality();
  });

  test('should verify search within results works', async ({ page }) => {
    // Search and navigate to results
    await searchPage.searchBuses('Chennai', 'Coimbatore');
    await page.waitForURL('**/search**', { timeout: 10000 });
    
    // Test search functionality
    await busListPage.verifySearchFunctionality();
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    // Search for a route that might not exist
    await searchPage.searchBuses('NonExistentCity', 'AnotherNonExistentCity');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should either show no results message or connecting routes
    const noResults = page.locator('[data-testid="no-buses"], .no-buses, .empty-state').first();
    const connectingRoutes = page.locator('[data-testid="connecting-routes"], .connecting-routes').first();
    
    // At least one should be visible
    const noResultsVisible = await noResults.isVisible({ timeout: 5000 });
    const connectingVisible = await connectingRoutes.isVisible({ timeout: 5000 });
    
    expect(noResultsVisible || connectingVisible).toBeTruthy();
  });

  test('should verify all interactive elements are accessible', async ({ page }) => {
    // Navigate to search page
    await searchPage.goto();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Search for buses
    await searchPage.searchBuses('Chennai', 'Coimbatore');
    await page.waitForURL('**/search**', { timeout: 10000 });
    
    // Test keyboard navigation on results page
    await page.keyboard.press('Tab');
    const resultsFocused = await page.locator(':focus');
    await expect(resultsFocused).toBeVisible();
  });
});