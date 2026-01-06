import { chromium } from 'playwright';

async function testDropdown() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const TNSTC_URL = 'https://www.tnstc.in/OTRSOnline/';
    
    console.log('🚀 Opening TNSTC website...');
    await page.goto(TNSTC_URL);
    await page.waitForTimeout(2000);

    console.log('🔒 Closing popup...');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      document.querySelectorAll('[role="dialog"], [class*="modal"]').forEach((p: Element) => {
        p.style.display = 'none';
      });
    }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log('\n⌨️  Testing from field with dropdown...');
    const fromField = page.locator('input[placeholder="From Place"]').first();
    await fromField.focus();
    await page.waitForTimeout(300);
    
    console.log('  Typing CHENNAI...');
    await fromField.type('CHENNAI', { delay: 100 });
    await page.waitForTimeout(2000);

    console.log('\n🔍 Looking for dropdown...');
    // Check different dropdown selectors
    const selectors = [
      'ul[role="listbox"]',
      'ul[id^="ui-id"]',
      '.ui-autocomplete',
      '[role="listbox"]',
      '[class*="autocomplete"]'
    ];

    for (const sel of selectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        console.log(`  ✅ Found ${sel}: ${count} elements`);
      }
    }

    console.log('\n📋 Dropdown options:');
    const allLis = await page.locator('li').all();
    console.log(`  Found ${allLis.length} <li> elements total`);
    
    // Get visible LI elements
    let optionCount = 0;
    for (const li of allLis) {
      try {
        const isVisible = await li.isVisible();
        if (isVisible) {
          const text = await li.textContent();
          optionCount++;
          console.log(`  Option ${optionCount}: ${text?.substring(0, 40)}`);
          if (optionCount >= 10) break;
        }
      } catch (_e) {
        // Skip
      }
    }

    if (optionCount === 0) {
      console.log('  ⚠️  No visible dropdown options found');
      console.log('  Checking page structure...');
      const divOptions = await page.locator('[role="option"]').count();
      console.log(`  Found ${divOptions} elements with role="option"`);
    }

    console.log('\n🎯 Trying to select option programmatically...');
    // Get dropdown options
    const options = await page.locator('li').filter({ hasText: /CHENNAI/ }).all();
    console.log(`  Found ${options.length} options containing "CHENNAI"`);
    
    if (options.length > 0) {
      console.log(`  Clicking first matching option...`);
      await options[0].click();
      await page.waitForTimeout(1000);
      
      const value = await fromField.inputValue();
      console.log(`  Field value after selection: "${value}"`);
    }

    console.log('\n✅ Test complete');
  } catch (_e) {
    console.error('❌ Error:', e);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testDropdown().catch(console.error);
