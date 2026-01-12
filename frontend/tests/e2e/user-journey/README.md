# User Journey E2E Tests

Comprehensive end-to-end tests for the Perundhu application based on the manual test cases documentation.

## 📁 Test Structure

```
tests/e2e/user-journey/
├── 01-bus-search.spec.ts           # Bus Search & Schedule Lookup
├── 02-bus-tracking.spec.ts         # Real-Time Bus Tracking
├── 03-user-authentication.spec.ts  # User Registration, Login & Profile
├── 04-user-contributions.spec.ts   # Route, Image & Voice Contributions
├── 05-reviews-ratings.spec.ts      # Reviews & Ratings System
├── 06-settings-preferences.spec.ts # Settings, Theme, Language
└── 07-integration-tests.spec.ts    # Cross-Module Integration Tests
```

## 🎯 Test Coverage

### Module 1: Bus Search & Schedule (01-bus-search.spec.ts)
- ✅ Basic bus search between Tamil Nadu locations
- ✅ Search validation (same source/destination, invalid locations)
- ✅ Location autocomplete with Tamil support
- ✅ Bus schedule display with all details
- ✅ Stop-by-stop route details
- ✅ Sorting and filtering results

### Module 2: Bus Tracking (02-bus-tracking.spec.ts)
- ✅ Live bus position on map
- ✅ Handling offline buses gracefully
- ✅ Map zoom and pan functionality
- ✅ Next stops display with ETAs
- ✅ Route visualization with polylines
- ✅ Stop markers on route

### Module 3: User Authentication (03-user-authentication.spec.ts)
- ✅ User registration with validation
- ✅ Login with correct/incorrect credentials
- ✅ Profile viewing and editing
- ✅ Password change functionality
- ✅ Logout and session management
- ✅ Remember me functionality

### Module 4: User Contributions (04-user-contributions.spec.ts)
- ✅ Manual route contribution
- ✅ Adding stops to routes
- ✅ Image contributions
- ✅ Voice/OCR contributions
- ✅ Contribution status tracking (PENDING/APPROVED/REJECTED)
- ✅ Viewing contribution details and feedback

### Module 5: Reviews & Ratings (05-reviews-ratings.spec.ts)
- ✅ Submitting reviews with ratings and comments
- ✅ Viewing all reviews for a bus
- ✅ Filtering reviews by rating
- ✅ Review helpfulness voting
- ✅ Editing and deleting own reviews

### Module 6: Settings & Preferences (06-settings-preferences.spec.ts)
- ✅ Language switching (English ↔ Tamil)
- ✅ Tamil keyboard input support
- ✅ Theme selection (Light/Dark mode)
- ✅ Theme persistence across sessions
- ✅ Notification settings
- ✅ Settings reset to default

### Module 7: Integration Tests (07-integration-tests.spec.ts)
- ✅ End-to-end contribution flow (submit → approve → search)
- ✅ Review visibility across modules
- ✅ Search to tracking complete flow
- ✅ Authentication state persistence
- ✅ Notification system integration
- ✅ Mobile responsiveness
- ✅ Performance and load testing
- ✅ Error recovery

## 🚀 Running Tests

### Run all user journey tests
```bash
npm run test:e2e -- tests/e2e/user-journey/
```

### Run specific module tests
```bash
# Bus Search tests
npm run test:e2e -- tests/e2e/user-journey/01-bus-search.spec.ts

# Bus Tracking tests
npm run test:e2e -- tests/e2e/user-journey/02-bus-tracking.spec.ts

# Authentication tests
npm run test:e2e -- tests/e2e/user-journey/03-user-authentication.spec.ts

# Contributions tests
npm run test:e2e -- tests/e2e/user-journey/04-user-contributions.spec.ts

# Reviews tests
npm run test:e2e -- tests/e2e/user-journey/05-reviews-ratings.spec.ts

# Settings tests
npm run test:e2e -- tests/e2e/user-journey/06-settings-preferences.spec.ts

# Integration tests
npm run test:e2e -- tests/e2e/user-journey/07-integration-tests.spec.ts
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui -- tests/e2e/user-journey/
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed -- tests/e2e/user-journey/
```

