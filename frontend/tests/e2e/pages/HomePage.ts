import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Home Page
 */
export class HomePage {
  readonly page: Page;
  readonly searchForm: Locator;
  readonly fromLocationInput: Locator;
  readonly toLocationInput: Locator;
  readonly dateInput: Locator;
  readonly findBusesButton: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly languageSwitcher: Locator;
  readonly navigationMenu: Locator;
  readonly heroSection: Locator;
  readonly featuresSection: Locator;
  readonly bottomNavigation: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Search form elements
    this.searchForm = page.locator('[data-testid="search-form"], form, .search-form').first();
    this.fromLocationInput = page.locator('input[placeholder*="departure"], input[placeholder*="Enter departure location"], [data-testid="from-location-input"], input[name="from"]').first();
    this.toLocationInput = page.locator('input[placeholder*="destination"], input[placeholder*="Enter destination"], [data-testid="to-location-input"], input[name="to"]').first();
    this.dateInput = page.locator('[data-testid="date-input"], input[type="date"], input[name="date"]').first();
    this.findBusesButton = page.locator('button:has-text("Find"), [data-testid="find-buses-button"], button:has-text("Find Buses"), button:has-text("Search")').first();
    
    // Page structure elements
    this.header = page.locator('[data-testid="header"], header, .header').first();
    this.footer = page.locator('[data-testid="footer"], footer, .footer').first();
    this.languageSwitcher = page.locator('[data-testid="language-switcher"], .language-switcher').first();
    this.navigationMenu = page.locator('[data-testid="navigation"], nav, .navigation').first();
    this.heroSection = page.locator('[data-testid="hero"], .hero-section, .hero').first();
    this.featuresSection = page.locator('[data-testid="features"], .features-section, .features').first();
    this.bottomNavigation = page.locator('[data-testid="bottom-navigation"], .bottom-navigation').first();
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageLoad() {
    // Verify essential page elements are visible
    await expect(this.searchForm).toBeVisible();
    await expect(this.fromLocationInput).toBeVisible();
    await expect(this.toLocationInput).toBeVisible();
    await expect(this.findBusesButton).toBeVisible();
    
    // Verify the page has loaded completely
    await this.page.waitForLoadState('networkidle');
  }

  async verifyResponsiveLayout(isMobile: boolean) {
    if (isMobile) {
      // Mobile-specific checks
      const viewport = this.page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(768);
      
      // Check if bottom navigation is visible on mobile
      if (await this.bottomNavigation.isVisible({ timeout: 2000 })) {
        await expect(this.bottomNavigation).toBeVisible();
      }
      
      // Verify search form is mobile-optimized
      const searchFormBox = await this.searchForm.boundingBox();
      if (searchFormBox && viewport) {
        expect(searchFormBox.width).toBeLessThanOrEqual(viewport.width);
      }
    } else {
      // Desktop-specific checks
      const viewport = this.page.viewportSize();
      expect(viewport?.width).toBeGreaterThan(768);
      
      // Header should be visible on desktop
      await expect(this.header).toBeVisible();
      
      // Footer might be visible on desktop
      if (await this.footer.isVisible({ timeout: 2000 })) {
        await expect(this.footer).toBeVisible();
      }
    }
  }

  async searchForBuses(from: string, to: string, date?: string) {
    // Fill from location
    await this.fromLocationInput.click();
    await this.fromLocationInput.fill(from);
    await this.page.waitForTimeout(500);
    
    // Try to select suggestion if available
    const fromSuggestion = this.page.locator('.dropdown-item, .suggestion, .location-option').first();
    if (await fromSuggestion.isVisible({ timeout: 2000 })) {
      await fromSuggestion.click();
    } else {
      await this.fromLocationInput.press('Enter');
    }

    // Fill to location
    await this.toLocationInput.click();
    await this.toLocationInput.fill(to);
    await this.page.waitForTimeout(500);
    
    // Try to select suggestion if available
    const toSuggestion = this.page.locator('.dropdown-item, .suggestion, .location-option').first();
    if (await toSuggestion.isVisible({ timeout: 2000 })) {
      await toSuggestion.click();
    } else {
      await this.toLocationInput.press('Enter');
    }

    // Fill date if provided and date input exists
    if (date && await this.dateInput.isVisible({ timeout: 1000 })) {
      await this.dateInput.click();
      await this.dateInput.fill(date);
    }

    // Click search button
    await this.findBusesButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyAccessibility() {
    // Check for basic accessibility attributes
    const buttonAccessibleName = await this.findBusesButton.textContent();
    
    // Basic accessibility checks
    expect(buttonAccessibleName).toBeTruthy();
    
    // Check tab navigation
    await this.fromLocationInput.focus();
    await this.page.keyboard.press('Tab');
    await expect(this.toLocationInput).toBeFocused();
    
    await this.page.keyboard.press('Tab');
    if (await this.dateInput.isVisible({ timeout: 1000 })) {
      await expect(this.dateInput).toBeFocused();
      await this.page.keyboard.press('Tab');
    }
    await expect(this.findBusesButton).toBeFocused();
  }

  async verifyLanguageSwitching() {
    if (await this.languageSwitcher.isVisible({ timeout: 2000 })) {
      // Click language switcher
      await this.languageSwitcher.click();
      await this.page.waitForTimeout(500);
      
      // Verify language options are available
      const languageOptions = this.page.locator('.language-option, .lang-option');
      const optionsCount = await languageOptions.count();
      expect(optionsCount).toBeGreaterThan(0);
      
      return true;
    }
    return false;
  }

  async verifyFormValidation() {
    // Try to submit form with empty fields
    await this.findBusesButton.click();
    await this.page.waitForTimeout(500);
    
    // Check if validation messages appear
    const validationMessages = this.page.locator('.error-message, .validation-error, .field-error');
    const hasValidation = await validationMessages.count() > 0;
    
    return hasValidation;
  }
}