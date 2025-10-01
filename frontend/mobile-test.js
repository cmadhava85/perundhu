import { chromium } from 'playwright';

/**
 * Quick Mobile Test Script
 * Tests the app in mobile mode and takes screenshots
 */
async function testMobileMode() {
  console.log('🚀 Starting mobile test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'mobile-test-homepage.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: mobile-test-homepage.png');
    
    // Check main elements on homepage
    console.log('🔍 Checking homepage elements...');
    
    const elementsToCheck = [
      { name: 'Header', selector: 'header, .header, .app-header' },
      { name: 'From Input', selector: 'input[placeholder*="From"], [data-testid="from-location-input"]' },
      { name: 'To Input', selector: 'input[placeholder*="To"], [data-testid="to-location-input"]' },
      { name: 'Search Button', selector: 'button:has-text("Find Buses"), [data-testid="find-buses-button"]' },
      { name: 'Language Switcher', selector: '.language-switcher, .language-display' }
    ];
    
    for (const element of elementsToCheck) {
      const isVisible = await page.locator(element.selector).first().isVisible({ timeout: 2000 });
      console.log(`${isVisible ? '✅' : '❌'} ${element.name}: ${isVisible ? 'Visible' : 'Not visible'}`);
    }
    
    // Test search functionality
    console.log('🔍 Testing search functionality...');
    
    const fromInput = page.locator('input[placeholder*="From"], [data-testid="from-location-input"]').first();
    const toInput = page.locator('input[placeholder*="To"], [data-testid="to-location-input"]').first();
    const searchButton = page.locator('button:has-text("Find Buses"), [data-testid="find-buses-button"]').first();
    
    if (await fromInput.isVisible()) {
      await fromInput.fill('Chennai');
      console.log('✅ From location filled');
    }
    
    if (await toInput.isVisible()) {
      await toInput.fill('Coimbatore');
      console.log('✅ To location filled');
    }
    
    if (await searchButton.isVisible()) {
      await searchButton.click();
      console.log('✅ Search button clicked');
      
      // Wait for navigation or results
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Take screenshot of results page
      await page.screenshot({ 
        path: 'mobile-test-results.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: mobile-test-results.png');
      
      // Check bus list elements
      console.log('🔍 Checking bus list elements...');
      
      const busListElements = [
        { name: 'Bus List Container', selector: '.modern-bus-list, .bus-list-container, [data-testid="bus-list"]' },
        { name: 'Bus List Header', selector: '.bus-list-header, [data-testid="bus-list-header"]' },
        { name: 'Available Buses Title', selector: 'h2:has-text("Available Buses"), .list-title' },
        { name: 'Bus Count', selector: '.bus-count, [data-testid="bus-count"]' },
        { name: 'Sort Controls', selector: '.sort-controls, [data-testid="sort-controls"]' },
        { name: 'Search Input', selector: '.search-input input, input[placeholder*="Search"]' },
        { name: 'Filter Toggle', selector: '.filter-toggle, [data-testid="filter-toggle"]' },
        { name: 'Bus Items', selector: '.modern-bus-item, .bus-item, [data-testid="bus-item"]' }
      ];
      
      for (const element of busListElements) {
        const isVisible = await page.locator(element.selector).first().isVisible({ timeout: 2000 });
        console.log(`${isVisible ? '✅' : '❌'} ${element.name}: ${isVisible ? 'Visible' : 'Not visible'}`);
      }
      
      // Check specific mobile fixes
      console.log('🔍 Checking mobile-specific fixes...');
      
      // 1. Check "Available Buses" text has 's'
      const titleElement = page.locator('h2:has-text("Available Buses"), .list-title').first();
      if (await titleElement.isVisible()) {
        const titleText = await titleElement.textContent();
        const hasCorrectText = titleText && titleText.includes('Available Buses');
        console.log(`${hasCorrectText ? '✅' : '❌'} "Available Buses" text: ${titleText}`);
      }
      
      // 2. Check sort buttons are visible (especially Price)
      const sortButtons = ['Departure', 'Arrival', 'Duration', 'Price'];
      for (const buttonText of sortButtons) {
        const button = page.locator(`button:has-text("${buttonText}"), .sort-btn:has-text("${buttonText}")`).first();
        const isVisible = await button.isVisible({ timeout: 1000 });
        console.log(`${isVisible ? '✅' : '❌'} ${buttonText} sort button: ${isVisible ? 'Visible' : 'Not visible'}`);
      }
      
      // 3. Check bus items have single-line layout
      const busItems = page.locator('.modern-bus-item, .bus-item').first();
      if (await busItems.isVisible()) {
        const quickInfo = busItems.locator('.quick-info').first();
        if (await quickInfo.isVisible()) {
          console.log('✅ Bus item quick info is visible');
          
          // Check if info items are horizontally aligned
          const infoItems = busItems.locator('.info-item');
          const itemCount = await infoItems.count();
          if (itemCount > 1) {
            const firstBox = await infoItems.first().boundingBox();
            const lastBox = await infoItems.last().boundingBox();
            
            if (firstBox && lastBox) {
              const verticalDiff = Math.abs(firstBox.y - lastBox.y);
              const isHorizontal = verticalDiff < 15;
              console.log(`${isHorizontal ? '✅' : '❌'} Single-line layout: ${isHorizontal ? 'Properly aligned' : 'Items may be wrapping'}`);
            }
          }
        }
      }
      
      // Check for horizontal overflow issues
      console.log('🔍 Checking for layout issues...');
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = 375;
      const hasOverflow = bodyWidth > viewportWidth + 20; // Allow small margin
      
      console.log(`${hasOverflow ? '❌' : '✅'} Horizontal overflow: ${hasOverflow ? `Body width (${bodyWidth}px) exceeds viewport (${viewportWidth}px)` : 'No overflow detected'}`);
      
      // Test scrolling behavior
      console.log('🔍 Testing scroll behavior...');
      
      const sortControls = page.locator('.sort-controls').first();
      if (await sortControls.isVisible()) {
        await sortControls.scrollIntoViewIfNeeded();
        const overflowX = await sortControls.evaluate((el) => window.getComputedStyle(el).overflowX);
        console.log(`✅ Sort controls overflow-x: ${overflowX}`);
      }
    }
    
    console.log('✅ Mobile test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during mobile test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMobileMode().catch(console.error);