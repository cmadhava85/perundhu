// 🔍 Debug Tool for Page Refresh Issue
// Copy and paste this into the browser console to debug refresh issues

console.log('🔍 Starting Debug Tool for Page Refresh Issue');

// 1. Monitor HMR/Vite pings
let viteRequests = 0;
let totalRequests = 0;
const startTime = Date.now();

// Override fetch to monitor requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  totalRequests++;
  const url = args[0];
  
  if (typeof url === 'string') {
    if (url.includes('/_vite/ping')) {
      viteRequests++;
      console.log(`🔄 Vite ping #${viteRequests} at ${new Date().toLocaleTimeString()}`);
      
      if (viteRequests > 10) {
        console.warn('⚠️ EXCESSIVE VITE PINGS DETECTED! This indicates refresh issues.');
      }
    }
    
    if (url.includes('nominatim') || url.includes('geocod')) {
      console.log(`🌍 Geocoding request: ${url}`);
    }
  }
  
  return originalFetch.apply(this, args);
};

// 2. Monitor React re-renders
let renderCount = 0;
const componentRenders = new Map();

// Hook into React DevTools if available
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  
  hook.onCommitFiberRoot = (id, root, priorityLevel) => {
    renderCount++;
    console.log(`⚛️ React render #${renderCount} at ${new Date().toLocaleTimeString()}`);
    
    if (renderCount > 50) {
      console.warn('⚠️ EXCESSIVE REACT RENDERS! Component may be in infinite loop.');
    }
  };
}

// 3. Monitor DOM mutations
const mutationObserver = new MutationObserver((mutations) => {
  const significantMutations = mutations.filter(m => 
    m.type === 'childList' && 
    m.addedNodes.length > 0 &&
    Array.from(m.addedNodes).some(n => n.nodeType === 1) // Element nodes only
  );
  
  if (significantMutations.length > 5) {
    console.warn(`⚠️ High DOM mutation activity: ${significantMutations.length} significant changes`);
  }
});

mutationObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false
});

// 4. Monitor focus changes (input disruption)
let focusChanges = 0;
let lastFocusedElement = null;

document.addEventListener('focusin', (e) => {
  focusChanges++;
  const element = e.target;
  console.log(`👁️ Focus changed to: ${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''}`);
  lastFocusedElement = element;
});

document.addEventListener('focusout', (e) => {
  console.log(`👁️ Focus lost from: ${e.target.tagName}${e.target.id ? '#' + e.target.id : ''}`);
});

// 5. Monitor console errors
const originalError = console.error;
const originalWarn = console.warn;
let errorCount = 0;
let warnCount = 0;

console.error = function(...args) {
  errorCount++;
  console.log(`🚨 Console Error #${errorCount}:`, ...args);
  originalError.apply(this, args);
};

console.warn = function(...args) {
  warnCount++;
  if (!args[0]?.includes?.('deprecated')) { // Ignore deprecation warnings
    console.log(`⚠️ Console Warning #${warnCount}:`, ...args);
  }
  originalWarn.apply(this, args);
};

// 6. Test location autocomplete specifically
function testLocationAutocomplete() {
  console.log('🧪 Testing Location Autocomplete...');
  
  const locationInputs = document.querySelectorAll('input[placeholder*="location" i], input[name*="location" i], input[id*="location" i]');
  
  if (locationInputs.length === 0) {
    console.log('❌ No location input fields found');
    return;
  }
  
  locationInputs.forEach((input, index) => {
    console.log(`📍 Found location input #${index + 1}:`, input);
    
    // Test typing
    input.focus();
    input.value = '';
    
    // Simulate typing "Arup"
    setTimeout(() => {
      input.value = 'A';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 100);
    
    setTimeout(() => {
      input.value = 'Ar';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 200);
    
    setTimeout(() => {
      input.value = 'Aru';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, 300);
    
    setTimeout(() => {
      input.value = 'Arup';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Completed typing "Arup" - check for suggestions');
    }, 400);
  });
}

// 7. Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    if (entry.duration > 100) { // Log slow operations
      console.log(`⏰ Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
    }
  });
});

performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });

// 8. Status reporting function
function getDebugStatus() {
  const uptime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n📊 DEBUG STATUS REPORT');
  console.log('========================');
  console.log(`⏱️ Uptime: ${uptime}s`);
  console.log(`🔄 Vite pings: ${viteRequests}`);
  console.log(`🌐 Total requests: ${totalRequests}`);
  console.log(`⚛️ React renders: ${renderCount}`);
  console.log(`👁️ Focus changes: ${focusChanges}`);
  console.log(`🚨 Errors: ${errorCount}`);
  console.log(`⚠️ Warnings: ${warnCount}`);
  
  // Evaluate status
  if (viteRequests > 20) {
    console.log('🔴 HIGH VITE PING COUNT - Indicates refresh issues');
  } else if (viteRequests > 10) {
    console.log('🟡 MODERATE VITE PINGS - Monitor for issues');
  } else {
    console.log('🟢 NORMAL VITE PING COUNT');
  }
  
  if (renderCount > 100) {
    console.log('🔴 EXCESSIVE RENDERS - Component re-render loop likely');
  } else if (renderCount > 50) {
    console.log('🟡 HIGH RENDER COUNT - Monitor components');
  } else {
    console.log('🟢 NORMAL RENDER COUNT');
  }
}

// 9. Auto-status reporting
setInterval(getDebugStatus, 30000); // Every 30 seconds

// 10. Exposed functions
window.debugRefresh = {
  testAutocomplete: testLocationAutocomplete,
  getStatus: getDebugStatus,
  reset: () => {
    viteRequests = 0;
    totalRequests = 0;
    renderCount = 0;
    focusChanges = 0;
    errorCount = 0;
    warnCount = 0;
    console.log('🔄 Debug counters reset');
  }
};

console.log('\n🎯 DEBUG TOOL READY!');
console.log('Available commands:');
console.log('- debugRefresh.testAutocomplete() - Test location input');
console.log('- debugRefresh.getStatus() - Get current status');
console.log('- debugRefresh.reset() - Reset all counters');
console.log('\n👀 Now monitoring for refresh issues...');

// Initial status
setTimeout(getDebugStatus, 2000);