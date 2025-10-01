// Mobile Layout Checker Script
// Copy and paste this into your browser's console (F12 > Console) to test mobile layout

console.log('🚀 Starting Mobile Layout Check...');
console.log('Make sure you have mobile viewport enabled (375x667 recommended)');

// Function to check if element is visible and properly sized
function checkElement(selector, name, requirements = {}) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.log(`❌ ${name}: Not found (selector: ${selector})`);
    return false;
  }
  
  const element = elements[0];
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  console.log(`✅ ${name}: Found`);
  
  // Check visibility
  if (rect.width === 0 || rect.height === 0 || computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
    console.log(`  ⚠️  Element is not visible`);
    return false;
  }
  
  // Check if element is within viewport
  if (rect.right > window.innerWidth) {
    console.log(`  ⚠️  Element extends beyond viewport (${rect.right}px > ${window.innerWidth}px)`);
  }
  
  // Check touch target size for interactive elements
  if (requirements.touchTarget && (rect.width < 44 || rect.height < 44)) {
    console.log(`  ⚠️  Touch target too small: ${rect.width}x${rect.height}px (should be ≥44px)`);
  }
  
  console.log(`  📏 Size: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px`);
  console.log(`  📍 Position: ${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}`);
  
  return true;
}

// Function to check text content
function checkTextContent(selector, expectedText, name) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.log(`❌ ${name}: Element not found`);
    return false;
  }
  
  const element = elements[0];
  const actualText = element.textContent.trim();
  
  if (actualText.includes(expectedText)) {
    console.log(`✅ ${name}: "${actualText}"`);
    return true;
  } else {
    console.log(`❌ ${name}: Expected "${expectedText}", found "${actualText}"`);
    return false;
  }
}

// Function to check horizontal layout (single-line)
function checkHorizontalLayout(containerSelector, itemSelector, name) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.log(`❌ ${name}: Container not found`);
    return false;
  }
  
  const items = container.querySelectorAll(itemSelector);
  if (items.length < 2) {
    console.log(`✅ ${name}: Only ${items.length} item(s), layout check skipped`);
    return true;
  }
  
  const firstRect = items[0].getBoundingClientRect();
  const lastRect = items[items.length - 1].getBoundingClientRect();
  
  const verticalDifference = Math.abs(firstRect.top - lastRect.top);
  
  if (verticalDifference < 15) {
    console.log(`✅ ${name}: Items are horizontally aligned (${verticalDifference.toFixed(1)}px difference)`);
    return true;
  } else {
    console.log(`❌ ${name}: Items are not horizontally aligned (${verticalDifference.toFixed(1)}px difference)`);
    return false;
  }
}

