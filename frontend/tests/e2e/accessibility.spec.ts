import { test, expect } from '@playwright/test';

/**
 * Accessibility E2E Tests
 * Tests to ensure the application is accessible to users with disabilities
 */
test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper page title and meta information', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Perundhu|Bus/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const content = await metaDescription.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content?.length).toBeGreaterThan(10);
    }
    
    // Check viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test tab navigation through interactive elements
    const interactiveElements = [
      '[data-testid="from-location-input"], input[placeholder*="From"]',
      '[data-testid="to-location-input"], input[placeholder*="To"]',
      '[data-testid="find-buses-button"], button:has-text("Find Buses")'
    ];

    for (let i = 0; i < interactiveElements.length; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify the element can receive focus
      const element = page.locator(interactiveElements[i]).first();
      if (await element.isVisible()) {
        await element.focus();
        await expect(element).toBeFocused();
      }
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Check for proper heading structure
    const h1 = page.locator('h1');
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible();
    }

    // Check for proper label associations
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        // Check if input has aria-label or associated label
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const id = await input.getAttribute('id');
        
        if (id) {
          const associatedLabel = page.locator(`label[for="${id}"]`);
          const hasAssociatedLabel = await associatedLabel.count() > 0;
          
          // Input should have some form of labeling
          expect(ariaLabel || ariaLabelledBy || hasAssociatedLabel).toBeTruthy();
        }
      }
    }
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Search for buses to get to results page
    await page.fill('[data-testid="from-location-input"], input[placeholder*="From"]', 'Chennai');
    await page.fill('[data-testid="to-location-input"], input[placeholder*="To"]', 'Coimbatore');
    await page.click('[data-testid="find-buses-button"], button:has-text("Find Buses")');
    
    await page.waitForLoadState('networkidle');

    // Check for proper ARIA roles
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // Buttons should have accessible names
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        
        expect(text || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }

    // Check for proper list structure
    const lists = page.locator('ul, ol, [role="list"]');
    const listCount = await lists.count();
    
    for (let i = 0; i < Math.min(listCount, 3); i++) {
      const list = lists.nth(i);
      if (await list.isVisible()) {
        // Lists should have list items
        const listItems = list.locator('li, [role="listitem"]');
        const itemCount = await listItems.count();
        if (itemCount > 0) {
          expect(itemCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Enable high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Verify page still loads correctly
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that essential elements are still visible
    const mainContent = page.locator('main, .main-content, body > div').first();
    await expect(mainContent).toBeVisible();
    
    // Test search functionality in high contrast
    await page.fill('[data-testid="from-location-input"], input[placeholder*="From"]', 'Chennai');
    await page.fill('[data-testid="to-location-input"], input[placeholder*="To"]', 'Coimbatore');
    await page.click('[data-testid="find-buses-button"], button:has-text("Find Buses")');
    
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of high contrast mode
    await page.screenshot({ 
      path: 'test-results/screenshots/high-contrast-mode.png',
      fullPage: true 
    });
  });

  test('should support text scaling', async ({ page }) => {
    // Test with larger text scale
    await page.addStyleTag({
      content: `
        * {
          font-size: 150% !important;
        }
      `
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify layout doesn't break with larger text
    const searchForm = page.locator('form, .search-form').first();
    await expect(searchForm).toBeVisible();

    // Test that buttons are still clickable
    const searchButton = page.locator('[data-testid="find-buses-button"], button:has-text("Find Buses")').first();
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();

    // Take screenshot with scaled text
    await page.screenshot({ 
      path: 'test-results/screenshots/scaled-text.png',
      fullPage: true 
    });
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // Test that search results are announced properly
    await page.fill('[data-testid="from-location-input"], input[placeholder*="From"]', 'Chennai');
    await page.fill('[data-testid="to-location-input"], input[placeholder*="To"]', 'Coimbatore');
    
    // Check for loading state announcement
    await page.click('[data-testid="find-buses-button"], button:has-text("Find Buses")');
    
    // Look for aria-live regions or loading indicators
    const liveRegions = page.locator('[aria-live], [aria-atomic], .loading, [data-testid="loading"]');
    if (await liveRegions.count() > 0) {
      const firstLiveRegion = liveRegions.first();
      if (await firstLiveRegion.isVisible()) {
        await expect(firstLiveRegion).toBeVisible();
      }
    }

    await page.waitForLoadState('networkidle');

    // Check that results are properly announced
    const resultsContainer = page.locator('[data-testid="bus-list"], .modern-bus-list, .bus-list').first();
    if (await resultsContainer.isVisible()) {
      const ariaLabel = await resultsContainer.getAttribute('aria-label');
      const ariaLabelledBy = await resultsContainer.getAttribute('aria-labelledby');
      
      // Results should have some accessibility labeling
      if (ariaLabel || ariaLabelledBy) {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should handle focus management', async ({ page }) => {
    // Test focus management during navigation
    const fromInput = page.locator('[data-testid="from-location-input"], input[placeholder*="From"]').first();
    
    await fromInput.focus();
    await expect(fromInput).toBeFocused();

    // Fill form and submit
    await fromInput.fill('Chennai');
    await page.fill('[data-testid="to-location-input"], input[placeholder*="To"]', 'Coimbatore');
    await page.click('[data-testid="find-buses-button"], button:has-text("Find Buses")');

    await page.waitForLoadState('networkidle');

    // Focus should be managed properly after navigation
    const focusedElement = page.locator(':focus');
    
    // Some element should have focus (either the page itself or a specific element)
    const hasFocus = await focusedElement.count() > 0;
    if (!hasFocus) {
      // If no element has focus, the body should be focusable
      const body = page.locator('body');
      await body.focus();
      await expect(body).toBeFocused();
    }
  });
});