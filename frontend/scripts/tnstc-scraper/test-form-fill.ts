/**
 * Minimal test script to verify form filling on TNSTC website
 */

import { chromium } from 'playwright';

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🧪 Testing TNSTC form fill...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const page = await browser.newPage();

  try {
    // Go to TNSTC homepage
    console.log('1. Loading TNSTC homepage...');
    await page.goto('https://www.tnstc.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);
    console.log('   ✅ Homepage loaded');

    // Close WhatsApp popup if present
    console.log('2. Closing popup...');
    const popupClose = await page.$('#popup-close');
    if (popupClose) {
      await popupClose.click();
      console.log('   ✅ Popup closed');
      await delay(1000);
    }

    // Navigate to OTRS
    console.log('3. Navigating to OTRS booking page...');
    await page.goto('https://www.tnstc.in/OTRSOnline/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);
    console.log('   ✅ OTRS page loaded');

    // Close popup again if it appears
    const popup2 = await page.$('#popup-close');
    if (popup2) {
      await popup2.click();
      console.log('   ✅ Popup closed again');
      await delay(1000);
    }

    // Wait for form
    console.log('4. Waiting for search form...');
    await page.waitForSelector('#matchStartPlace', { timeout: 10000 });
    console.log('   ✅ Form ready');

    // Take screenshot before
    await page.screenshot({ path: './scraped-data/screenshots/test-before-fill.png' });
    console.log('   📸 Screenshot: test-before-fill.png');

    // Fill source
    console.log('5. Filling source field...');
    const sourceInput = page.locator('#matchStartPlace');
    await sourceInput.click();
    await delay(500);
    
    // Type "CHENNAI" slowly
    console.log('   ⌨️ Typing "CHENNAI"...');
    await sourceInput.pressSequentially('CHENNAI', { delay: 200 });
    
    // Wait for dropdown
    console.log('   ⏳ Waiting 3 seconds for autocomplete dropdown...');
    await delay(3000);
    
    // Screenshot with dropdown
    await page.screenshot({ path: './scraped-data/screenshots/test-source-dropdown.png' });
    console.log('   📸 Screenshot: test-source-dropdown.png');

    // Check if autocomplete is visible (use first one which is for source)
    const autocompleteVisible = await page.locator('.ui-autocomplete').first().isVisible();
    console.log(`   📋 Autocomplete visible: ${autocompleteVisible}`);

    if (autocompleteVisible) {
      // Get all suggestions from the first (visible) autocomplete
      const suggestions = await page.locator('.ui-autocomplete').first().locator('li.ui-menu-item').allTextContents();
      console.log(`   📋 Found ${suggestions.length} suggestions:`, suggestions.slice(0, 5));
      
      // Click first suggestion
      await page.locator('.ui-autocomplete').first().locator('li.ui-menu-item').first().click();
      console.log('   ✅ Selected first suggestion');
      await delay(1000);
    } else {
      // Try keyboard navigation
      console.log('   ⚠️ No dropdown, trying ArrowDown + Enter');
      await page.keyboard.press('ArrowDown');
      await delay(500);
      await page.keyboard.press('Enter');
      await delay(1000);
    }

    // Get the current value of source
    const sourceValue = await sourceInput.inputValue();
    console.log(`   📍 Source value: "${sourceValue}"`);

    // Fill destination
    console.log('6. Filling destination field...');
    const destInput = page.locator('#matchEndPlace');
    await destInput.click();
    await delay(500);
    
    console.log('   ⌨️ Typing "MADURAI"...');
    await destInput.pressSequentially('MADURAI', { delay: 200 });
    
    console.log('   ⏳ Waiting 3 seconds for autocomplete dropdown...');
    await delay(3000);
    
    await page.screenshot({ path: './scraped-data/screenshots/test-dest-dropdown.png' });
    console.log('   📸 Screenshot: test-dest-dropdown.png');

    const destAutocompleteVisible = await page.locator('.ui-autocomplete').first().isVisible();
    console.log(`   📋 Autocomplete visible: ${destAutocompleteVisible}`);

    if (destAutocompleteVisible) {
      const destSuggestions = await page.locator('.ui-autocomplete').first().locator('li.ui-menu-item').allTextContents();
      console.log(`   📋 Found ${destSuggestions.length} suggestions:`, destSuggestions.slice(0, 5));
      
      await page.locator('.ui-autocomplete').first().locator('li.ui-menu-item').first().click();
      console.log('   ✅ Selected first suggestion');
      await delay(1000);
    } else {
      console.log('   ⚠️ No dropdown, trying ArrowDown + Enter');
      await page.keyboard.press('ArrowDown');
      await delay(500);
      await page.keyboard.press('Enter');
      await delay(1000);
    }

    const destValue = await destInput.inputValue();
    console.log(`   📍 Destination value: "${destValue}"`);

    // Take final screenshot
    await page.screenshot({ path: './scraped-data/screenshots/test-after-fill.png' });
    console.log('   📸 Screenshot: test-after-fill.png');

    console.log('\n✅ Test complete! Check the screenshots.');
    console.log('   Press Ctrl+C to close the browser.\n');

    // Keep browser open for 30 seconds for manual inspection
    await delay(30000);

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: './scraped-data/screenshots/test-error.png' });
  } finally {
    await browser.close();
  }
}

main();
