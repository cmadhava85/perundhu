import { test } from '@playwright/test';

/**
 * Gap Demo — Scene 5 (~10 s recording)
 *
 * Shows: a search with no results → then navigates to Contribute page
 * Voiceover: "But what if a route is missing? That's where you come in."
 *
 * Viewport: 390×844 iPhone 13 Pro (set by playwright.config.video.ts)
 */

test.describe('Video Demo: Gap / Contribute CTA', () => {
  test('record gap and contribute navigation', async ({ page }) => {

    // Start on homepage to show the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Navigate to the Contribute page — shows the "this is where you come in" moment
    await page.goto('/contribute');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);   // hold on contribute page top

    // Scroll down to show the form fields — reinforces the community contribution angle
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(3000);   // hold showing form
  });
});
