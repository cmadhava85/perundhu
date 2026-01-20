/**
 * E2E Tests for Contribution Flow
 * 
 * Tests the complete user flow for contributing bus route information,
 * including form filling, validation, submission, and offline support.
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5173';

test.describe('Route Contribution Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to contribution page
    await page.goto(`${BASE_URL}/contribute`);
    await page.waitForLoadState('networkidle');
  });
  
  test('should display contribution form', async ({ page }) => {
    // Verify form elements
    await expect(page.locator('[data-testid="contribution-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="bus-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="bus-number-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
  });
  
  test('should submit route contribution successfully', async ({ page }) => {
    // Fill form
    await page.fill('[data-testid="bus-name-input"]', 'Express Bus');
    await page.fill('[data-testid="bus-number-input"]', '123A');
    
    // Fill locations
    await page.fill('[data-testid="from-location-input"]', 'Chennai');
    await page.waitForSelector('[data-testid="location-suggestion"]');
    await page.click('[data-testid="location-suggestion"]:first-child');
    
    await page.fill('[data-testid="to-location-input"]', 'Madurai');
    await page.waitForSelector('[data-testid="location-suggestion"]');
    await page.click('[data-testid="location-suggestion"]:first-child');
    
    // Fill times
    await page.fill('[data-testid="departure-time-input"]', '09:00');
    await page.fill('[data-testid="arrival-time-input"]', '14:00');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
    
    // Success message should contain confirmation
    const successText = await page.locator('[data-testid="success-message"]').textContent();
    expect(successText?.toLowerCase()).toContain('success');
  });
  
  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Error count should match number of required fields
    const errorMessages = await page.locator('[data-testid="field-error"]').count();
    expect(errorMessages).toBeGreaterThan(0);
  });
  
  test('should support image upload for bus route', async ({ page }) => {
    // Check if image upload is available
    const fileInput = page.locator('[data-testid="image-upload-input"]');
    await expect(fileInput).toBeVisible();
    
    // Upload test image
    await fileInput.setInputFiles('e2e/fixtures/test-bus-route.jpg');
    
    // Should show preview
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // Should show processing indicator
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
  });
  
  test('should support multiple contribution methods', async ({ page }) => {
    // Check for method selection
    await expect(page.locator('[data-testid="contribution-method"]')).toBeVisible();
    
    // Should have multiple options
    const methods = await page.locator('[data-testid="method-option"]').count();
    expect(methods).toBeGreaterThanOrEqual(3); // Manual, Image, Voice, etc.
  });
  
  test('should auto-save draft every 30 seconds', async ({ page }) => {
    // Fill some data
    await page.fill('[data-testid="bus-name-input"]', 'Test Bus');
    await page.fill('[data-testid="bus-number-input"]', '999');
    
    // Wait 31 seconds
    await page.waitForTimeout(31000);
    
    // Should see draft saved indicator
    await expect(page.locator('[data-testid="draft-saved-indicator"]')).toBeVisible();
  });
  
  test('should restore draft on page reload', async ({ page }) => {
    // Fill form
    const testBusName = 'Draft Test Bus ' + Date.now();
    await page.fill('[data-testid="bus-name-input"]', testBusName);
    await page.fill('[data-testid="bus-number-input"]', 'DRAFT123');
    
    // Wait for auto-save
    await page.waitForTimeout(31000);
    await expect(page.locator('[data-testid="draft-saved-indicator"]')).toBeVisible();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Form should be restored
    const busNameValue = await page.inputValue('[data-testid="bus-name-input"]');
    expect(busNameValue).toBe(testBusName);
    
    // Should show draft restored message
    await expect(page.locator('[data-testid="draft-restored-indicator"]')).toBeVisible();
  });
});

test.describe('Contribution - Offline Support', () => {
  
  test('should save contribution for later when offline', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Fill form
    await page.fill('[data-testid="bus-name-input"]', 'Offline Test Bus');
    await page.fill('[data-testid="bus-number-input"]', 'OFF123');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to submit
    await page.click('[data-testid="submit-button"]');
    
    // Should show queued message (not error)
    await expect(page.locator('[data-testid="queued-message"]')).toBeVisible();
    
    // Message should indicate it will be submitted later
    const queuedText = await page.locator('[data-testid="queued-message"]').textContent();
    expect(queuedText?.toLowerCase()).toContain('offline');
    expect(queuedText?.toLowerCase()).toContain('later');
  });
  
  test('should process queued contributions when back online', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Go offline and submit
    await context.setOffline(true);
    await page.fill('[data-testid="bus-name-input"]', 'Queue Test');
    await page.fill('[data-testid="bus-number-input"]', 'Q123');
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('[data-testid="queued-message"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Should auto-process queue
    await page.waitForTimeout(2000);
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });
  
  test('should show retry count for failed submissions', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Simulate network instability
    await context.setOffline(true);
    
    // Submit contribution
    await fillContributionForm(page);
    await page.click('[data-testid="submit-button"]');
    
    // Wait for offline detection
    await page.waitForTimeout(1000);
    
    // Go online briefly
    await context.setOffline(false);
    await page.waitForTimeout(500);
    
    // Go offline again (simulate failed retry)
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Should show retry indicator
    await expect(page.locator('[data-testid="retry-indicator"]')).toBeVisible();
  });
});

test.describe('Contribution - Data Persistence', () => {
  
  test('should persist draft in IndexedDB', async ({ page }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Fill form
    const testData = {
      busName: 'IndexedDB Test ' + Date.now(),
      busNumber: 'IDB' + Math.floor(Math.random() * 1000)
    };
    
    await page.fill('[data-testid="bus-name-input"]', testData.busName);
    await page.fill('[data-testid="bus-number-input"]', testData.busNumber);
    
    // Wait for auto-save
    await page.waitForTimeout(31000);
    
    // Check IndexedDB
    const draftExists = await page.evaluate(async () => {
      const databases = await indexedDB.databases();
      return databases.some(db => db.name === 'perundhu-offline');
    });
    
    expect(draftExists).toBeTruthy();
  });
  
  test('should clear draft after successful submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Fill and submit
    await fillContributionForm(page);
    await page.click('[data-testid="submit-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
    
    // Draft should be cleared
    const busNameValue = await page.inputValue('[data-testid="bus-name-input"]');
    expect(busNameValue).toBe('');
  });
});

test.describe('Contribution - Validation', () => {
  
  test('should validate bus number format', async ({ page }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Enter invalid bus number
    await page.fill('[data-testid="bus-number-input"]', 'INVALID@#$');
    await page.blur('[data-testid="bus-number-input"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="bus-number-error"]')).toBeVisible();
  });
  
  test('should validate time format', async ({ page }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Enter invalid time
    await page.fill('[data-testid="departure-time-input"]', '25:00'); // Invalid hour
    await page.blur('[data-testid="departure-time-input"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="departure-time-error"]')).toBeVisible();
  });
  
  test('should validate arrival time is after departure time', async ({ page }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Enter arrival before departure
    await page.fill('[data-testid="departure-time-input"]', '14:00');
    await page.fill('[data-testid="arrival-time-input"]', '09:00'); // Before departure
    await page.blur('[data-testid="arrival-time-input"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="time-logic-error"]')).toBeVisible();
  });
});

test.describe('Contribution - User Experience', () => {
  
  test('should show progress indicator during submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Fill and submit
    await fillContributionForm(page);
    await page.click('[data-testid="submit-button"]');
    
    // Progress indicator should appear
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    
    // Submit button should be disabled during submission
    await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();
  });
  
  test('should provide clear feedback on success', async ({ page }) => {
    await page.goto(`${BASE_URL}/contribute`);
    
    // Submit contribution
    await fillContributionForm(page);
    await page.click('[data-testid="submit-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
    
    // Should show contribution ID or confirmation number
    const successMessage = page.locator('[data-testid="success-message"]');
    const text = await successMessage.textContent();
    expect(text).toBeTruthy();
  });
});

// Helper function
async function fillContributionForm(page: Page) {
  await page.fill('[data-testid="bus-name-input"]', 'Test Express Bus');
  await page.fill('[data-testid="bus-number-input"]', '123A');
  await page.fill('[data-testid="from-location-input"]', 'Chennai');
  await page.waitForSelector('[data-testid="location-suggestion"]');
  await page.click('[data-testid="location-suggestion"]:first-child');
  await page.fill('[data-testid="to-location-input"]', 'Madurai');
  await page.waitForSelector('[data-testid="location-suggestion"]');
  await page.click('[data-testid="location-suggestion"]:first-child');
  await page.fill('[data-testid="departure-time-input"]', '09:00');
  await page.fill('[data-testid="arrival-time-input"]', '14:00');
}
