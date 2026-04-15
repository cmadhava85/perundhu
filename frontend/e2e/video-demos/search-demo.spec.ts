import { test } from '@playwright/test';

/**
 * Search Walkthrough — single ~35 s recording split into 3 scenes:
 *
 *   Scene 2  offset=0   duration=12.1 s  Homepage + typing
 *   Scene 3  offset=12  duration=10.8 s  Search results + scroll
 *   Scene 4  offset=23  duration=10.1 s  Stops expanded
 *
 * Viewport: 390×844 iPhone 13 Pro (set by playwright.config.video.ts)
 */

test.describe('Video Demo: Search Walkthrough', () => {
  test('record full search walkthrough for scenes 2-4', async ({ page }) => {

    // ── SCENE 2 ZONE  (0 – 12 s) ────────────────────────────────────────────
    // Show homepage loading
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);                       // ~3.5 s elapsed

    // Type FROM
    const from = page.getByRole('textbox', { name: /from|origin|departure/i }).first();
    await from.click();
    await page.waitForTimeout(300);
    await from.fill('KCBT');
    await page.waitForTimeout(1200);
    await page.getByText('KCBT KILAMBAKKAM').first().click();
    await page.waitForTimeout(800);                        // ~6.5 s elapsed

    // Type TO
    const to = page.getByRole('textbox', { name: /to|destination/i }).first();
    await to.click();
    await page.waitForTimeout(300);
    await to.fill('Mattuthavani');
    await page.waitForTimeout(1200);
    await page.getByText(/Mattuthavani/i).first().click();
    await page.waitForTimeout(800);                        // ~9.5 s elapsed

    // Pause at end of scene 2 zone — viewer sees filled form
    await page.waitForTimeout(2500);                       // ~12 s elapsed

    // ── SCENE 3 ZONE  (12 – 23 s) ───────────────────────────────────────────
    // Click Search — results load
    await page.getByRole('button', { name: /Search Buses/i }).click();
    await page.waitForTimeout(3500);                       // ~15.8 s elapsed

    // Scroll slowly through results
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1500);                       // ~17.3 s
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1500);                       // ~18.8 s
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1500);                       // ~20.3 s

    // Pause at end of scene 3 zone
    await page.waitForTimeout(2700);                       // ~23 s elapsed

    // ── SCENE 4 ZONE  (23 – 34 s) ───────────────────────────────────────────
    // Expand stops on first visible bus
    await page.evaluate(() => window.scrollTo(0, 500));
    const stopButton = page.getByRole('button', { name: /show.*stops|view.*stops/i }).first();
    const hasStopBtn = await stopButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasStopBtn) {
      await stopButton.click();
    }
    await page.waitForTimeout(2000);                       // ~25.3 s

    // Scroll down to reveal the stop list
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(2000);                       // ~27.3 s
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(3000);                       // ~30.3 s

    // Hold on stops view to close out scene 4
    await page.waitForTimeout(4000);                       // ~34 s elapsed
  });
});


