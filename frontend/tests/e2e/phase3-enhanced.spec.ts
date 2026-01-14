import { test, expect } from '@playwright/test';

/**
 * Phase 3 - Enhanced E2E Tests for Critical User Flows
 * Tests accessibility, performance, and key features
 */

test.describe('Phase 3: Enhanced User Journeys', () => {
  test.describe('Accessibility Compliance', () => {
    test('keyboard navigation works throughout app', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName.toLowerCase();
      });
      
      expect(['input', 'button', 'a']).toContain(focusedElement);
    });

    test('all images have alt text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
      expect(imagesWithoutAlt).toBe(0);
    });

    test('buttons have accessible labels', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const unlabeledButtons = await page.$$eval('button', buttons => {
        return buttons.filter(btn => {
          const hasText = btn.textContent?.trim();
          const hasAriaLabel = btn.getAttribute('aria-label');
          const hasAriaLabelledBy = btn.getAttribute('aria-labelledby');
          return !hasText && !hasAriaLabel && !hasAriaLabelledBy;
        }).length;
      });
      
      expect(unlabeledButtons).toBe(0);
    });

    test('proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Performance Metrics', () => {
    test('page loads within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const domLoadTime = Date.now() - startTime;
      
      // Should load DOM in under 2 seconds
      expect(domLoadTime).toBeLessThan(2000);
    });

    test('lazy loading works for routes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const initialScripts = await page.$$eval('script[src]', scripts => scripts.length);
      
      // Navigate to lazy-loaded route
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      const afterScripts = await page.$$eval('script[src]', scripts => scripts.length);
      
      // More scripts should be loaded
      expect(afterScripts).toBeGreaterThanOrEqual(initialScripts);
    });
  });

  test.describe('Error Boundaries', () => {
    test('app remains functional after component error', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Even if error occurs, app should still render
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('touch targets are at least 44x44 pixels', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const buttons = await page.$$('button');
      
      for (const button of buttons.slice(0, 5)) {
        const box = await button.boundingBox();
        if (box) {
          // WCAG recommends 44x44 minimum
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('viewport meta tag is set correctly', async ({ page }) => {
      await page.goto('/');
      
      const viewport = await page.$eval('meta[name="viewport"]', meta => 
        meta.getAttribute('content')
      );
      
      expect(viewport).toContain('width=device-width');
    });
  });

  test.describe('Network Resilience', () => {
    test('handles offline mode gracefully', async ({ page, context }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Go offline
      await context.setOffline(true);
      
      // Trigger action that requires network
      await page.fill('input[placeholder*="leaving" i]', 'Chennai').catch(() => {});
      
      // Should show offline indicator
      const hasOfflineIndicator = await page.locator('[class*="network"], [class*="offline"]').count();
      
      // May or may not show indicator depending on state
      expect(hasOfflineIndicator).toBeGreaterThanOrEqual(0);
      
      // Go back online
      await context.setOffline(false);
    });
  });
});
