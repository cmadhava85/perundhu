import { test, expect } from '@playwright/test';

test.describe('Application Connectivity Test', () => {
  test('should connect to the local application', async ({ page }) => {
    // Navigate to our application
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Take a screenshot to see what we get
    await page.screenshot({ 
      path: 'test-results/screenshots/app-homepage.png',
      fullPage: true 
    });
    
    // Log the page title and URL for debugging
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // Check if page loaded successfully (not an error page)
    const bodyText = await page.locator('body').textContent();
    console.log(`Body content preview: ${bodyText?.substring(0, 200)}`);
    
    // Basic checks - the page should have loaded something
    await expect(page.locator('body')).toBeVisible();
    
    // Look for any form elements that might be our search form
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`Found ${inputCount} input elements`);
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`Found ${buttonCount} button elements`);
    
    // If we find inputs, log their attributes
    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const placeholder = await input.getAttribute('placeholder');
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        console.log(`Input ${i}: placeholder="${placeholder}", name="${name}", type="${type}"`);
      }
    }
    
    // If we find buttons, log their text
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        console.log(`Button ${i}: text="${text}"`);
      }
    }
  });

  test('should be able to find search form elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Try different selectors to find search elements
    const selectors = [
      '[data-testid="from-location-input"]',
      'input[placeholder*="From"]',
      'input[name="from"]',
      'input[placeholder*="Location"]',
      'input[type="text"]',
      'input:first-of-type'
    ];
    
    for (const selector of selectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible({ timeout: 2000 });
      console.log(`Selector "${selector}": visible=${isVisible}`);
      
      if (isVisible) {
        const placeholder = await element.getAttribute('placeholder');
        const name = await element.getAttribute('name');
        console.log(`  Found element with placeholder="${placeholder}", name="${name}"`);
      }
    }
  });
});