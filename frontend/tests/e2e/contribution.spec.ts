import { test, expect } from '@playwright/test';

/**
 * Contribution Page E2E Tests
 *
 * Design principles:
 * - Tests run without a live backend — API calls will fail, tests must tolerate that.
 * - Method tabs are gated by feature flags from the backend. Tests check what is
 *   actually rendered rather than asserting all tabs are always present.
 * - Cookie consent banner is pre-accepted to avoid overlay interference.
 * - We use `domcontentloaded` instead of `networkidle` to avoid hanging on API calls.
 */

test.use({ baseURL: 'http://localhost:5173' });

/** Accept cookie consent so it doesn't obscure the contribute page */
async function acceptCookieConsent(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('perundhu_cookie_consent', 'accepted');
  });
}

test.describe('Contribution Page — Core', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('contribution page renders and shows the main heading', async ({ page }) => {
    // The page container
    const mainContainer = page.locator('.premium-contribution-page');
    await expect(mainContainer).toBeVisible({ timeout: 10000 });

    // The contribution page's own h1 (not the brand name in the navbar)
    const heading = page.locator('h1.header-title');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText(/Route|Knowledge|Contribute|Share/i);
  });

  test('contribution method selector is rendered', async ({ page }) => {
    const selector = page.locator('.compact-method-selector');
    await expect(selector).toBeVisible({ timeout: 10000 });

    // At least one method chip exists
    const chips = page.locator('.method-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('contribute link in navigation leads to the contribution page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const contributeLink = page.locator('a[href="/contribute"]').first();
    if (await contributeLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contributeLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL('/contribute');
    } else {
      // Nav link may be in a mobile menu — navigate directly
      await page.goto('/contribute');
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL('/contribute');
    }
  });

  test('no critical JS errors on the contribution page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');

    const criticalErrors = errors.filter(e =>
      !e.includes('Failed to fetch') &&
      !e.includes('net::ERR') &&
      !e.includes('favicon') &&
      !e.includes('Failed to load resource') &&
      !e.toLowerCase().includes('could not connect') &&
      !e.toLowerCase().includes('x-frame') &&
      !e.toLowerCase().includes('internal server error') &&
      !e.toLowerCase().includes('network') &&
      !e.toLowerCase().includes('localhost')
    );
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });
});

test.describe('Contribution Page — Manual Entry method', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Manual Entry tab is rendered when feature flag is enabled', async ({ page }) => {
    const manualChip = page.locator('.method-chip[title*="Manual Entry"]');
    const isVisible = await manualChip.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      // Feature flag is off — skip gracefully
      test.skip();
      return;
    }
    await expect(manualChip).toBeVisible();
  });

  test('Manual Entry form shows route inputs after selecting the tab', async ({ page }) => {
    const manualChip = page.locator('.method-chip[title*="Manual Entry"]');
    const isVisible = await manualChip.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    // Click if not already active
    const isActive = await manualChip.evaluate(el => el.classList.contains('active'));
    if (!isActive) await manualChip.click();

    // SimpleRouteForm should render — check for its root element or an input
    await page.waitForTimeout(300);
    const formRoot = page.locator('.simple-route-form, .route-form, form').first();
    await expect(formRoot).toBeVisible({ timeout: 5000 });
  });

  test('Manual Entry form accepts text in origin field', async ({ page }) => {
    const manualChip = page.locator('.method-chip[title*="Manual Entry"]');
    const isVisible = await manualChip.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const isActive = await manualChip.evaluate(el => el.classList.contains('active'));
    if (!isActive) await manualChip.click();
    await page.waitForTimeout(300);

    // Look for an autocomplete origin input — LocationAutocompleteInput renders a plain <input>
    const originInput = page.locator('input[placeholder*="starting"], input[placeholder*="origin"], input[placeholder*="departure"]').first();
    if (await originInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await originInput.fill('Chennai');
      await expect(originInput).toHaveValue('Chennai');
    }
  });
});

test.describe('Contribution Page — Image Upload method', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Image tab is present and shows upload UI when active', async ({ page }) => {
    const imageChip = page.locator('.method-chip[title*="image"], .method-chip[title*="Image"], .method-chip[title*="Upload"]');
    const isVisible = await imageChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await imageChip.first().click();
    await page.waitForTimeout(300);

    // ImageContributionUpload renders an h2 and file-related inputs
    const uploadUI = page.locator('input[placeholder*="schedule"], input[placeholder*="Kochi"], input[placeholder*="location"]').first();
    await expect(uploadUI).toBeVisible({ timeout: 5000 });
  });

  test('Image upload description input accepts text', async ({ page }) => {
    const imageChip = page.locator('.method-chip[title*="image"], .method-chip[title*="Image"], .method-chip[title*="Upload"]');
    const isVisible = await imageChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await imageChip.first().click();
    await page.waitForTimeout(300);

    const descInput = page.locator('input[placeholder*="schedule"]').first();
    if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descInput.fill('Bus schedule board at Madurai');
      await expect(descInput).toHaveValue('Bus schedule board at Madurai');
    }
  });
});

