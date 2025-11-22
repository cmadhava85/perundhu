# E2E Test Configuration - Updated

## Summary of Changes

The E2E test configuration has been updated to work correctly with the current project setup.

### Key Changes Made

1. **Playwright Configuration** (`frontend/playwright.config.ts`)
   - Changed `baseURL` from `http://localhost:5174` to `http://localhost:4173`
   - Enabled `webServer` configuration to auto-start preview server
   - Uses `npx vite preview --port 4173` for consistent port usage
   - `reuseExistingServer` set to `!process.env.CI` (reuses locally, fresh in CI)

2. **Environment File Fix** (`frontend/.env.production`)
   - Removed `NODE_ENV=production` line (not supported by Vite)
   - Added comment explaining NODE_ENV is automatically set by Vite

3. **GitHub Actions Workflow** (`.github/workflows/e2e-tests.yml`)
   - Already correctly configured to:
     - Build the app with `npm run build`
     - Start preview server with `npm run preview`
     - Wait for server on port 4173
     - Run tests against the built application

## How It Works

### Local Development
```bash
cd frontend

# Build the app (required before preview)
npm run build

# Run E2E tests - Playwright will automatically:
# 1. Start the preview server on port 4173
# 2. Wait for it to be ready
# 3. Run the tests
# 4. Shut down the server when done
npx playwright test

# Or run specific tests
npx playwright test tests/e2e/smoke.spec.ts --project=chromium-desktop
```

### CI/CD (GitHub Actions)
The workflow automatically:
1. Installs dependencies
2. Builds the application
3. Starts preview server in background
4. Waits for server to be ready
5. Runs E2E tests across multiple browsers
6. Uploads test results and reports

## Port Configuration

| Environment | Server Command | Port | URL |
|-------------|---------------|------|-----|
| Development | `npm run dev` | 5173* | http://localhost:5173 |
| E2E Testing | `npm run preview` | 4173 | http://localhost:4173 |
| CI/CD | `npm run preview` | 4173 | http://localhost:4173 |

*Port 5173 may auto-increment if occupied (5174, 5175, etc.)

## Test Execution

### Run All Tests
```bash
npm run build && npx playwright test
```

### Run Specific Browser
```bash
npx playwright test --project=chromium-desktop
npx playwright test --project=firefox-desktop  
npx playwright test --project=webkit-desktop
```

### Run Mobile Tests
```bash
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
```

### Debug Mode
```bash
npx playwright test --debug
npx playwright test --headed  # See browser
```

### View Test Report
```bash
npx playwright show-report
```

## GitHub Actions Secrets Required

To enable the full CI/CD pipeline, add these secrets to your GitHub repository:

1. **GCP_SA_KEY** - Service account JSON key
   - Location: `/Users/mchand69/Downloads/astute-strategy-406601-83852e13a75a.json`
   - Go to: Repository Settings → Secrets and variables → Actions → New repository secret
   - Name: `GCP_SA_KEY`
   - Value: Entire content of the JSON file

2. **Database Credentials** (if needed for full integration tests)
   - `STAGING_DB_URL`
   - `STAGING_DB_USER`
   - `STAGING_DB_PASSWORD`
   - `PRODUCTION_DB_URL`
   - `PRODUCTION_DB_USER`
   - `PRODUCTION_DB_PASSWORD`

## Workflow Status

The E2E tests will run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches
- Runs tests across Chromium, Firefox, and WebKit
- Separate job for mobile tests (Chrome & Safari)

## Next Steps

1. **Enable GitHub Actions**
   - Workflows are ready but may need to be enabled in repository settings
   - Go to Actions tab → Enable workflows if prompted

2. **Add Secrets**
   - Add `GCP_SA_KEY` to GitHub secrets
   - Add database credentials if needed

3. **Test the Pipeline**
   - Create a test branch
   - Make a small change
   - Create a pull request
   - Verify E2E tests run successfully

4. **Production Deployment**
   - Create a production environment in GitHub with protection rules
   - Add production database credentials
   - Create a release tag (e.g., `v1.0.0`) to trigger production deployment

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4173
lsof -ti:4173 | xargs kill -9
```

### Clean Stuck Processes
```bash
# Kill all preview server processes
pkill -f "vite preview"
pkill -f "npm run preview"
```

### Rebuild App
```bash
cd frontend
rm -rf dist
npm run build
```

### Clear Playwright Cache
```bash
cd frontend
rm -rf test-results playwright-report
npx playwright install
```

## Configuration Files

- **Playwright Config**: `frontend/playwright.config.ts`
- **E2E Tests**: `frontend/tests/e2e/*.spec.ts`
- **Page Objects**: `frontend/tests/e2e/pages/*.ts`
- **CI Workflow**: `.github/workflows/e2e-tests.yml`
- **Environment**: `frontend/.env.production`

## Test Coverage

Current E2E test suites:
- ✅ Smoke tests (basic functionality)
- ✅ Search to bus list flow
- ✅ Accessibility tests
- ✅ Cross-browser compatibility
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Complete user journeys
- ✅ Comprehensive user flows
- ✅ Working E2E tests

Total: ~62 test cases across multiple browsers and devices
