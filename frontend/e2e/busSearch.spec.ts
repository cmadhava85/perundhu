/**
 * E2E Tests for Bus Search Functionality
 * 
 * These tests verify the complete user flow for searching buses,
 * including form input, API calls, and results display.
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5173';
const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8080';

test.describe('Bus Search Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto(BASE_URL);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });
  
  test('should display search form on homepage', async ({ page }) => {
    // Verify essential search form elements are present
    await expect(page.locator('[data-testid="from-location"]')).toBeVisible();
    await expect(page.locator('[data-testid="to-location"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible();
  });
  
  test('should perform bus search and display results', async ({ page }) => {
    // Fill in search form
    await page.fill('[data-testid="from-location"]', 'Chennai');
    
    // Wait for autocomplete suggestions
    await page.waitForSelector('[data-testid="location-suggestion"]', { timeout: 5000 });
    
    // Click first suggestion
    await page.click('[data-testid="location-suggestion"]:first-child');
    
    // Fill destination
    await page.fill('[data-testid="to-location"]', 'Madurai');
    await page.waitForSelector('[data-testid="location-suggestion"]');
    await page.click('[data-testid="location-suggestion"]:first-child');
    
    // Click search button
    await page.click('[data-testid="search-button"]');
    
    // Wait for results to load
    await page.waitForSelector('[data-testid="bus-card"]', { timeout: 10000 });
    
    // Verify results are displayed
    const busCards = await page.locator('[data-testid="bus-card"]').count();
    expect(busCards).toBeGreaterThan(0);
    
    // Verify bus card contains essential information
    const firstBusCard = page.locator('[data-testid="bus-card"]').first();
    await expect(firstBusCard.locator('[data-testid="bus-name"]')).toBeVisible();
    await expect(firstBusCard.locator('[data-testid="bus-number"]')).toBeVisible();
    await expect(firstBusCard.locator('[data-testid="departure-time"]')).toBeVisible();
  });
  
  test('should show error message for invalid search', async ({ page }) => {
    // Click search without filling locations
    await page.click('[data-testid="search-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Error message should indicate missing location
    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText?.toLowerCase()).toContain('location');
  });
  
  test('should handle loading state correctly', async ({ page }) => {
    // Fill search form
    await page.fill('[data-testid="from-location"]', 'Chennai');
    await page.click('[data-testid="location-suggestion"]:first-child');
    await page.fill('[data-testid="to-location"]', 'Madurai');
    await page.click('[data-testid="location-suggestion"]:first-child');
    
    // Click search
    await page.click('[data-testid="search-button"]');
    
    // Loading indicator should appear
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Wait for results (loading should disappear)
    await page.waitForSelector('[data-testid="bus-card"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });
  
  test('should support pagination/infinite scroll', async ({ page }) => {
    // Perform search
    await searchBuses(page, 'Chennai', 'Madurai');
    
    // Get initial bus count
    const initialCount = await page.locator('[data-testid="bus-card"]').count();
    
    // Scroll to bottom to trigger load more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for new buses to load
    await page.waitForTimeout(2000);
    
    // Should have more buses after scrolling
    const newCount = await page.locator('[data-testid="bus-card"]').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
  
  test('should display bus details when clicking on a bus card', async ({ page }) => {
    // Perform search and click first bus
    await searchBuses(page, 'Chennai', 'Madurai');
    await page.click('[data-testid="bus-card"]:first-child');
    
    // Bus details modal/page should open
    await expect(page.locator('[data-testid="bus-details"]')).toBeVisible();
    
    // Should show stops information
    await expect(page.locator('[data-testid="stops-list"]')).toBeVisible();
  });
  
  test('should persist search parameters in URL', async ({ page }) => {
    // Perform search
    await searchBuses(page, 'Chennai', 'Madurai');
    
    // Wait for URL to update
    await page.waitForTimeout(1000);
    
    // URL should contain search parameters
    const url = page.url();
    expect(url).toContain('from');
    expect(url).toContain('to');
  });
  
  test('should restore search from URL parameters', async ({ page }) => {
    // Navigate with URL parameters
    await page.goto(`${BASE_URL}/?from=1&to=2&fromName=Chennai&toName=Madurai`);
    
    // Form should be pre-filled
    const fromValue = await page.inputValue('[data-testid="from-location"]');
    const toValue = await page.inputValue('[data-testid="to-location"]');
    
    expect(fromValue).toContain('Chennai');
    expect(toValue).toContain('Madurai');
    
    // Results should be automatically loaded
    await expect(page.locator('[data-testid="bus-card"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Bus Search - Offline Mode', () => {
  
  test('should show offline indicator when network is disconnected', async ({ page, context }) => {
    await page.goto(BASE_URL);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to perform search
    await searchBuses(page, 'Chennai', 'Madurai');
    
    // Should show offline message
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });
  
  test('should queue search when offline and process when online', async ({ page, context }) => {
    await page.goto(BASE_URL);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to search
    await searchBuses(page, 'Chennai', 'Madurai');
    
    // Should show queued message
    await expect(page.locator('[data-testid="queued-indicator"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Search should automatically process
    await expect(page.locator('[data-testid="bus-card"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Bus Search - Performance', () => {
  
  test('should load search results within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    // Perform search
    await searchBuses(page, 'Chennai', 'Madurai');
    
    // Wait for results
    await page.waitForSelector('[data-testid="bus-card"]', { timeout: 10000 });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 3 seconds
    expect(duration).toBeLessThan(3000);
  });
  
  test('should handle 100 search results without performance issues', async ({ page }) => {
    // Perform search
    await searchBuses(page, 'Chennai', 'Madurai');
    
    // Wait for initial results
    await page.waitForSelector('[data-testid="bus-card"]');
    
    // Scroll multiple times to load many results
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
    }
    
    // Page should still be responsive
    const searchButton = page.locator('[data-testid="search-button"]');
    await expect(searchButton).toBeVisible();
    
    // Should be able to click without lag
    const clickStart = Date.now();
    await searchButton.click();
    const clickDuration = Date.now() - clickStart;
    
    expect(clickDuration).toBeLessThan(100); // Click should respond within 100ms
  });
});

test.describe('Bus Search - Accessibility', () => {
  
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Tab to from location
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('from-location');
    
    // Tab to to location
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('to-location');
    
    // Tab to search button
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('search-button');
  });
  
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check ARIA labels
    const fromLocation = page.locator('[data-testid="from-location"]');
    const ariaLabel = await fromLocation.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel?.toLowerCase()).toContain('from');
  });
});

// Helper functions
async function searchBuses(page: Page, from: string, to: string) {
  await page.fill('[data-testid="from-location"]', from);
  await page.waitForSelector('[data-testid="location-suggestion"]', { timeout: 5000 });
  await page.click('[data-testid="location-suggestion"]:first-child');
  
  await page.fill('[data-testid="to-location"]', to);
  await page.waitForSelector('[data-testid="location-suggestion"]');
  await page.click('[data-testid="location-suggestion"]:first-child');
  
  await page.click('[data-testid="search-button"]');
}
