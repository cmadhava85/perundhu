import { test } from '@playwright/test';

/**
 * Video Demo 2: Stop Details & Route Information
 * Duration: ~20-25 seconds
 * Shows: Bus Detail → Stops List → Timings
 */

test.describe('Video Demo: Stop Details', () => {
  test('record stop details and timings', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Step 1: Navigate and search (0-8s)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Quick search to get to results
    const searchFrom = page.locator('#from-location-input');
    const searchTo = page.locator('#to-location-input');
    
    await searchFrom.scrollIntoViewIfNeeded();
    await searchFrom.clear();
    await searchFrom.click({ force: true });
    await searchFrom.pressSequentially('Chennai', { delay: 100 });
    const fromSuggestion = page.locator('li:has-text("Chennai")').first();
    await fromSuggestion.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    if (await fromSuggestion.isVisible().catch(() => false)) {
      await fromSuggestion.click();
      await page.waitForTimeout(500);
    }

    await searchTo.waitFor({ state: 'visible', timeout: 5000 });
    await searchTo.scrollIntoViewIfNeeded();
    await searchTo.clear();
    await searchTo.click();
    await page.waitForTimeout(300);
    await searchTo.type('Mattuthavani', { delay: 120 });
    await page.waitForTimeout(2500);
    const toList = page.locator('#to-suggestions-list');
    await toList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const toSuggestion = page.locator('#to-suggestions-list li').first();
    const toVisible = await toSuggestion.isVisible({ timeout: 2000 }).catch(() => false);
    if (toVisible) {
      await toSuggestion.click();
      await page.waitForTimeout(1000);
    }

    const searchButton = page.locator('button:has-text("Search"), button:has-text("🔍")').first();
    await searchButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await searchButton.click();
    await page.waitForTimeout(3000);

    // Step 2: Open bus details (8-12s)
    const resultsAppeared = await page.waitForSelector('.transit-bus-card, .premium-bus-card, [class*="bus-card"]', { timeout: 15000 }).catch(() => null);
    if (!resultsAppeared) {
      console.log('No bus results found - checking page state');
      await page.screenshot({ path: 'test-results/stops-no-results-debug.png' });
    }
    await page.waitForTimeout(1000);
    
    const firstBusCard = page.locator('.transit-bus-card, .premium-bus-card').first();
    const hasResults = await firstBusCard.isVisible().catch(() => false);
    
    if (hasResults) {
      await firstBusCard.click();
      await page.waitForTimeout(2000);

      // Step 3: Show the bus info prominently (12-15s)
      await page.waitForTimeout(2000);

      // Step 4: Scroll through stops slowly to show timing details (15-22s)
      await page.evaluate(() => window.scrollBy(0, 150));
      await page.waitForTimeout(2000);
      
      await page.evaluate(() => window.scrollBy(0, 150));
      await page.waitForTimeout(2000);
      
      await page.evaluate(() => window.scrollBy(0, 150));
      await page.waitForTimeout(2000);

      // Step 5: Scroll back up to show key stops (22-25s)
      await page.evaluate(() => window.scrollBy(0, -200));
      await page.waitForTimeout(2000);
    } else {
      // Show search interface for longer
      await page.waitForTimeout(5000);
    }

    // Final pause
    await page.waitForTimeout(1500);
  });
});