// Main mobile check function
function runMobileCheck() {
  console.log('\n📱 MOBILE LAYOUT CHECK RESULTS');
  console.log('===============================');
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  // Homepage elements
  console.log('\n🏠 Homepage Elements:');
  
  const homeChecks = [
    { selector: 'header, .header, .app-header', name: 'Header' },
    { selector: 'input[placeholder*="From"], [data-testid="from-location-input"]', name: 'From Input', touchTarget: true },
    { selector: 'input[placeholder*="To"], [data-testid="to-location-input"]', name: 'To Input', touchTarget: true },
    { selector: 'button:has-text("Find Buses"), [data-testid="find-buses-button"], button[type="submit"]', name: 'Search Button', touchTarget: true },
    { selector: '.language-switcher, .language-display', name: 'Language Switcher' }
  ];
  
  homeChecks.forEach(check => {
    totalChecks++;
    if (checkElement(check.selector, check.name, check)) {
      passedChecks++;
    }
  });
  
  // Check if we're on results page
  const busListExists = document.querySelector('.modern-bus-list, .bus-list-container, [data-testid="bus-list"]');
  
  if (busListExists) {
    console.log('\n🚌 Bus List Page Elements:');
    
    const busListChecks = [
      { selector: '.bus-list-header, [data-testid="bus-list-header"]', name: 'Bus List Header' },
      { selector: '.modern-bus-list, .bus-list-container', name: 'Bus List Container' },
      { selector: '.bus-count, [data-testid="bus-count"]', name: 'Bus Count' },
      { selector: '.sort-controls, [data-testid="sort-controls"]', name: 'Sort Controls' },
      { selector: '.search-input input, input[placeholder*="Search"]', name: 'Search Input' },
      { selector: '.filter-toggle, [data-testid="filter-toggle"]', name: 'Filter Toggle', touchTarget: true },
      { selector: '.modern-bus-item, .bus-item, [data-testid="bus-item"]', name: 'Bus Items' }
    ];
    
    busListChecks.forEach(check => {
      totalChecks++;
      if (checkElement(check.selector, check.name, check)) {
        passedChecks++;
      }
    });
    
    // Text content checks
    console.log('\n📝 Text Content Checks:');
    
    totalChecks++;
    if (checkTextContent('h2:has-text("Available Buses"), .list-title', 'Available Buses', 'Title Text')) {
      passedChecks++;
    }
    
    // Sort buttons check
    console.log('\n🔄 Sort Buttons Check:');
    const sortButtons = ['Departure', 'Arrival', 'Duration', 'Price'];
    sortButtons.forEach(buttonText => {
      totalChecks++;
      if (checkElement(`button:contains("${buttonText}"), .sort-btn:contains("${buttonText}")`, `${buttonText} Sort Button`, { touchTarget: true })) {
        passedChecks++;
      }
    });
    
    // Single-line layout check
    console.log('\n📏 Layout Alignment Checks:');
    totalChecks++;
    if (checkHorizontalLayout('.quick-info', '.info-item', 'Bus Info Single-Line Layout')) {
      passedChecks++;
    }
  }
  
  // Viewport overflow check
  console.log('\n📐 Viewport Overflow Check:');
  const bodyWidth = document.body.scrollWidth;
  const viewportWidth = window.innerWidth;
  
  totalChecks++;
  if (bodyWidth <= viewportWidth + 20) { // Allow small margin
    console.log(`✅ No horizontal overflow: Body width ${bodyWidth}px ≤ Viewport ${viewportWidth}px`);
    passedChecks++;
  } else {
    console.log(`❌ Horizontal overflow detected: Body width ${bodyWidth}px > Viewport ${viewportWidth}px`);
  }
  
  // Performance check
  console.log('\n⚡ Performance Check:');
  const performanceEntry = performance.getEntriesByType('navigation')[0];
  if (performanceEntry) {
    const loadTime = performanceEntry.loadEventEnd - performanceEntry.loadEventStart;
    console.log(`📊 Page load time: ${loadTime.toFixed(2)}ms`);
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);
  console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks} checks`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 All mobile layout checks passed!');
  } else {
    console.log('⚠️  Some issues found. Check the details above.');
  }
  
  const percentage = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`📈 Score: ${percentage}%`);
  
  return { passed: passedChecks, total: totalChecks, percentage };
}

// Helper function to simulate search (for testing results page)
function simulateSearch() {
  console.log('🔍 Simulating search to test results page...');
  
  const fromInput = document.querySelector('input[placeholder*="From"], [data-testid="from-location-input"]');
  const toInput = document.querySelector('input[placeholder*="To"], [data-testid="to-location-input"]');
  const searchButton = document.querySelector('button:has-text("Find Buses"), [data-testid="find-buses-button"], button[type="submit"]');
  
  if (fromInput && toInput && searchButton) {
    fromInput.value = 'Chennai';
    fromInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    toInput.value = 'Coimbatore';
    toInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    searchButton.click();
    
    console.log('✅ Search simulated. Wait for results to load, then run runMobileCheck() again.');
  } else {
    console.log('❌ Could not find search elements to simulate search.');
  }
}

// Auto-run check
setTimeout(() => {
  runMobileCheck();
  
  console.log('\n💡 NEXT STEPS:');
  console.log('================');
  console.log('1. If on homepage, run: simulateSearch()');
  console.log('2. After search results load, run: runMobileCheck()');
  console.log('3. To re-run anytime: runMobileCheck()');
  console.log('4. To test different viewport: Resize and run runMobileCheck()');
}, 1000);

// Make functions available globally
window.runMobileCheck = runMobileCheck;
window.simulateSearch = simulateSearch;

console.log('🎯 Mobile testing functions loaded!');
console.log('Available commands:');
console.log('- runMobileCheck() - Check current page layout');
console.log('- simulateSearch() - Fill form and search');