# End-to-End Testing Suite

**DEAD SIMPLE** E2E tests for Perundhu - just the essentials!

## 🎯 Test Coverage

Only **3 test files** with **10 total tests**:

1. **smoke.spec.ts** - Basic page load tests (3 tests)
2. **app-connectivity.spec.ts** - Connection tests (2 tests)  
3. **simple.spec.ts** - Input interaction tests (4 tests)

**Total: ~20 tests** (Chromium + Mobile = 10 tests × 2 = 20 tests)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Build Your App First
```bash
npm run build
```

## 📝 Running Tests

### **Easy Way (Recommended)**
```bash
# Just run this - it handles everything!
./run-e2e.sh
```

### **Manual Way** 
```bash
# 1. Start dev server in one terminal
npm run dev

# 2. In another terminal, run tests
npx playwright test
```

### **Other Options**
```bash
# Run with interactive UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npx playwright test --headed

# Debug tests step-by-step
npx playwright test --debug

# Run only smoke tests
./run-e2e.sh smoke.spec.ts
```

## 🌐 Browser Configuration

**Desktop**: Chromium (1280x720)  
**Mobile**: iPhone 12 viewport

Want to test Safari? Uncomment the webkit project in `playwright.config.ts`

## ⚙️ Configuration

- **Base URL**: `http://localhost:5173` (dev server - auto detects)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: On failure

**Note**: Tests now use dev server (port 5173) instead of preview server. Much more reliable!

## 🎨 Page Object Pattern

Tests use Page Object Model for maintainability:
- `SearchPage.ts` - Search form interactions
- `HomePage.ts` - Homepage elements
- `UserJourneyPage.ts` - Complete user flows

## 📊 Test Reports

Reports are generated in:
- **HTML Report**: `playwright-report/index.html`
- **Screenshots**: `test-results/screenshots/`

## 🔧 Troubleshooting - USE THIS!
```bash
# The foolproof way
./run-e2e.sh
```

### Port already in use
```bash
# Kill the process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Manual testing
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests (wait 5 seconds first!)
npx playwright test smoke.spec.ts --project=chromiumlled
```bash
npx playwright install
```

## 📋 Before Deploying

- ✅ All smoke tests pass
- ✅ Search functionality works
- ✅ Mobile viewport renders correctly
- ✅ No console errors

---

**Pro tip**: Run `npm run test:e2e:ui` for the best debugging experience!
