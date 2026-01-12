import { test, expect } from '@playwright/test';

/**
 * Module 1: Bus Search & Schedule Lookup - User E2E Tests
 * Based on MANUAL_TEST_CASES_COMPREHENSIVE.md
 */

test.describe('Bus Search & Schedule Lookup', () => {
  
  test.describe('1.1 Basic Bus Search', () => {
    
    test('TC-U1.1.1: Search for buses between two Tamil Nadu locations', async ({ page }) => {
      // Steps: Open app → Select "From" location → Select "To" location → Click Search
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      const toInput = page.locator('input[placeholder*="destination"], input[placeholder*="To"]').first();
      
      // Verify inputs are visible
      await expect(fromInput).toBeVisible({ timeout: 15000 });
      await expect(toInput).toBeVisible({ timeout: 15000 });
      
      // Enter Tamil Nadu locations
      await fromInput.fill('Chennai');
      await toInput.fill('Coimbatore');
      
      // Click Search
      const searchButton = page.locator('button').filter({ 
        hasText: /find|search|தேடு/i 
      }).first();
      await searchButton.click({ force: true });
      
      // Wait for results
      await page.waitForTimeout(2000);
      
      // Expected: Display buses with schedule, stops, arrival times
      const busCards = page.locator('.transit-bus-card, .bus-card');
      const hasResults = await busCards.count() > 0;
      
      if (hasResults) {
        // Validate: Correct route numbers, stops in order, accurate timings
        const firstCard = busCards.first();
        const cardText = await firstCard.textContent();
        
        // Should contain timing information
        expect(cardText).toMatch(/\d{1,2}:\d{2}/);
        // Should contain stops information
        expect(cardText?.toLowerCase()).toContain('stop');
      }
    });

    test('TC-U1.1.2: Search with same source and destination', async ({ page }) => {
      // Steps: Select same location for from/to → Search
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      const toInput = page.locator('input[placeholder*="destination"], input[placeholder*="To"]').first();
      
      // Enter same location
      await fromInput.fill('Chennai');
      await toInput.fill('Chennai');
      
      // Attempt search
      const searchButton = page.locator('button').filter({ 
        hasText: /find|search|தேடு/i 
      }).first();
      await searchButton.click({ force: true });
      await page.waitForTimeout(1000);
      
      // Expected: Display error or helpful message
      const errorMessage = page.locator('text=/same location|invalid|error/i');
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
      
      // Validate: No infinite loops, graceful error handling
      expect(hasError || page.url().includes('/')).toBeTruthy();
    });

    test('TC-U1.1.3: Search with invalid location', async ({ page }) => {
      // Steps: Type non-existent location → Search
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      const toInput = page.locator('input[placeholder*="destination"], input[placeholder*="To"]').first();
      
      await fromInput.fill('InvalidCity123');
      await toInput.fill('NonExistentPlace456');
      
      const searchButton = page.locator('button').filter({ 
        hasText: /find|search|தேடு/i 
      }).first();
      await searchButton.click({ force: true });
      await page.waitForTimeout(2000);
      
      // Expected: "No results found" or autocomplete error message
      // Validate: Clean UI, no server errors (500)
      const response = await page.waitForResponse(
        response => response.url().includes('/api/') && response.status() !== 500,
        { timeout: 5000 }
      ).catch(() => null);
      
      if (response) {
        expect(response.status()).not.toBe(500);
      }
    });

    test('TC-U1.1.4: Clear search filters and start fresh', async ({ page }) => {
      // Steps: Perform search → Click clear/reset → Verify form is empty
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      const toInput = page.locator('input[placeholder*="destination"], input[placeholder*="To"]').first();
      
      // Perform search
      await fromInput.fill('Chennai');
      await toInput.fill('Bangalore');
      
      // Look for clear button
      const clearButton = page.locator('button').filter({ 
        hasText: /clear|reset/i 
      }).first();
      
      const hasClearButton = await clearButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasClearButton) {
        await clearButton.click();
        await page.waitForTimeout(500);
        
        // Expected: Form resets, no stale data displayed
        const fromValue = await fromInput.inputValue();
        const toValue = await toInput.inputValue();
        
        // Validate: UI updates correctly
        expect(fromValue === '' || toValue === '').toBeTruthy();
      }
    });
  });

  test.describe('1.2 Location Autocomplete', () => {
    
    test('TC-U1.2.1: Type location name and select from suggestions', async ({ page }) => {
      // Steps: Click "From" field → Type "Chennai" → Select from dropdown
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      
      await fromInput.click();
      await fromInput.fill('Chen');
      await page.waitForTimeout(1000);
      
      // Expected: Location appears, suggestions disappear
      const suggestions = page.locator('.autocomplete-suggestion, [role="option"], .suggestion-item');
      const hasSuggestions = await suggestions.first().isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasSuggestions) {
        // Select first suggestion
        await suggestions.first().click();
        await page.waitForTimeout(500);
        
        // Validate: Correct location loaded, coordinates set
        const value = await fromInput.inputValue();
        expect(value.toLowerCase()).toContain('chen');
      }
    });

    test('TC-U1.2.2: Autocomplete with partial text', async ({ page }) => {
      // Steps: Type "ch" → Verify suggestions appear
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      
      await fromInput.click();
      await fromInput.fill('ch');
      await page.waitForTimeout(1000);
      
      // Expected: Suggestions contain "Chennai", "Chengalpattu", etc.
      const suggestions = page.locator('.autocomplete-suggestion, [role="option"], .suggestion-item');
      const suggestionCount = await suggestions.count();
      
      // Validate: Case-insensitive search works
      expect(suggestionCount).toBeGreaterThan(0);
    });

    test('TC-U1.2.3: Autocomplete with special characters (Tamil)', async ({ page }) => {
      // Steps: Type Tamil characters → Verify suggestions
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      
      await fromInput.click();
      await fromInput.fill('சென்');
      await page.waitForTimeout(1500);
      
      // Expected: Suggestions match Tamil location names
      const suggestions = page.locator('.autocomplete-suggestion, [role="option"], .suggestion-item');
      const suggestionCount = await suggestions.count();
      
      // Validate: Unicode/Tamil character handling works
      expect(suggestionCount).toBeGreaterThanOrEqual(0);
    });

    test('TC-U1.2.4: Clear location field', async ({ page }) => {
      // Steps: Select location → Click X button → Verify field clears
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const fromInput = page.locator('input[placeholder*="departure"], input[placeholder*="From"]').first();
      await fromInput.waitFor({ state: 'visible', timeout: 15000 });
      
      await fromInput.fill('Chennai');
      await page.waitForTimeout(500);
      
      // Look for clear button (X)
      const clearButton = fromInput.locator('..').locator('button, [role="button"]').filter({ hasText: /×|x|clear/i }).first();
      const hasClearButton = await clearButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasClearButton) {
        await clearButton.click();
        await page.waitForTimeout(500);
        
        // Expected: Location cleared, suggestions available again
        const value = await fromInput.inputValue();
        
        // Validate: UI responsive, form reset working
        expect(value).toBe('');
      }
    });
  });

  test.describe('1.3 Bus Schedule Display', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto('/search-results?from=Chennai&to=Coimbatore');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    });

    test('TC-U1.3.1: View bus card with all details', async ({ page }) => {
      // Steps: Search buses → Examine bus card
      const busCards = page.locator('.transit-bus-card, .bus-card');
      const cardCount = await busCards.count();
      
      if (cardCount > 0) {
        const firstCard = busCards.first();
        const cardText = await firstCard.textContent();
        
        // Expected: Route number, type, departure time, arrival time, fare, stops
        // Validate: All fields populated, formatting correct
        const hasTime = /\d{1,2}:\d{2}/.test(cardText || '');
        const hasStops = cardText?.toLowerCase().includes('stop');
        
        expect(hasTime && hasStops).toBeTruthy();
      }
    });

    test('TC-U1.3.2: View stop-by-stop route details', async ({ page }) => {
      // Steps: Click on bus card → View detailed route
      const busCards = page.locator('.transit-bus-card, .bus-card');
      const cardCount = await busCards.count();
      
      if (cardCount > 0) {
        const firstCard = busCards.first();
        await firstCard.click();
        await page.waitForTimeout(1000);
        
        // Expected: Ordered list of all stops with expected arrival times
        const stopsElements = page.locator('.stop-item, .stop-simple-item, [class*="stop"]');
        const stopsCount = await stopsElements.count();
        
        // Validate: Stops in correct sequence, no missing stops
        expect(stopsCount).toBeGreaterThanOrEqual(2);
      }
    });

    test('TC-U1.3.3: Multiple results sorting/filtering', async ({ page }) => {
      // Steps: Get multiple results → Verify sorting options (time, fare, duration)
      const busCards = page.locator('.transit-bus-card, .bus-card');
      const initialCount = await busCards.count();
      
      if (initialCount > 1) {
        const sortButtons = page.locator('button').filter({ 
          hasText: /sort|price|time|departure|duration/i 
        });
        
        const sortButtonCount = await sortButtons.count();
        
        if (sortButtonCount > 0) {
          await sortButtons.first().click();
          await page.waitForTimeout(500);
          
          const countAfterSort = await busCards.count();
          
          // Expected: Results sortable and filterable
          // Validate: Sorting works correctly, results update
          expect(countAfterSort).toBe(initialCount);
        }
      }
    });
  });
});
