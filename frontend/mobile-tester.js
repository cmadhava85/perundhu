const puppeteer = require('puppeteer');

async function runMobileTesting() {
  console.log('🚀 Starting automated mobile testing...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Set mobile viewport (iPhone SE)
    await page.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    
    console.log('📱 Set mobile viewport: 375x667');
    
    // Navigate to the app
    console.log('🌐 Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'mobile-homepage.png', fullPage: true });
    console.log('📸 Screenshot saved: mobile-homepage.png');
    
    // Analyze homepage layout
    console.log('\n🔍 Analyzing homepage layout...');
    const homepageIssues = await analyzeHomepage(page);
    
    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    await testSearchFlow(page);
    
    // Take results screenshot
    await page.screenshot({ path: 'mobile-results.png', fullPage: true });
    console.log('📸 Screenshot saved: mobile-results.png');
    
    // Analyze results page layout
    console.log('\n🔍 Analyzing results page layout...');
    const resultsIssues = await analyzeResultsPage(page);
    
    // Report all issues
    console.log('\n📊 MOBILE TESTING REPORT');
    console.log('=========================');
    
    const allIssues = [...homepageIssues, ...resultsIssues];
    
    if (allIssues.length === 0) {
      console.log('✅ No mobile layout issues found!');
    } else {
      console.log(`❌ Found ${allIssues.length} issues:`);
      allIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    return allIssues;
    
  } catch (error) {
    console.error('❌ Error during mobile testing:', error);
    return [`Testing failed: ${error.message}`];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function analyzeHomepage(page) {
  const issues = [];
  
  // Check viewport width
  const viewportWidth = await page.viewport().width;
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  
  if (bodyWidth > viewportWidth + 20) {
    issues.push(`Horizontal overflow on homepage: ${bodyWidth}px > ${viewportWidth}px`);
  }
  
  // Check essential elements
  const elements = [
    { name: 'Header', selector: 'header, .header, .app-header' },
    { name: 'From Input', selector: 'input[placeholder*="From"], [data-testid="from-location-input"]' },
    { name: 'To Input', selector: 'input[placeholder*="To"], [data-testid="to-location-input"]' },
    { name: 'Search Button', selector: 'button:has-text("Find Buses"), [data-testid="find-buses-button"], button[type="submit"]' },
  ];
  
  for (const element of elements) {
    try {
      const elementHandle = await page.$(element.selector);
      if (!elementHandle) {
        issues.push(`${element.name} not found on homepage`);
        continue;
      }
      
      const box = await elementHandle.boundingBox();
      if (!box) {
        issues.push(`${element.name} not visible on homepage`);
        continue;
      }
      
      // Check if element extends beyond viewport
      if (box.x + box.width > viewportWidth) {
        issues.push(`${element.name} extends beyond viewport: ${box.x + box.width}px > ${viewportWidth}px`);
      }
      
      // Check touch target size for interactive elements
      if (element.name.includes('Input') || element.name.includes('Button')) {
        if (box.height < 44) {
          issues.push(`${element.name} touch target too small: ${box.height}px (should be ≥44px)`);
        }
      }
      
    } catch (error) {
      issues.push(`Error checking ${element.name}: ${error.message}`);
    }
  }
  
  return issues;
}

async function testSearchFlow(page) {
  // Fill search form
  try {
    const fromInput = await page.$('input[placeholder*="From"], [data-testid="from-location-input"]');
    if (fromInput) {
      await fromInput.type('Chennai');
      console.log('✅ Filled "From" field');
    }
    
    const toInput = await page.$('input[placeholder*="To"], [data-testid="to-location-input"]');
    if (toInput) {
      await toInput.type('Coimbatore');
      console.log('✅ Filled "To" field');
    }
    
    const searchButton = await page.$('button:has-text("Find Buses"), [data-testid="find-buses-button"], button[type="submit"]');
    if (searchButton) {
      await searchButton.click();
      console.log('✅ Clicked search button');
      
      // Wait for navigation/results
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      console.log('✅ Navigated to results page');
    }
    
  } catch (error) {
    console.log(`⚠️ Search flow issue: ${error.message}`);
  }
}

async function analyzeResultsPage(page) {
  const issues = [];
  
  // Check if we're on results page
  const busListExists = await page.$('.modern-bus-list, .bus-list-container, [data-testid="bus-list"]');
  if (!busListExists) {
    issues.push('Bus list container not found on results page');
    return issues;
  }
  
  // Check viewport width
  const viewportWidth = await page.viewport().width;
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  
  if (bodyWidth > viewportWidth + 20) {
    issues.push(`Horizontal overflow on results page: ${bodyWidth}px > ${viewportWidth}px`);
  }
  
  // Check "Available Buses" title
  try {
    const titleElement = await page.$('h2:has-text("Available Buses"), .list-title');
    if (titleElement) {
      const titleText = await page.evaluate(el => el.textContent, titleElement);
      if (!titleText.includes('Available Buses') || titleText.trim() === 'Available Buse') {
        issues.push(`Title text incomplete: "${titleText}" (should be "Available Buses")`);
      }
    } else {
      issues.push('Available Buses title not found');
    }
  } catch (error) {
    issues.push(`Error checking title: ${error.message}`);
  }
  
  // Check sort buttons
  const sortButtons = ['Departure', 'Arrival', 'Duration', 'Price'];
  for (const buttonText of sortButtons) {
    try {
      const button = await page.$(`button:contains("${buttonText}"), .sort-btn:contains("${buttonText}")`);
      if (!button) {
        issues.push(`${buttonText} sort button not found`);
        continue;
      }
      
      const box = await button.boundingBox();
      if (!box) {
        issues.push(`${buttonText} sort button not visible`);
        continue;
      }
      
      if (box.x + box.width > viewportWidth) {
        issues.push(`${buttonText} sort button extends beyond viewport`);
      }
      
    } catch (error) {
      issues.push(`Error checking ${buttonText} button: ${error.message}`);
    }
  }
  
  // Check bus items single-line layout
  try {
    const busItems = await page.$$('.modern-bus-item, .bus-item');
    if (busItems.length > 0) {
      const firstBus = busItems[0];
      const quickInfo = await firstBus.$('.quick-info');
      
      if (quickInfo) {
        const infoItems = await quickInfo.$$('.info-item');
        if (infoItems.length > 1) {
          const firstBox = await infoItems[0].boundingBox();
          const lastBox = await infoItems[infoItems.length - 1].boundingBox();
          
          if (firstBox && lastBox) {
            const verticalDiff = Math.abs(firstBox.y - lastBox.y);
            if (verticalDiff > 15) {
              issues.push(`Bus info items not aligned horizontally: ${verticalDiff}px difference`);
            }
          }
        }
      }
    }
  } catch (error) {
    issues.push(`Error checking bus item layout: ${error.message}`);
  }
  
  return issues;
}

// Run the mobile testing
if (require.main === module) {
  runMobileTesting()
    .then(issues => {
      console.log('\n🎯 Testing completed');
      process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runMobileTesting };