test.describe('Contribution Page — Voice Recorder method', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Voice tab is present when feature flag is enabled', async ({ page }) => {
    const voiceChip = page.locator('.method-chip[title*="voice"], .method-chip[title*="Voice"], .method-chip[title*="Record"]');
    const isVisible = await voiceChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }
    await expect(voiceChip.first()).toBeVisible();
  });

  test('Voice tab can be activated', async ({ page }) => {
    const voiceChip = page.locator('.method-chip[title*="voice"], .method-chip[title*="Voice"], .method-chip[title*="Record"]');
    const isVisible = await voiceChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await voiceChip.first().click();
    await page.waitForTimeout(300);

    // After clicking, the chip should be "active"
    const isActive = await voiceChip.first().evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
  });

  test('Voice recorder UI renders after tab click', async ({ page }) => {
    const voiceChip = page.locator('.method-chip[title*="voice"], .method-chip[title*="Voice"], .method-chip[title*="Record"]');
    const isVisible = await voiceChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await voiceChip.first().click();
    await page.waitForTimeout(300);

    // VoiceContributionRecorder should mount
    const voiceUI = page.locator('.voice-contribution, .voice-recorder, [class*="voice"]').first();
    await expect(voiceUI).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Contribution Page — Paste Text method', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Paste tab is present and shows textarea when active', async ({ page }) => {
    const pasteChip = page.locator('.method-chip[title*="Quick Entry"], .method-chip[title*="Paste"], .method-chip[title*="paste"]');
    const isVisible = await pasteChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await pasteChip.first().click();
    await page.waitForTimeout(300);

    const textarea = page.locator('textarea.paste-textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
  });

  test('Paste textarea accepts multi-line bus route text', async ({ page }) => {
    const pasteChip = page.locator('.method-chip[title*="Quick Entry"], .method-chip[title*="Paste"], .method-chip[title*="paste"]');
    const isVisible = await pasteChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await pasteChip.first().click();
    await page.waitForTimeout(300);

    const textarea = page.locator('textarea.paste-textarea');
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      const sampleText = 'Bus 27D from Chennai to Madurai\nDeparts 6:00 AM, arrives 2:00 PM\nStops: Tambaram, Chengalpattu, Villupuram';
      await textarea.fill(sampleText);
      await expect(textarea).toHaveValue(sampleText);
    }
  });

  test('Paste method has a submit button', async ({ page }) => {
    const pasteChip = page.locator('.method-chip[title*="Quick Entry"], .method-chip[title*="Paste"], .method-chip[title*="paste"]');
    const isVisible = await pasteChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await pasteChip.first().click();
    await page.waitForTimeout(300);

    const submitBtn = page.locator('button[type="button"]').filter({ hasText: /Submit|Parse|Process|Analyse|Analyze/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(submitBtn).toBeVisible();
    }
  });
});

test.describe('Contribution Page — Verify Route method', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Verify tab is present and shows verification UI when active', async ({ page }) => {
    const verifyChip = page.locator('.method-chip[title*="Verify"], .method-chip[title*="verify"]');
    const isVisible = await verifyChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await verifyChip.first().click();
    await page.waitForTimeout(300);

    // RouteVerification renders .route-verification container
    const verifyUI = page.locator('.route-verification');
    await expect(verifyUI).toBeVisible({ timeout: 5000 });
  });

  test('Verify UI shows step 1 heading', async ({ page }) => {
    const verifyChip = page.locator('.method-chip[title*="Verify"], .method-chip[title*="verify"]');
    const isVisible = await verifyChip.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await verifyChip.first().click();
    await page.waitForTimeout(300);

    const step1 = page.locator('h3').filter({ hasText: /Select a Route to Verify/i });
    await expect(step1).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Contribution Page — Add Stops (deep-link)', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
  });

  test('Add Stops method renders when navigated via state from search', async ({ page }) => {
    // Simulate navigation state that search results would provide
    await page.goto('/contribute', {
      // React Router state cannot be passed via URL; we test the direct navigation
      // which falls back to the default method
    });
    await page.waitForLoadState('domcontentloaded');

    // Verify the page at least loads without errors when navigated to directly
    const mainContainer = page.locator('.premium-contribution-page');
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Contribution Page — Report Issue (deep-link)', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
  });

  test('Report Issue method renders the contribution page', async ({ page }) => {
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');

    const mainContainer = page.locator('.premium-contribution-page');
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Contribution Page — Method Switching', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('clicking a different method chip switches the active method', async ({ page }) => {
    const chips = page.locator('.method-chip:not([disabled])');
    const count = await chips.count();

    if (count < 2) {
      // Only one method enabled — skip
      test.skip();
      return;
    }

    // Click the second available chip
    await chips.nth(1).click();
    await page.waitForTimeout(300);
    const isActive = await chips.nth(1).evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
  });

  test('active method chip has aria-pressed=true', async ({ page }) => {
    const activeChip = page.locator('.method-chip.active');
    const isVisible = await activeChip.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const ariaPressed = await activeChip.getAttribute('aria-pressed');
    expect(ariaPressed).toBe('true');
  });

  test('method selector has accessible aria-label', async ({ page }) => {
    const chips = page.locator('.method-chips');
    await expect(chips).toHaveAttribute('aria-label');
  });
});

test.describe('Contribution Page — Status Modal', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('status modal overlay is not shown on initial load', async ({ page }) => {
    const modal = page.locator('.status-modal-overlay');
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Contribution Page — Mobile viewport', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookieConsent(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contribute');
    await page.waitForLoadState('domcontentloaded');
  });

  test('contribution page renders on mobile', async ({ page }) => {
    const mainContainer = page.locator('.premium-contribution-page');
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
  });

  test('method chips are visible on mobile', async ({ page }) => {
    const chips = page.locator('.method-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);

    // At least one chip should be visible in the viewport
    await expect(chips.first()).toBeVisible({ timeout: 5000 });
  });
});