### Debug specific test
```bash
npm run test:e2e:debug -- tests/e2e/user-journey/01-bus-search.spec.ts
```

### Run on specific browser
```bash
# Chromium only
npm run test:e2e:chromium -- tests/e2e/user-journey/

# Mobile viewport
npm run test:e2e:mobile -- tests/e2e/user-journey/
```

## 📊 Viewing Test Reports

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

The report will show:
- ✅ Passed tests
- ❌ Failed tests
- ⏭️ Skipped tests
- 📸 Screenshots of failures
- 🎥 Video recordings (on failure)
- 📊 Test execution timeline

## 🔧 Test Configuration

Tests are configured to:
- **Retry**: 2 times on CI, 0 locally
- **Timeout**: 30 seconds per test
- **Action Timeout**: 10 seconds per action
- **Navigation Timeout**: 30 seconds
- **Screenshots**: Taken on failure
- **Videos**: Recorded on failure
- **Trace**: Collected on first retry

## 🧪 Test Credentials

The tests use test credentials:
```
Email: test@perundhu.com
Password: testpassword
```

⚠️ **Note**: Ensure these test credentials exist in your test database or update the credentials in the test files.

## 📝 Test IDs Reference

Each test corresponds to a Test Case ID from the manual test documentation:

| Test ID | Description | File |
|---------|-------------|------|
| TC-U1.1.1 | Search buses between Tamil Nadu locations | 01-bus-search.spec.ts |
| TC-U1.1.2 | Search with same source/destination | 01-bus-search.spec.ts |
| TC-U1.2.1 | Location autocomplete | 01-bus-search.spec.ts |
| TC-U2.1.1 | View live bus position | 02-bus-tracking.spec.ts |
| TC-U2.1.2 | Bus not running (offline) | 02-bus-tracking.spec.ts |
| TC-U3.1.1 | Register with valid credentials | 03-user-authentication.spec.ts |
| TC-U3.2.1 | Login with correct credentials | 03-user-authentication.spec.ts |
| TC-U4.1.1 | Submit new bus route manually | 04-user-contributions.spec.ts |
| TC-U5.1.1 | Leave review with rating | 05-reviews-ratings.spec.ts |
| TC-U9.1.1 | Switch language to Tamil | 06-settings-preferences.spec.ts |

## 🔍 Debugging Failed Tests

When a test fails:

1. **Check screenshots**: Look in `test-results/` directory
2. **Watch video**: Video recordings show the entire test execution
3. **View trace**: Use Playwright trace viewer for detailed debugging
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```
4. **Run in headed mode**: See the browser while test runs
   ```bash
   npm run test:e2e:headed -- tests/e2e/user-journey/01-bus-search.spec.ts
   ```
5. **Use debug mode**: Step through the test
   ```bash
   npm run test:e2e:debug -- tests/e2e/user-journey/01-bus-search.spec.ts
   ```

## 🎯 Best Practices

1. **Run tests locally** before pushing to CI
2. **Keep tests independent** - each test should work in isolation
3. **Use meaningful assertions** - tests should validate actual behavior
4. **Handle async properly** - wait for elements and state changes
5. **Clean up after tests** - especially for user-created data
6. **Update tests** when UI/features change

## 🔄 CI/CD Integration

Tests automatically run on:
- Pull requests
- Main branch commits
- Scheduled nightly runs

See `.github/workflows/` for CI configuration.

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Manual Test Cases](../../../MANUAL_TEST_CASES_COMPREHENSIVE.md)
- [Test Writing Guide](https://playwright.dev/docs/writing-tests)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Add test IDs matching manual test cases
3. Include descriptive test names
4. Add comments explaining complex logic
5. Update this README with new test coverage

## 📞 Support

For issues with tests:
1. Check test output and error messages
2. Review screenshots and videos
3. Consult the manual test cases document
4. Ask in team chat or create an issue

---

**Last Updated**: January 11, 2026
**Test Count**: 50+ user journey tests
**Coverage**: All major user features and integration flows
