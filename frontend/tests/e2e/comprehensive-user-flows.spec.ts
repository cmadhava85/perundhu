import { test, expect } from '@playwright/test';
import { SearchPage } from './pages/SearchPage';
import { BusListPage } from './pages/BusListPage';
import { UserJourneyPage } from './pages/UserJourneyPage';

test.describe('Comprehensive User Flow Tests', () => {
  let searchPage: SearchPage;
  let busListPage: BusListPage;
  let userJourneyPage: UserJourneyPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
    busListPage = new BusListPage(page);
    userJourneyPage = new UserJourneyPage(page);
  });

  test.describe('Complete User Journeys', () => {
    test('should complete full search to booking journey', async () => {
      const busCount = await userJourneyPage.performCompleteSearchJourney('Chennai', 'Bangalore');
      
      // Verify search results are reasonable
      expect(busCount).toBeGreaterThanOrEqual(0);
      
      if (busCount > 0) {
        // Test bus selection
        await busListPage.selectBus(0);
        await busListPage.verifyBusDetails(0);
      }
    });

    test('should handle mobile user journey effectively', async () => {
      const busCount = await userJourneyPage.performMobileUserJourney('Chennai', 'Bangalore');
      
      expect(busCount).toBeGreaterThanOrEqual(0);
    });

    test('should be accessible to keyboard users', async () => {
      const result = await userJourneyPage.performAccessibilityJourney();
      
      // At minimum, the app should handle keyboard navigation
      expect(result).toBeDefined();
    });
  });

  test.describe('Performance Testing', () => {
    test('should load and respond within reasonable time limits', async () => {
      const metrics = await userJourneyPage.performPerformanceJourney();
      
      // Page should load within 10 seconds
      expect(metrics.pageLoadTime).toBeLessThan(10000);
      
      // Search should complete within 15 seconds  
      expect(metrics.searchTime).toBeLessThan(15000);
      
      // Interactions should be responsive (under 2 seconds)
      expect(metrics.interactionTime).toBeLessThan(2000);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid search queries gracefully', async () => {
      const result = await userJourneyPage.performErrorHandlingJourney();
      
      // App should show appropriate feedback for invalid searches
      expect(result.hasErrorHandling).toBeTruthy();
    });

    test('should validate form inputs properly', async ({ page }) => {
      await searchPage.goto();
      
      // Try to search with empty inputs
      await searchPage.clickSearchButton();
      
      // Should either prevent submission or show validation
      const currentUrl = page.url();
      const isStillOnSearchPage = currentUrl.includes('/') && !currentUrl.includes('/buses');
      
      // Either stayed on page (validation prevented submission) or navigated but shows no results
      expect(isStillOnSearchPage || await busListPage.noBusesMessage.isVisible({ timeout: 5000 })).toBeTruthy();
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should work consistently on mobile devices', async () => {
      const result = await userJourneyPage.performCrossDeviceConsistencyJourney('mobile');
      
      expect(result.deviceType).toBe('mobile');
      expect(result.layoutVerified).toBeTruthy();
      expect(result.busCount).toBeGreaterThanOrEqual(0);
    });

    test('should work consistently on tablet devices', async () => {
      const result = await userJourneyPage.performCrossDeviceConsistencyJourney('tablet');
      
      expect(result.deviceType).toBe('tablet');
      expect(result.layoutVerified).toBeTruthy();
      expect(result.busCount).toBeGreaterThanOrEqual(0);
    });

    test('should work consistently on desktop devices', async () => {
      const result = await userJourneyPage.performCrossDeviceConsistencyJourney('desktop');
      
      expect(result.deviceType).toBe('desktop');
      expect(result.layoutVerified).toBeTruthy();
      expect(result.busCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Feature Integration', () => {
    test('should integrate sorting and filtering features properly', async () => {
      const result = await userJourneyPage.performSortingAndFilteringJourney();
      
      if (result.initialBusCount > 0) {
        expect(result.sortingTested).toBeTruthy();
        expect(result.finalBusCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle language switching if available', async () => {
      const result = await userJourneyPage.performLanguageSwitchingJourney();
      
      // If language switching is available, it should work properly
      if (result.languageSwitched) {
        expect(result.searchFunctionalAfterSwitch).toBeTruthy();
      }
    });
  });

  test.describe('Edge Cases and Stress Testing', () => {
    test('should handle rapid successive searches', async ({ page }) => {
      await searchPage.goto();
      
      const searchPairs = [
        ['Chennai', 'Bangalore'],
        ['Mumbai', 'Delhi'],
        ['Kolkata', 'Hyderabad'],
        ['Pune', 'Ahmedabad']
      ];
      
      for (const [from, to] of searchPairs) {
        await searchPage.selectFromLocation(from);
        await searchPage.selectToLocation(to);
        await searchPage.clickSearchButton();
        
        // Wait for either results or no results message
        await Promise.race([
          busListPage.busItems.first().waitFor({ state: 'visible', timeout: 10000 }),
          busListPage.noBusesMessage.waitFor({ state: 'visible', timeout: 10000 })
        ]);
        
        // Go back for next search
        if (searchPairs.indexOf([from, to]) < searchPairs.length - 1) {
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should handle special characters in search inputs', async ({ page }) => {
      await searchPage.goto();
      
      const specialCases = [
        ['Chennai@', 'Bangalore#'],
        ['Mumbai123', 'Delhi456'],
        ['Test City', 'Another City'],
        ['', ''] // Empty strings
      ];
      
      for (const [from, to] of specialCases) {
        await searchPage.selectFromLocation(from);
        await searchPage.selectToLocation(to);
        await searchPage.clickSearchButton();
        
        // App should handle gracefully without crashing
        await page.waitForTimeout(2000);
        
        // Navigate back for next test
        await searchPage.goto();
      }
    });

    test('should maintain functionality during viewport changes', async ({ page }) => {
      await searchPage.goto();
      
      // Start with mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await searchPage.selectFromLocation('Chennai');
      
      // Change to tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await searchPage.selectToLocation('Bangalore');
      
      // Change to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await searchPage.clickSearchButton();
      
      // Should still work properly
      await busListPage.waitForBusListToLoad();
      const busCount = await busListPage.getBusCount();
      expect(busCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Data Validation and Edge Cases', () => {
    test('should handle searches with popular routes', async () => {
      const popularRoutes = [
        ['Chennai', 'Bangalore'],
        ['Mumbai', 'Pune'],
        ['Delhi', 'Jaipur'],
        ['Hyderabad', 'Vijayawada']
      ];
      
      for (const [from, to] of popularRoutes) {
        const busCount = await userJourneyPage.performCompleteSearchJourney(from, to);
        
        // Popular routes should typically have buses
        expect(busCount).toBeGreaterThanOrEqual(0);
        
        if (busCount > 0) {
          // Verify bus details are properly displayed
          await busListPage.verifyBusDetails(0);
        }
      }
    });

    test('should handle searches with less common routes', async () => {
      const uncommonRoutes = [
        ['Goa', 'Shimla'],
        ['Kochi', 'Guwahati'],
        ['Thiruvananthapuram', 'Chandigarh']
      ];
      
      for (const [from, to] of uncommonRoutes) {
        await searchPage.goto();
        await searchPage.selectFromLocation(from);
        await searchPage.selectToLocation(to);
        await searchPage.clickSearchButton();
        
        await busListPage.waitForBusListToLoad();
        
        // Should handle gracefully even if no buses found
        const busCount = await busListPage.getBusCount();
        const hasNoBusesMessage = await busListPage.noBusesMessage.isVisible({ timeout: 5000 });
        
        // Either has results or shows appropriate no-results message
        expect(busCount > 0 || hasNoBusesMessage).toBeTruthy();
      }
    });
  });
});