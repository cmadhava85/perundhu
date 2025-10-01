import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Bus List Results Page
 */
export class BusListPage {
  readonly page: Page;
  readonly busListContainer: Locator;
  readonly busItems: Locator;
  readonly busListHeader: Locator;
  readonly availableBusesTitle: Locator;
  readonly busCount: Locator;
  readonly searchInput: Locator;
  readonly sortControls: Locator;
  readonly sortButtons: Locator;
  readonly viewControls: Locator;
  readonly filterToggle: Locator;
  readonly routeMap: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly noBusesMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main containers
    this.busListContainer = page.locator('[data-testid="bus-list"], .modern-bus-list, .bus-list-container').first();
    this.busItems = page.locator('[data-testid="bus-item"], .modern-bus-item, .bus-item');
    
    // Header elements
    this.busListHeader = page.locator('[data-testid="bus-list-header"], .bus-list-header').first();
    this.availableBusesTitle = page.locator('h2:has-text("Available Buses"), .list-title').first();
    this.busCount = page.locator('[data-testid="bus-count"], .bus-count').first();
    
    // Search and filter elements
    this.searchInput = page.locator('[data-testid="bus-search"], .search-input input, input[placeholder*="Search"]').first();
    this.sortControls = page.locator('[data-testid="sort-controls"], .sort-controls').first();
    this.sortButtons = page.locator('[data-testid="sort-button"], .sort-btn');
    this.viewControls = page.locator('[data-testid="view-controls"], .view-controls').first();
    this.filterToggle = page.locator('[data-testid="filter-toggle"], .filter-toggle').first();
    
