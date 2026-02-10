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

    // Step 1: Navigate to home page (0-2s)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Type FROM location (2-6s)
    await page.getByRole('textbox', { name: 'From' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: 'From' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'From' }).fill('KCBT');
    await page.waitForTimeout(1000); // Wait for autocomplete to appear
    await page.getByText('KCBT KILAMBAKKAM').click();
    await page.waitForTimeout(1000);

    // Step 3: Type TO location (6-10s)
    await page.getByRole('textbox', { name: 'To' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: 'To' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'To' }).fill('Madurai - ');
    await page.waitForTimeout(1000); // Wait for autocomplete to appear
    await page.getByText('Madurai - Mattuthavani').click();
    await page.waitForTimeout(1000);

    // Step 4: Click search button (10-12s)
    await page.getByRole('button', { name: '🔍 Search Buses' }).click();
    await page.waitForTimeout(3000); // Wait for results to load

    // Step 5: Scroll through results (12-16s)
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1500);

    // Step 6: Click on first bus to show stops (16-20s)
    await page.getByRole('button', { name: 'Show all stops for SETC (9' }).first().click();
    await page.waitForTimeout(2000);

    // Step 7: Scroll through stops (20-24s)
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(1500);

    // Final pause to show the complete view
    await page.waitForTimeout(2000);
  });
});

