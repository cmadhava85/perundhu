import { Page, expect } from '@playwright/test';

/**
 * Test Utilities for E2E Tests
 * Common functions and helpers used across test files
 */

export class TestUtils {
  static async waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Additional buffer for animations
  }

  static async takeFullPageScreenshot(page: Page, name: string) {
    await page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }

  static async verifyNoConsoleErrors(page: Page) {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Give some time for any errors to appear
    await page.waitForTimeout(1000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('Manifest') &&
      !error.includes('Service Worker') &&
      !error.includes('_vite') // Vite HMR related
    );

    if (criticalErrors.length > 0) {
      console.warn('Console errors found:', criticalErrors);
    }
    
    return criticalErrors.length === 0;
  }

  static async fillSearchForm(page: Page, from: string, to: string) {
    // Fill from location
    const fromInput = page.locator('[data-testid="from-location-input"], input[placeholder*="From"]').first();
    await fromInput.click();
    await fromInput.clear();
    await fromInput.fill(from);
    await page.waitForTimeout(300);

    // Handle autocomplete if present
    const fromSuggestion = page.locator('.dropdown-item, .suggestion, .location-option').first();
    if (await fromSuggestion.isVisible({ timeout: 1000 })) {
      await fromSuggestion.click();
    } else {
      await fromInput.press('Enter');
    }

    // Fill to location
    const toInput = page.locator('[data-testid="to-location-input"], input[placeholder*="To"]').first();
    await toInput.click();
    await toInput.clear();
    await toInput.fill(to);
    await page.waitForTimeout(300);

    // Handle autocomplete if present
    const toSuggestion = page.locator('.dropdown-item, .suggestion, .location-option').first();
    if (await toSuggestion.isVisible({ timeout: 1000 })) {
      await toSuggestion.click();
    } else {
      await toInput.press('Enter');
    }

    // Click search button
    const searchButton = page.locator('[data-testid="find-buses-button"], button:has-text("Find Buses")').first();
    await searchButton.click();
    
    await this.waitForPageLoad(page);
  }

  static async verifyElementExists(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  static async getElementCount(page: Page, selector: string): Promise<number> {
    try {
      return await page.locator(selector).count();
    } catch {
      return 0;
    }
  }

  static async verifyResponsiveLayout(page: Page, viewport: { width: number; height: number }) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(500); // Allow layout to adjust

    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = viewport.width;
    
    // Allow for small differences due to scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);

    // Verify essential elements are still visible
    const mainContent = page.locator('main, .main-content, .app-content, body > div').first();
    await expect(mainContent).toBeVisible();

    return true;
  }

  static async testKeyboardNavigation(page: Page, expectedElements: string[]) {
    let focusedElements = 0;

    for (let i = 0; i < expectedElements.length; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible({ timeout: 1000 })) {
        focusedElements++;
        
        // Check if focused element matches one of expected selectors
        for (const selector of expectedElements) {
          const expectedElement = page.locator(selector).first();
          if (await expectedElement.isVisible() && await expectedElement.isFocused()) {
            break;
          }
        }
      }
    }

    return focusedElements > 0;
  }

  static async simulateSlowNetwork(page: Page) {
    // Simulate slow 3G connection
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      route.continue();
    });
  }

  static async simulateOfflineMode(page: Page) {
    await page.setOfflineMode(true);
  }

  static async restoreOnlineMode(page: Page) {
    await page.setOfflineMode(false);
  }

  static async verifyLoadingStates(page: Page) {
    // Look for loading indicators
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '.skeleton',
      '[aria-label*="loading" i]'
    ];

    let foundLoadingState = false;
    
    for (const selector of loadingSelectors) {
      if (await this.verifyElementExists(page, selector, 1000)) {
        foundLoadingState = true;
        
        // Wait for loading to complete
        try {
          await page.waitForSelector(selector, { state: 'hidden', timeout: 10000 });
        } catch {
          // Loading state might not disappear, that's okay
        }
        break;
      }
    }

    return foundLoadingState;
  }

  static async verifyErrorHandling(page: Page) {
    // Check for error messages
    const errorSelectors = [
      '[data-testid="error"]',
      '.error',
      '.error-message',
      '[role="alert"]'
    ];

    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      if (await errorElement.isVisible({ timeout: 1000 })) {
        const errorText = await errorElement.textContent();
        console.log(`Found error message: ${errorText}`);
        return true;
      }
    }

    return false;
  }

  static async measurePerformance(page: Page): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
  }> {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0
      };
    });

    return performanceMetrics;
  }

  static async verifyAccessibility(page: Page) {
    // Basic accessibility checks
    const issues: string[] = [];

    // Check for page title
    const title = await page.title();
    if (!title || title.length < 3) {
      issues.push('Page title is missing or too short');
    }

    // Check for main landmark
    const mainLandmark = page.locator('main, [role="main"]');
    if (await mainLandmark.count() === 0) {
      issues.push('No main landmark found');
    }

    // Check for heading structure
    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) {
      issues.push('No h1 heading found');
    } else if (h1Count > 1) {
      issues.push('Multiple h1 headings found');
    }

    // Check for form labels
    const inputs = page.locator('input[type="text"], input[type="email"], textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
          issues.push(`Input without proper labeling found`);
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }
}

/**
 * Common test data for E2E tests
 */
export const TestData = {
  searchQueries: [
    { from: 'Chennai', to: 'Coimbatore' },
    { from: 'Mumbai', to: 'Pune' },
    { from: 'Delhi', to: 'Agra' },
    { from: 'Bangalore', to: 'Mysore' }
  ],
  
  viewports: {
    mobile: { width: 375, height: 667 },
    mobileLandscape: { width: 667, height: 375 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    largeDesktop: { width: 1920, height: 1080 }
  },
  
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
    veryLong: 30000
  }
};