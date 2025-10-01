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
    this.fromLocationInput = page.locator('input[placeholder*="departure"], input[placeholder*="Enter departure location"], [data-testid="from-location-input"], input[name="from"]').first();
    this.toLocationInput = page.locator('input[placeholder*="destination"], input[placeholder*="Enter destination"], [data-testid="to-location-input"], input[name="to"]').first();
    this.findBusesButton = page.locator('button:has-text("Find"), [data-testid="find-buses-button"], button:has-text("Find Buses"), button:has-text("Search")').first();
    this.searchForm = page.locator('[data-testid="search-form"], form, .search-form').first();
    this.header = page.locator('[data-testid="header"], header, .header').first();
    this.footer = page.locator('[data-testid="footer"], footer, .footer').first();
    this.languageSwitcher = page.locator('[data-testid="language-switcher"], .language-switcher').first();
    
    // Aliases for consistent API
    this.fromInput = this.fromLocationInput;
    this.toInput = this.toLocationInput;
    this.dateInput = page.locator('[data-testid="date-input"], input[type="date"], input[name="date"]').first();
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
    await expect(this.fromInput).toBeVisible();
    await expect(this.toInput).toBeVisible();
    await expect(this.dateInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.searchButton).toBeEnabled();
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