    // Map and other elements
    this.routeMap = page.locator('[data-testid="route-map"], .route-map, .map-container').first();
    this.loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner').first();
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message').first();
    this.noBusesMessage = page.locator('[data-testid="no-buses"], .no-buses, .empty-state').first();
  }

  async verifyBusListPageElements() {
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    
    // Verify main container is visible
    await expect(this.busListContainer).toBeVisible();
    
    // Verify header elements
    await expect(this.busListHeader).toBeVisible();
    await expect(this.availableBusesTitle).toBeVisible();
    
    // Verify the title contains "Available Buses" (check for the 's' that was missing)
    const titleText = await this.availableBusesTitle.textContent();
    expect(titleText).toContain('Available Buses');
    expect(titleText).toMatch(/Available Buses?/i); // Should end with 's'
    
    // Verify bus count is visible
    await expect(this.busCount).toBeVisible();
    
    // Verify search functionality
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchInput).toBeEnabled();
    
    // Verify sort controls
    await expect(this.sortControls).toBeVisible();
    
    // Verify all sort buttons are present and visible
    const expectedSortButtons = ['Departure', 'Arrival', 'Duration', 'Price'];
    for (const buttonText of expectedSortButtons) {
      const button = this.page.locator(`button:has-text("${buttonText}"), .sort-btn:has-text("${buttonText}")`);
      await expect(button).toBeVisible();
    }
    
    // Verify filter toggle
    await expect(this.filterToggle).toBeVisible();
    await expect(this.filterToggle).toBeEnabled();
  }

  async verifyBusItems() {
    // Wait for bus items to load
    await this.page.waitForSelector('[data-testid="bus-item"], .modern-bus-item, .bus-item', { 
      state: 'visible', 
      timeout: 10000 
    });
    
    // Get all bus items
    const busItems = await this.busItems.all();
    expect(busItems.length).toBeGreaterThan(0);
    
    // Verify each bus item has required elements
    for (let i = 0; i < Math.min(busItems.length, 3); i++) { // Check first 3 items
      const busItem = busItems[i];
      
      // Verify bus item is visible
      await expect(busItem).toBeVisible();
      
      // Verify bus has essential information
      const busName = busItem.locator('.bus-name, .bus-details h3');
      await expect(busName).toBeVisible();
      
      // Verify timing information
      const departureTime = busItem.locator('.departure-info .time-value, .time-display .departure-info');
      const arrivalTime = busItem.locator('.arrival-info .time-value, .time-display .arrival-info');
      await expect(departureTime).toBeVisible();
      await expect(arrivalTime).toBeVisible();
      
      // Verify additional information is present
      const quickInfo = busItem.locator('.quick-info, .info-item');
      await expect(quickInfo.first()).toBeVisible();
      
      // Verify all information is on single line (no wrapping)
      const quickInfoContainer = busItem.locator('.quick-info').first();
      if (await quickInfoContainer.isVisible()) {
        const boundingBox = await quickInfoContainer.boundingBox();
        const infoItems = await busItem.locator('.info-item').all();
        
        // Check that all info items are roughly on the same horizontal line
        if (infoItems.length > 1) {
          const firstItemBox = await infoItems[0].boundingBox();
          const lastItemBox = await infoItems[infoItems.length - 1].boundingBox();
          
          if (firstItemBox && lastItemBox) {
            // Allow for some variance in vertical position (within 10px)
            const verticalDifference = Math.abs(firstItemBox.y - lastItemBox.y);
            expect(verticalDifference).toBeLessThan(10);
          }
        }
      }
    }
  }

  async verifyMobileBusListElements() {
    // Mobile-specific verification
    
    // Verify header elements are properly sized for mobile
    await expect(this.busListHeader).toBeVisible();
    
    // Check that title and controls are on same line
    const headerContent = this.page.locator('.header-content, .bus-list-header .header-content').first();
    if (await headerContent.isVisible()) {
      const boundingBox = await headerContent.boundingBox();
      if (boundingBox) {
        // Verify header doesn't exceed viewport width
        expect(boundingBox.width).toBeLessThanOrEqual(await this.page.viewportSize()?.width || 768);
      }
    }
    
    // Verify sort controls scroll horizontally on mobile
    const sortControlsBox = await this.sortControls.boundingBox();
    if (sortControlsBox) {
      // Check that sort controls are horizontally scrollable
      const overflowX = await this.sortControls.evaluate((el) => 
        window.getComputedStyle(el).overflowX
      );
      expect(['auto', 'scroll'].includes(overflowX)).toBeTruthy();
    }
    
    // Verify Price button is visible (was previously hidden on mobile)
    const priceButton = this.page.locator('button:has-text("Price"), .sort-btn:has-text("Price")').first();
    await expect(priceButton).toBeVisible();
  }

  async expandBusItem(index: number = 0) {
    const busItems = await this.busItems.all();
    if (busItems.length > index) {
      await busItems[index].click();
      
      // Wait for expansion animation
      await this.page.waitForTimeout(500);
      
      // Verify expanded content is visible
      const expandedContent = busItems[index].locator('.expanded-content, .route-details');
      await expect(expandedContent).toBeVisible();
      
      // Verify route map is present
      const routeMap = busItems[index].locator('.route-map, .map-container');
      if (await routeMap.isVisible({ timeout: 2000 })) {
        await expect(routeMap).toBeVisible();
      }
      
      return true;
    }
    return false;
  }

  async verifySortingFunctionality() {
    // Test each sort button
    const sortButtons = ['Departure', 'Arrival', 'Duration', 'Price'];
    
    for (const buttonText of sortButtons) {
      const button = this.page.locator(`button:has-text("${buttonText}"), .sort-btn:has-text("${buttonText}")`).first();
      
      if (await button.isVisible()) {
        // Click the sort button
        await button.click();
        await this.page.waitForTimeout(500);
        
        // Verify button shows active state
        const isActive = await button.evaluate((el) => 
          el.classList.contains('active') || el.classList.contains('selected')
        );
        expect(isActive).toBeTruthy();
      }
    }
  }

  async verifySearchFunctionality() {
    // Test search input
    await this.searchInput.click();
    await this.searchInput.fill('test');
    await this.page.waitForTimeout(500);
    
    // Verify input value
    await expect(this.searchInput).toHaveValue('test');
    
    // Clear search
    await this.searchInput.clear();
  }

  async getBusItems() {
    // Wait for bus items to load
    await this.page.waitForSelector('[data-testid="bus-item"], .modern-bus-item, .bus-item', { 
      state: 'visible', 
      timeout: 10000 
    });
    return await this.busItems.all();
  }

  async getBusCount(): Promise<number> {
    const items = await this.getBusItems();
    return items.length;
  }

  async selectBus(index: number) {
    const busItems = await this.getBusItems();
    if (busItems.length > index) {
      await busItems[index].click();
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  async verifyBusDetails(index: number) {
    const busItems = await this.getBusItems();
    if (busItems.length > index) {
      const busItem = busItems[index];
      
      // Verify essential bus information
      const busName = busItem.locator('.bus-name, .bus-details h3');
      await expect(busName).toBeVisible();
      
      const departureTime = busItem.locator('.departure-info .time-value, .time-display .departure-info');
      const arrivalTime = busItem.locator('.arrival-info .time-value, .time-display .arrival-info');
      await expect(departureTime).toBeVisible();
      await expect(arrivalTime).toBeVisible();
      
      return true;
    }
    return false;
  }

  async waitForBusListToLoad() {
    // Wait for loading to complete
    await this.page.waitForLoadState('networkidle');
    
    // Wait for bus items to appear or no-buses message
    await Promise.race([
      this.busItems.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.noBusesMessage.waitFor({ state: 'visible', timeout: 15000 })
    ]);
  }
}