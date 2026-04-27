import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/Perundhu/i);
  });

  test('search inputs are visible on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    const toInput = page.locator('input[placeholder*="destination"]').first();
    await expect(fromInput).toBeVisible({ timeout: 10000 });
    await expect(toInput).toBeVisible({ timeout: 10000 });
  });

  test('home page content section renders below search form', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const homeContent = page.locator('.home-page-content');
    await expect(homeContent).toBeVisible({ timeout: 10000 });
    const howItWorks = page.locator('#how-it-works-heading');
    await expect(howItWorks).toBeVisible();
  });

  test('cookie consent banner appears on first visit', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('perundhu_cookie_consent'));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const acceptBtn = page.locator('button.cookie-consent__btn--accept');
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
  });

  test('cookie consent accept stores preference and hides banner', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('perundhu_cookie_consent'));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const acceptBtn = page.locator('button.cookie-consent__btn--accept');
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();
    await expect(acceptBtn).not.toBeVisible();
    const consent = await page.evaluate(() => localStorage.getItem('perundhu_cookie_consent'));
    expect(consent).toBe('accepted');
  });

  test('cookie consent decline stores preference and hides banner', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('perundhu_cookie_consent'));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const declineBtn = page.locator('button.cookie-consent__btn--decline');
    await expect(declineBtn).toBeVisible({ timeout: 5000 });
    await declineBtn.click();
    await expect(declineBtn).not.toBeVisible();
    const consent = await page.evaluate(() => localStorage.getItem('perundhu_cookie_consent'));
    expect(consent).toBe('declined');
  });

  test('cookie consent banner not shown when already accepted', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('perundhu_cookie_consent', 'accepted'));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const banner = page.locator('.cookie-consent');
    await expect(banner).not.toBeVisible();
  });

  test('mobile viewport renders search inputs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const fromInput = page.locator('input[placeholder*="departure"]').first();
    await expect(fromInput).toBeVisible({ timeout: 10000 });
  });

  test('privacy policy page is not noindexed', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('domcontentloaded');
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => '');
    expect(robotsMeta ?? '').not.toContain('noindex');
  });

  test('terms of service page is not noindexed', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('domcontentloaded');
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => '');
    expect(robotsMeta ?? '').not.toContain('noindex');
  });
});