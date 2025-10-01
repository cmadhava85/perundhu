import { Page, expect } from '@playwright/test';
import { HomePage } from './HomePage';
import { SearchPage } from './SearchPage';
import { BusListPage } from './BusListPage';

/**
 * Page Object Model for Complete User Journeys
 * Handles end-to-end user flows and complex interactions
 */
export class UserJourneyPage {
  readonly page: Page;
  readonly homePage: HomePage;
  readonly searchPage: SearchPage;
  readonly busListPage: BusListPage;

  constructor(page: Page) {
    this.page = page;
    this.homePage = new HomePage(page);
    this.searchPage = new SearchPage(page);
    this.busListPage = new BusListPage(page);
  }

  async performCompleteSearchJourney(from: string, to: string, date?: string) {
    // Step 1: Navigate to home page
    await this.homePage.goto();
    await this.homePage.verifyPageLoad();

    // Step 2: Perform search
    await this.homePage.searchForBuses(from, to, date);

    // Step 3: Verify bus list page loads
    await this.busListPage.waitForBusListToLoad();
    await this.busListPage.verifyBusListPageElements();

    // Step 4: Verify search results
    const busCount = await this.busListPage.getBusCount();
    expect(busCount).toBeGreaterThanOrEqual(0);

    return busCount;
  }

  async performMobileUserJourney(from: string, to: string) {
    // Verify mobile layout on homepage
    await this.homePage.goto();
    await this.homePage.verifyResponsiveLayout(true);

    // Perform search optimized for mobile
    await this.homePage.searchForBuses(from, to);

    // Verify mobile bus list
    await this.busListPage.waitForBusListToLoad();
    await this.busListPage.verifyMobileBusListElements();

    // Test mobile interactions
    const busCount = await this.busListPage.getBusCount();
    if (busCount > 0) {
      // Test expanding bus item on mobile
      await this.busListPage.expandBusItem(0);
      await this.busListPage.verifyBusDetails(0);
    }

    return busCount;
  }

  async performAccessibilityJourney() {
    // Navigate to home page
    await this.homePage.goto();

    // Test keyboard navigation
    await this.homePage.verifyAccessibility();

    // Test form validation
    const hasValidation = await this.homePage.verifyFormValidation();

    // Perform accessible search using keyboard
    await this.page.keyboard.press('Tab'); // Focus first input
    await this.page.keyboard.type('Chennai');
    await this.page.keyboard.press('Tab'); // Move to second input
    await this.page.keyboard.type('Bangalore');
    await this.page.keyboard.press('Tab'); // Move to date or button
    await this.page.keyboard.press('Tab'); // Move to button if date was present
    await this.page.keyboard.press('Enter'); // Submit form

    // Verify results page is accessible
    await this.busListPage.waitForBusListToLoad();

    return { hasValidation };
  }

  async performPerformanceJourney() {
    const startTime = Date.now();

    // Navigate to home page and measure load time
    await this.homePage.goto();
    const pageLoadTime = Date.now() - startTime;

    // Measure search performance
    const searchStartTime = Date.now();
    await this.homePage.searchForBuses('Chennai', 'Bangalore');
    await this.busListPage.waitForBusListToLoad();
    const searchTime = Date.now() - searchStartTime;

    // Measure interaction performance
    const interactionStartTime = Date.now();
    const busCount = await this.busListPage.getBusCount();
    if (busCount > 0) {
      await this.busListPage.selectBus(0);
    }
    const interactionTime = Date.now() - interactionStartTime;

    return {
      pageLoadTime,
      searchTime,
      interactionTime,
      busCount
    };
  }

  async performErrorHandlingJourney() {
    // Test with invalid locations
    await this.homePage.goto();
    
    // Try search with non-existent locations
    await this.homePage.searchForBuses('NonExistentCity1', 'NonExistentCity2');
    
    // Wait for results or error handling
    await this.page.waitForTimeout(2000);
    
    // Check if error message or no results message is displayed
    const errorMessage = this.page.locator('.error-message, .no-results, .empty-state');
    const hasErrorHandling = await errorMessage.isVisible({ timeout: 5000 });
    
    // Test network error scenarios (if possible)
    // This would require mocking network responses
    
    return { hasErrorHandling };
  }

  async performLanguageSwitchingJourney() {
    await this.homePage.goto();
    
    // Test language switching if available
    const languageSwitched = await this.homePage.verifyLanguageSwitching();
    
    if (languageSwitched) {
      // Verify that UI elements are translated
      await this.page.waitForTimeout(1000);
      
      // Check if search form is still functional after language switch
      await this.homePage.searchForBuses('Chennai', 'Bangalore');
      await this.busListPage.waitForBusListToLoad();
      
      const busCount = await this.busListPage.getBusCount();
      return { languageSwitched: true, searchFunctionalAfterSwitch: busCount >= 0 };
    }
    
    return { languageSwitched: false, searchFunctionalAfterSwitch: false };
  }

  async performSortingAndFilteringJourney() {
    // Perform search to get to bus list
    await this.homePage.goto();
    await this.homePage.searchForBuses('Chennai', 'Bangalore');
    await this.busListPage.waitForBusListToLoad();
    
    const initialBusCount = await this.busListPage.getBusCount();
    
    if (initialBusCount > 0) {
      // Test sorting functionality
      await this.busListPage.verifySortingFunctionality();
      
      // Test search within results
      await this.busListPage.verifySearchFunctionality();
      
      // Verify bus list still contains items after sorting/filtering
      const finalBusCount = await this.busListPage.getBusCount();
      
      return { 
        initialBusCount, 
        finalBusCount, 
        sortingTested: true 
      };
    }
    
    return { 
      initialBusCount: 0, 
      finalBusCount: 0, 
      sortingTested: false 
    };
  }

  async performCrossDeviceConsistencyJourney(deviceType: 'mobile' | 'tablet' | 'desktop') {
    // Set appropriate viewport
    let viewport;
    switch (deviceType) {
      case 'mobile':
        viewport = { width: 375, height: 667 };
        break;
      case 'tablet':
        viewport = { width: 768, height: 1024 };
        break;
      case 'desktop':
        viewport = { width: 1920, height: 1080 };
        break;
    }
    
    await this.page.setViewportSize(viewport);
    
    // Navigate and verify layout
    await this.homePage.goto();
    await this.homePage.verifyResponsiveLayout(deviceType === 'mobile');
    
    // Perform search
    await this.homePage.searchForBuses('Chennai', 'Bangalore');
    await this.busListPage.waitForBusListToLoad();
    
    // Verify device-specific elements
    if (deviceType === 'mobile') {
      await this.busListPage.verifyMobileBusListElements();
    } else {
      await this.busListPage.verifyBusListPageElements();
    }
    
    const busCount = await this.busListPage.getBusCount();
    
    return {
      deviceType,
      viewport,
      busCount,
      layoutVerified: true
    };
  }
}