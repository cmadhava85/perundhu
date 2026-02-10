import { test, expect } from '@playwright/test';

/**
 * Video Demo 1: Search & Results
 * Duration: ~20-25 seconds
 * Shows: Home → Search → Results → Bus Details
 */

test.describe('Video Demo: Search & Results', () => {
  test('record search and results flow', async ({ page }) => {
    // Set mobile viewport (iPhone 13 Pro size)
    await page.setViewportSize({ width: 720, height: 1280 });

    // Listen for API calls to debug locations loading
    page.on('response', async (response) => {
      if (response.url().includes('/locations')) {
        console.log(`Locations API: ${response.status()} - ${response.url()}`);
      }
    });

    // Step 1: Navigate to home page (0-5s)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for locations to load (CRITICAL for search to work)
    console.log('Waiting for locations to load...');
    await page.waitForFunction(() => {
      return document.querySelector('.transit-search-form') !== null;
    }, { timeout: 30000 });
    
    // Give time for React to initialize
    await page.waitForTimeout(3000);
    console.log('App loaded successfully');

    // Step 2: Type search query slowly (5-10s)
    const searchFrom = page.locator('#from-location-input');
    const searchTo = page.locator('#to-location-input');
    
    // Type "KCBT KILAMBAKKAM" slowly
    await searchFrom.waitFor({ state: 'visible', timeout: 10000 });
    await searchFrom.scrollIntoViewIfNeeded();
    await searchFrom.click();
    await page.waitForTimeout(500);
    await searchFrom.fill('KCBT KILAMBAKKAM');
    await page.waitForTimeout(3000);
    
    // Use keyboard navigation to select from autocomplete
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    console.log('Selected FROM location');

    // Type "Madurai - Mattuthavani" slowly
    await searchTo.waitFor({ state: 'visible', timeout: 5000 });
    await searchTo.scrollIntoViewIfNeeded();
    await searchTo.fill('Madurai - Mattuthavani');
    await page.waitForTimeout(3000);
    
    // Use keyboard navigation to select from autocomplete
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    console.log('Selected TO location');

    // Step 3: Click search button
    await page.waitForTimeout(1000);
    
    const searchButton = page.locator('button:has-text("🔍")').first();
    await searchButton.waitFor({ state: 'visible', timeout: 10000 });
    
    const isDisabled = await searchButton.isDisabled();
    console.log('Search button disabled:', isDisabled);
    
    if (!isDisabled) {
      // Wait for navigation to results page
      const [response] = await Promise.all([
        page.waitForURL('**/results**', { timeout: 10000 }).catch(() => null),
        searchButton.click()
      ]);
      console.log('Search button clicked');
      await page.waitForTimeout(2000);
      console.log('Current URL:', page.url());
    } else {
      console.log('Button is disabled, cannot search');
      await page.waitForTimeout(3000);
    }

    // Step 4: Wait for results to appear
    const resultsAppeared = await page.waitForSelector('.transit-bus-card, .premium-bus-card, [class*="bus-card"]', { timeout: 15000 }).catch(() => null);
    if (!resultsAppeared) {
      console.log('No bus results found');
    }
    await page.waitForTimeout(2000);

    // Step 5: Scroll through results slowly
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1500);

    // Step 6: Click on a bus card to show details
    const firstBusCard = page.locator('.transit-bus-card, .premium-bus-card').first();
    const hasResults = await firstBusCard.isVisible().catch(() => false);
    if (hasResults) {
      await firstBusCard.click();
      await page.waitForTimeout(2000);

      // Step 7: Show stop details
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(1500);
    } else {
      // Show the no results state
      await page.waitForTimeout(3000);
    }

    // Final pause
    await page.waitForTimeout(2000);
  });
});
