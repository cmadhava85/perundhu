import { test } from '@playwright/test';

/**
 * Video Demo 3: Contribution Feature
 * Duration: ~25-30 seconds
 * Shows: Navigate to Contribute page → Fill form → Submit → Confirmation modal
 *
 * Form uses SimpleRouteForm with IDs:
 *   #busNumber, #origin, #departureTime, #destination, #arrivalTime
 *   submit button: "Share this Bus Route"
 */

test.describe('Video Demo: Contribution', () => {
  test('record contribution flow', async ({ page }) => {
    // Viewport comes from playwright.config.video.ts (390x844 — true iPhone 13 Pro)

    // Mock reCAPTCHA enterprise so the form submits without real CAPTCHA verification
    await page.addInitScript(() => {
      Object.defineProperty(window, 'grecaptcha', {
        writable: true,
        configurable: true,
        value: {
          enterprise: {
            ready: (cb: () => void) => cb(),
            execute: (_key: string, _opts: object) => Promise.resolve('demo-token'),
          },
        },
      });
    });

    // Mock the contributions API so the demo always shows a success modal
    await page.route('**/v1/contributions/routes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'demo-' + Date.now(), status: 'accepted' }),
      });
    });

    // Go directly to Contribute page — skip homepage to avoid layout flash on first load
    await page.goto('/contribute');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1800);   // let page fully settle in mobile layout

    // Step 1: Fill Bus Number
    await page.locator('#busNumber').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#busNumber').click();
    await page.waitForTimeout(400);
    await page.locator('#busNumber').fill('TN 71');
    await page.waitForTimeout(1200);   // pause — let viewer read

    // Step 2: Fill FROM / Origin location
    const fromInput = page.locator('#origin');
    await fromInput.waitFor({ state: 'visible', timeout: 10000 });
    await fromInput.click();
    await page.waitForTimeout(400);
    await fromInput.fill('KCBT');
    await page.locator('ul li button').filter({ hasText: /KCBT/i }).first()
      .waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await page.locator('ul li button').filter({ hasText: /KCBT/i }).first().click();
    await page.waitForTimeout(1000);

    // Step 3: Fill Departure Time
    await page.locator('#departureTime').fill('06:30');
    await page.waitForTimeout(1000);

    // Step 4: Fill TO / Destination location
    const toInput = page.locator('#destination');
    await toInput.waitFor({ state: 'visible', timeout: 10000 });
    await toInput.click();
    await page.waitForTimeout(400);
    await toInput.fill('Madurai');
    await page.locator('ul li button').filter({ hasText: /Mattuthavani/i }).first()
      .waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await page.locator('ul li button').filter({ hasText: /Mattuthavani/i }).first().click();
    await page.waitForTimeout(1000);

    // Step 5: Fill Arrival Time
    await page.locator('#arrivalTime').fill('11:30');
    await page.waitForTimeout(1000);

    // Step 6: Scroll to submit button and click
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    const submitBtn = page.getByRole('button', { name: /Share this Bus Route/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await submitBtn.click();

    // Step 7: Wait for success modal, then hold so viewer can read it
    await page.locator('.status-modal.success').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(5000);   // hold on confirmation — end recording here
  });
});


