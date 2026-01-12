# E2E Tests - Quick Start Guide

## Running Tests

### Prerequisites
```bash
# Make sure dev server is running
cd frontend
npm run dev
# Server should be at http://localhost:5173
```

### Basic Commands

```bash
# Run all user journey tests
npx playwright test tests/e2e/user-journey/ --project=chromium --workers=1

# Run specific test file
npx playwright test tests/e2e/user-journey/01-bus-search.spec.ts --project=chromium

# Run tests matching a pattern
npx playwright test tests/e2e/user-journey/ --grep "Basic Bus Search" --project=chromium

# Run specific test by test ID
npx playwright test tests/e2e/user-journey/ --grep "TC-U1.1.1" --project=chromium

# Run with UI mode (interactive)
npx playwright test tests/e2e/user-journey/ --ui

# Run and show HTML report
npx playwright test tests/e2e/user-journey/ --project=chromium --workers=1 && npx playwright show-report

# Debug mode (step through tests)
npx playwright test tests/e2e/user-journey/01-bus-search.spec.ts --debug

# Run on different browsers
npx playwright test tests/e2e/user-journey/ --project=firefox
npx playwright test tests/e2e/user-journey/ --project=webkit
```

## Test Results

### Check Results
```bash
# View last HTML report
npx playwright show-report

# Check test artifacts
ls -la test-results/

# View screenshots of failures
open test-results/*/test-failed-*.png

# View videos
open test-results/*/video.webm
```

## Current Test Status

| Module | Tests | Status | Notes |
|--------|-------|--------|-------|
| Bus Search | 11 | ✅ All Pass | Core functionality |
| Bus Tracking | 6 | ✅ All Pass | Map interactions |
| Authentication | 12 | ⏭️ Skipped | Not implemented yet |
| Contributions | 11 | ⏭️ Auth tests skipped | UI tests pass |
| Reviews | 9 | ⏭️ Auth tests skipped | Display tests pass |
| Settings | 10 | ✅ All Pass | i18n tested |
| Integration | 8 | ✅ All Pass | End-to-end flows |

**Total**: 67 tests (51 passing, 16 skipped)

## Common Issues

### Issue: "Element not found"
**Solution**: 
- Check if dev server is running
- Wait for page to load completely
- Test uses `waitFor({ state: 'visible' })` with 15s timeout

### Issue: "Test timeout"
**Solution**:
- Increase timeout in test: `test.setTimeout(60000)`
- Check for infinite network requests
- Use `domcontentloaded` instead of `networkidle`

### Issue: "Tests fail in parallel"
**Solution**:
- Run with `--workers=1` for consistency
- Tests are designed for sequential execution

### Issue: "Authentication tests skipped"
**Expected**:
- Authentication not implemented yet
- Tests properly skip with descriptive messages
- Will activate when auth is added

## Test File Structure

```
frontend/tests/e2e/user-journey/
├── 01-bus-search.spec.ts          # Search and autocomplete
├── 02-bus-tracking.spec.ts        # Real-time tracking
├── 03-user-authentication.spec.ts # Login/register (skipped)
├── 04-user-contributions.spec.ts  # Route/image contributions
├── 05-reviews-ratings.spec.ts     # Reviews and ratings
├── 06-settings-preferences.spec.ts # Settings and i18n
├── 07-integration-tests.spec.ts   # Cross-module tests
├── README.md                      # Detailed documentation
├── IMPLEMENTATION_SUMMARY.md      # Implementation details
├── TEST_EXECUTION_REPORT.md       # Test results
└── QUICK_START.md                 # This file
```

## Writing New Tests

### Template
```typescript
test('TC-XX.X.X: Test description', async ({ page }) => {
  // Navigate
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // Locate element
  const element = page.locator('selector');
  await element.waitFor({ state: 'visible', timeout: 15000 });
  
  // Interact
  await element.click();
  await element.fill('text');
  
  // Assert
  await expect(element).toBeVisible();
  await expect(element).toHaveText('expected');
});
```

### Best Practices
1. Use descriptive test IDs (TC-U1.1.1 format)
2. Wait for elements explicitly: `waitFor({ state: 'visible' })`
3. Use flexible selectors: `input[placeholder*="departure"], input[placeholder*="From"]`
4. Add timeout for slow operations: `{ timeout: 15000 }`
5. Document expected behavior in comments
6. Use `force: true` for clicks if needed
7. Skip auth-dependent tests with descriptive messages

## Debugging Tips

```bash
# Run single test with debug
npx playwright test tests/e2e/user-journey/01-bus-search.spec.ts --grep "TC-U1.1.1" --debug

# Generate trace
npx playwright test tests/e2e/user-journey/ --trace on

# View trace
npx playwright show-trace trace.zip

# Take screenshots on failure (automatic)
# Screenshots saved to test-results/

# Record video (automatic)
# Videos saved to test-results/

# Check console logs
# Add to test: page.on('console', msg => console.log(msg.text()))
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    cd frontend
    npm run dev &
    sleep 5
    npx playwright test tests/e2e/user-journey/ --project=chromium --workers=1
```

### Required Environment
- Node.js 18+
- Playwright browsers installed
- Dev server running on port 5173
- Clean test database state

## Performance

- **Execution Time**: ~3.5 minutes (single worker)
- **Per Module**: 
  - Bus Search: ~47s
  - Bus Tracking: ~25s
  - Settings: ~30s
  - Integration: ~25s
- **Recommended**: Run with `--workers=1` for consistency

## Maintenance

### Regular Tasks
- [ ] Update selectors if UI changes
- [ ] Add tests for new features
- [ ] Review and update skipped tests when auth is added
- [ ] Check test execution time
- [ ] Review screenshots of failures
- [ ] Update documentation

### Monthly Review
- [ ] Analyze flaky tests
- [ ] Update timeouts if needed
- [ ] Review test coverage
- [ ] Check for outdated assertions
- [ ] Update test data

## Getting Help

- **Test Documentation**: See [README.md](./README.md)
- **Implementation Details**: See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Test Results**: See [TEST_EXECUTION_REPORT.md](./TEST_EXECUTION_REPORT.md)
- **Playwright Docs**: https://playwright.dev/
- **Project Issues**: Check GitHub issues or workspace documentation
