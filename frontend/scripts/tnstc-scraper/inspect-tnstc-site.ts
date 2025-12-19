/**
 * TNSTC Website Inspector
 * 
 * This script opens the TNSTC website and captures:
 * 1. The page structure (HTML elements, forms, selectors)
 * 2. Screenshots at each step
 * 3. Network requests made by the page
 * 
 * Run with: npx ts-node scripts/tnstc-scraper/inspect-tnstc-site.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = './scraped-data/inspection';

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function inspectTNSTCSite(): Promise<void> {
  console.log('🔍 TNSTC Website Inspector');
  console.log('==========================\n');

  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({
    headless: false, // Show browser for inspection
    slowMo: 500,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  // Capture network requests
  const networkRequests: Array<{ url: string; method: string; type: string }> = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType(),
    });
  });

  try {
    // Step 1: Visit homepage
    console.log('1️⃣ Visiting TNSTC homepage...');
    await page.goto('https://www.tnstc.in/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-homepage.png'), fullPage: true });

    // Step 2: Try to access the search page
    console.log('2️⃣ Navigating to search page...');
    await page.goto('https://www.tnstc.in/OTRSOnline/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-otrs-page.png'), fullPage: true });

    // Step 3: Analyze page structure
    console.log('3️⃣ Analyzing page structure...');
    
    const pageAnalysis = await page.evaluate(() => {
      // Find all form elements
      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        id: form.id,
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, select, button')).map(el => ({
          tag: el.tagName,
          type: (el as HTMLInputElement).type || '',
          name: (el as HTMLInputElement).name || '',
          id: el.id,
          class: el.className,
          placeholder: (el as HTMLInputElement).placeholder || '',
        })),
      }));

      // Find all input fields
      const allInputs = Array.from(document.querySelectorAll('input, select')).map(el => ({
        tag: el.tagName,
        type: (el as HTMLInputElement).type || '',
        name: (el as HTMLInputElement).name || '',
        id: el.id,
        class: el.className,
        placeholder: (el as HTMLInputElement).placeholder || '',
      }));

      // Find buttons
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn')).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim() || '',
        id: el.id,
        class: el.className,
        onclick: el.getAttribute('onclick') || '',
      }));

      // Find dropdowns/selects
      const selects = Array.from(document.querySelectorAll('select')).map(select => ({
        id: select.id,
        name: select.name,
        options: Array.from(select.options).slice(0, 20).map(opt => ({
          value: opt.value,
          text: opt.text,
        })),
      }));

      // Find any autocomplete containers
      const autocompletes = Array.from(document.querySelectorAll('[class*="autocomplete"], [class*="suggest"], .ui-autocomplete')).map(el => ({
        class: el.className,
        id: el.id,
        innerHTML: el.innerHTML.substring(0, 500),
      }));

      return {
        title: document.title,
        url: window.location.href,
        forms,
        allInputs,
        buttons,
        selects,
        autocompletes,
        bodyClasses: document.body.className,
      };
    });

    // Save analysis
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'page-analysis.json'),
      JSON.stringify(pageAnalysis, null, 2)
    );
    console.log('   ✅ Page analysis saved');

    // Step 4: Try to interact with source input
    console.log('4️⃣ Looking for source/destination inputs...');
    
    // Check for various possible selectors
    const possibleSourceSelectors = [
      '#srcPlaceName',
      'input[name="srcPlaceName"]',
      '#source',
      'input[name="source"]',
      '#fromPlace',
      'input[placeholder*="source" i]',
      'input[placeholder*="from" i]',
      '.source-input',
    ];

    for (const selector of possibleSourceSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`   ✅ Found source input: ${selector}`);
        await element.click();
        await element.fill('CHENNAI');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '03-after-source-input.png'), fullPage: true });
        break;
      }
    }

    // Step 5: Check for autocomplete suggestions
    console.log('5️⃣ Checking for autocomplete suggestions...');
    const suggestionSelectors = [
      '.ui-autocomplete',
      '.suggestions',
      '.autocomplete-items',
      '[class*="dropdown"]',
      '.search-suggestions',
    ];

    for (const selector of suggestionSelectors) {
      const suggestions = await page.$$(selector);
      if (suggestions.length > 0) {
        console.log(`   ✅ Found suggestions with: ${selector}`);
        const suggestionItems = await page.$$eval(`${selector} li, ${selector} .item, ${selector} div`, 
          items => items.slice(0, 10).map(item => item.textContent?.trim())
        );
        console.log('   Sample suggestions:', suggestionItems);
        break;
      }
    }

    // Step 6: Save network requests
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'network-requests.json'),
      JSON.stringify(networkRequests.filter(r => r.type === 'xhr' || r.type === 'fetch'), null, 2)
    );
    console.log('   ✅ Network requests saved');

    // Step 7: Get the full page HTML for manual inspection
    const pageHtml = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'page-source.html'), pageHtml);
    console.log('   ✅ Page source saved');

    // Keep browser open for manual inspection
    console.log('\n📌 Browser is open for manual inspection.');
    console.log('   Press Ctrl+C to close.\n');
    console.log(`📁 Output saved to: ${OUTPUT_DIR}`);

    // Wait for user to close
    await page.waitForTimeout(60000); // Wait 60 seconds before auto-closing

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'error-state.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

inspectTNSTCSite().catch(console.error);
