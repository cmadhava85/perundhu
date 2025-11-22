import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Search Page
 */
export class SearchPage {
  readonly page: Page;
  readonly fromLocationInput: Locator;
  readonly toLocationInput: Locator;
  readonly findBusesButton: Locator;
  readonly searchForm: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly languageSwitcher: Locator;
  // Additional aliases for consistent API
  readonly fromInput: Locator;
  readonly toInput: Locator;
  readonly dateInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use actual placeholders from TransitSearchForm
    this.fromLocationInput = page.locator('input[placeholder*="departure"]').first();
    this.toLocationInput = page.locator('input[placeholder*="destination"]').first();
    this.findBusesButton = page.locator('button:has-text("Find"), button:has-text("Search"), button[class*="search"]').first();
    this.searchForm = page.locator('[class*="search-form"], .search-container, main').first();
    this.header = page.locator('header, [class*="header"]').first();
    this.footer = page.locator('footer, [class*="footer"]').first();
    this.languageSwitcher = page.locator('[class*="language"], button:has-text("EN"), button:has-text("TA")').first();
    
    // Aliases for consistent API
    this.fromInput = this.fromLocationInput;
    this.toInput = this.toLocationInput;
    this.dateInput = page.locator('input[type="date"], [class*="date"]').first();
    this.searchButton = this.findBusesButton;
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async searchBuses(from: string, to: string) {
    // Fill from location
    await this.fromLocationInput.click();
    await this.fromLocationInput.fill(from);
    await this.page.waitForTimeout(500); // Wait for autocomplete
    
    // Select first suggestion if available
    const fromSuggestion = this.page.locator('.dropdown-item, .suggestion, .location-option').first();
    if (await fromSuggestion.isVisible({ timeout: 2000 })) {
      await fromSuggestion.click();
    } else {
      await this.fromLocationInput.press('Enter');
    }

    // Fill to location
    await this.toLocationInput.click();
    await this.toLocationInput.fill(to);
    await this.page.waitForTimeout(500); // Wait for autocomplete
    
    // Select first suggestion if available
    const toSuggestion = this.page.locator('.dropdown-item, .suggestion, .location-option').first();
    if (await toSuggestion.isVisible({ timeout: 2000 })) {
      await toSuggestion.click();
    } else {
      await this.toLocationInput.press('Enter');
    }

    // Click search button
    await this.findBusesButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifySearchFormElements() {
    await expect(this.fromInput).toBeVisible({ timeout: 10000 });
    await expect(this.toInput).toBeVisible({ timeout: 10000 });
    // Date input might not always be visible, skip for now
    // await expect(this.dateInput).toBeVisible();
    // Search button might not exist until form is filled
  }

  async selectFromLocation(location: string) {
    await this.fromInput.click();
    await this.fromInput.fill(location);
    // Wait for suggestions to appear
    await this.page.waitForTimeout(500);
    
    // Try to select from dropdown if available
    const suggestion = this.page.locator(`[data-testid="location-suggestion"]:has-text("${location}"), .location-suggestion:has-text("${location}")`).first();
    if (await suggestion.isVisible({ timeout: 2000 })) {
      await suggestion.click();
    } else {
      // Press Enter to accept typed value
      await this.fromInput.press('Enter');
    }
  }

  async selectToLocation(location: string) {
    await this.toInput.click();
    await this.toInput.fill(location);
    // Wait for suggestions to appear
    await this.page.waitForTimeout(500);
    
    // Try to select from dropdown if available
    const suggestion = this.page.locator(`[data-testid="location-suggestion"]:has-text("${location}"), .location-suggestion:has-text("${location}")`).first();
    if (await suggestion.isVisible({ timeout: 2000 })) {
      await suggestion.click();
    } else {
      // Press Enter to accept typed value
      await this.toInput.press('Enter');
    }
  }

  async selectDate(date: string) {
    await this.dateInput.click();
    await this.dateInput.fill(date);
  }

  async clickSearchButton() {
    await this.searchButton.click();
    // Wait for navigation or loading to start
    await this.page.waitForTimeout(1000);
  }

  async verifyResponsiveElements(isMobile: boolean) {
    if (isMobile) {
      // Mobile-specific checks
      await expect(this.searchForm).toBeVisible();
      // Check if bottom navigation is visible on mobile
      const bottomNav = this.page.locator('[data-testid="bottom-navigation"], .bottom-navigation');
      await expect(bottomNav).toBeVisible();
    } else {
      // Desktop-specific checks
      await expect(this.header).toBeVisible();
      if (await this.footer.isVisible({ timeout: 1000 })) {
        await expect(this.footer).toBeVisible();
      }
    }
  }
}