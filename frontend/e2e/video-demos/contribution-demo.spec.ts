import { test } from '@playwright/test';

/**
 * Video Demo 3: Contribution Feature
 * Duration: ~25-30 seconds
 * Shows: Search → Bus Details → Contribute Form → Submit
 */

test.describe('Video Demo: Contribution', () => {
  test('record contribution flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 720, height: 1280 });

    // Step 1: Navigate to home and search for buses (0-10s)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Search from KCBT to Madurai
    await page.getByRole('textbox', { name: 'From' }).click();
    await page.getByRole('textbox', { name: 'From' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'From' }).fill('KCBT');
    await page.waitForTimeout(1000);
    await page.getByText('KCBT KILAMBAKKAM').click();
    await page.waitForTimeout(1000);

    await page.getByRole('textbox', { name: 'To' }).click();
    await page.getByRole('textbox', { name: 'To' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'To' }).fill('Madurai - ');
    await page.waitForTimeout(1000);
    await page.getByText('Madurai - Mattuthavani').click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: '🔍 Search Buses' }).click();
    await page.waitForTimeout(3000);

    // Step 2: Click "Show all stops" for first bus (10-12s)
    await page.getByRole('button', { name: 'Show all stops for SETC (9' }).first().click();
    await page.waitForTimeout(3000);
    
    // Wait for the contribution form to appear
    await page.waitForSelector('input[name="busNumber"], [placeholder*="Bus Number"]', { timeout: 10000 }).catch(() => {
      console.log('Contribution form not visible yet, scrolling...');
    });
    
    // Scroll down to see the contribution form
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    // Step 3: Fill contribution form - Bus Number (12-14s)
    await page.getByRole('textbox', { name: '🚌 Bus Number' }).waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('textbox', { name: '🚌 Bus Number' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: '🚌 Bus Number' }).fill('1234');
    await page.waitForTimeout(1000);

    // Step 4: Fill FROM location (14-17s)
    await page.getByRole('textbox', { name: '🟢 From *' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: '🟢 From *' }).fill('KCBT');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: '🚍 KCBT KILAMBAKKAM' }).click();
    await page.waitForTimeout(1000);

    // Step 5: Fill Departure Time (17-19s)
    await page.getByRole('textbox', { name: '🕐 Departure Time *' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: '🕐 Departure Time *' }).fill('00:05');
    await page.waitForTimeout(1000);

    // Step 6: Fill TO location (19-22s)
    await page.getByRole('textbox', { name: '🔴 To *' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: '🔴 To *' }).fill('Madurai - Mat');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: '🚏 Madurai - MattuthavaniBus' }).click();
    await page.waitForTimeout(1000);

    // Step 7: Fill Arrival Time (22-24s)
    await page.getByRole('textbox', { name: '🕐 Arrival Time (optional)' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: '🕐 Arrival Time (optional)' }).fill('07:30');
    await page.waitForTimeout(1000);

    // Step 8: Submit the form (24-26s)
    await page.getByRole('button', { name: '🚌 Submit Route Information →' }).click();
    await page.waitForTimeout(2000);

    // Step 9: Wait for and show confirmation message (26-30s)
    const confirmationSelectors = [
      'text=Thank you',
      'text=Success',
      'text=submitted',
      'text=received',
      '[class*="success"]',
      '[class*="confirmation"]',
      '[role="alert"]'
    ];
    
    // Wait for any confirmation message to appear
    for (const selector of confirmationSelectors) {
      const confirmation = await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (confirmation) {
        console.log(`✅ Confirmation message found: ${selector}`);
        await page.waitForTimeout(3000);
        break;
      }
    }

    // Final pause to show success state
    await page.waitForTimeout(2000);
  });
});

