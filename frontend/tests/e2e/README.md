# End-to-End Testing Suite

This directory contains comprehensive E2E tests for the Perundhu bus search application using Playwright.

## 🎯 Test Coverage

### Core User Journeys
- **Search to Bus List Flow** - Complete user journey from search to results
- **Bus Item Interaction** - Expanding bus details and viewing route information
- **Responsive Design** - All layouts across different device sizes
- **Cross-Browser Compatibility** - Testing across Chromium, Firefox, and Safari

### Specific Test Areas

#### 1. Search to Bus List (`search-to-buslist.spec.ts`)
- ✅ Search page elements visibility
- ✅ Navigation from search to results
- ✅ Bus list page element verification
- ✅ Single-line information display (fixed layout issues)
- ✅ Bus item expansion and route details
- ✅ Sorting functionality (Departure, Arrival, Duration, Price)
- ✅ Search within results
- ✅ Empty results handling

#### 2. Responsive Design (`responsive.spec.ts`)
- ✅ Mobile Portrait (375x667)
- ✅ Mobile Landscape (667x375)
- ✅ Tablet (768x1024)
- ✅ Desktop layouts
- ✅ Single-line bus information on mobile
- ✅ Horizontal scrolling for sort controls
- ✅ Fixed mobile layout issues:
  - "Available Buses" shows correct text (with 's')
  - Bus images fully displayed (not cut off)
  - Price sorting button visible on mobile

#### 3. Cross-Browser (`cross-browser.spec.ts`)
- ✅ Chromium/Chrome compatibility
- ✅ Firefox compatibility  
- ✅ Safari (WebKit) compatibility
- ✅ Microsoft Edge compatibility
- ✅ Touch event handling on mobile browsers
- ✅ Performance consistency across browsers
- ✅ Viewport handling across different browsers

#### 4. Accessibility (`accessibility.spec.ts`)
- ✅ Page titles and meta information
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ ARIA attributes and roles
- ✅ High contrast mode support
- ✅ Text scaling support
- ✅ Focus management
- ✅ Dynamic content announcements

#### 5. Complete Journey (`complete-journey.spec.ts`)
- ✅ End-to-end critical path testing
- ✅ Multi-device journey testing
- ✅ Error handling and edge cases
- ✅ Network failure scenarios
- ✅ Performance measurements
- ✅ Accessibility compliance verification

## 🚀 Getting Started

### Prerequisites
```bash
npm install
# This will install @playwright/test and other dependencies
```

### Install Playwright Browsers
```bash
npx playwright install
```

### Running Tests

#### Run all E2E tests
```bash
npm run test:e2e
```

#### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

#### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

#### Debug tests
```bash
npm run test:e2e:debug
```

#### View test reports
```bash
npm run test:e2e:report
```

### Running Specific Test Files
```bash
# Run only search-to-buslist tests
npx playwright test search-to-buslist

# Run only mobile responsive tests
npx playwright test responsive

# Run only cross-browser tests
npx playwright test cross-browser

# Run only accessibility tests
npx playwright test accessibility
```

### Running Tests on Specific Browsers
```bash
# Chrome only
npx playwright test --project=chromium-desktop

# Firefox only
npx playwright test --project=firefox-desktop

# Safari only
npx playwright test --project=webkit-desktop

# Mobile Chrome
npx playwright test --project=mobile-chrome

# Mobile Safari
npx playwright test --project=mobile-safari
```

## 📱 Device Testing

The test suite automatically tests across multiple devices:

### Desktop
- **1280x720** - Standard desktop
- **1920x1080** - Large desktop

### Tablet
- **768x1024** - iPad size

### Mobile
- **375x667** - iPhone SE (Portrait)
- **667x375** - iPhone SE (Landscape)

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:3000`
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

### Test Data
Common test data is defined in `utils/test-utils.ts`:
- Search queries (Chennai-Coimbatore, Mumbai-Pune, etc.)
- Viewport sizes
- Timeout values

## 📊 Test Reports

After running tests, reports are generated in:
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml`
- **Screenshots**: `test-results/screenshots/`

## 🐛 Key Issues Tested

### Fixed Mobile Layout Issues
1. **Missing 's' in "Available Buses"**
   - ✅ Verified title shows "Available Buses" (not "Available Buse")

2. **Cut-off Bus Images**
   - ✅ Verified bus icons/images are fully displayed
   - ✅ Tested across all mobile viewports

3. **Hidden Price Sorting Button**
   - ✅ Verified Price sort button is visible on mobile
   - ✅ Tested horizontal scrolling for sort controls

### Single-Line Information Display
- ✅ All bus information displays on single horizontal line
- ✅ No text wrapping or multi-line layouts
- ✅ Horizontal scrolling when content exceeds viewport

## 🎨 Page Object Pattern

Tests use the Page Object Model for maintainability:

### `SearchPage.ts`
- Form interactions
- Navigation methods
- Element verification

### `BusListPage.ts`  
- Bus list verification
- Sorting interactions
- Mobile-specific checks
- Single-line layout verification

### `TestUtils.ts`
- Common helper functions
- Performance measurement
- Accessibility checks
- Network simulation

## ⚡ Performance Testing

Tests include performance measurements:
- Page load times
- DOM content loaded timing
- First paint metrics
- Network simulation (slow 3G)

## ♿ Accessibility Testing

Comprehensive accessibility checks:
- Keyboard navigation
- Screen reader support
- ARIA attributes
- Focus management
- High contrast mode
- Text scaling

## 🔄 Continuous Integration

Tests are configured for CI/CD:
- Automatic browser installation
- Parallel execution control
- Retry logic for flaky tests
- Multiple output formats
- Screenshot and video capture

## 📝 Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto();
    
    // Test implementation
    await expect(someElement).toBeVisible();
  });
});
```

### Best Practices
1. Use data-testid attributes for reliable element selection
2. Wait for network idle before assertions
3. Take screenshots for visual verification
4. Test across multiple viewports
5. Include accessibility checks
6. Handle loading states and errors

## 🏃 Quick Commands

```bash
# Development workflow
npm run dev                    # Start dev server
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Interactive test runner

# CI/Production
npm run build                 # Build application
npm run test:e2e:headed       # Run with browser visible
npm run test:e2e:report       # View results

# Debugging
npm run test:e2e:debug        # Debug specific test
npx playwright codegen        # Generate test code
```

## 📋 Test Checklist

Before deploying, ensure all tests pass:

- [ ] ✅ Search functionality works across all browsers
- [ ] ✅ Bus list displays correctly on all devices
- [ ] ✅ Single-line layout maintained on mobile
- [ ] ✅ All sort buttons visible and functional
- [ ] ✅ Bus images display properly (not cut off)
- [ ] ✅ "Available Buses" text displays correctly
- [ ] ✅ Touch interactions work on mobile
- [ ] ✅ Keyboard navigation functional
- [ ] ✅ Loading states handle properly
- [ ] ✅ Error scenarios handled gracefully
- [ ] ✅ Performance within acceptable limits
- [ ] ✅ Accessibility requirements met

---

**Note**: Make sure the development server is running (`npm run dev`) before executing E2E tests, or tests will automatically start the server using the webServer configuration.