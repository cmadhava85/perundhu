import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Use a single worker so all tests share one dev server instance */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['line']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Global timeout for each action */
    actionTimeout: 10000,
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  /* Run local dev server before tests.
   * stdin redirected to /dev/null prevents Vite reading keyboard shortcuts
   * and getting SIGTTIN (suspended) when spawned by Playwright.
   * reuseExistingServer: false ensures a fresh server is always started,
   * avoiding stale/zombie processes from previous runs.
   */
  webServer: {
    command: 'npm run dev < /dev/null',
    url: 'http://localhost:5173',
    // On CI always start fresh; locally reuse a running dev server if one exists.
    // The `< /dev/null` redirect above prevents Vite from reading stdin (SIGTTIN),
    // which was the root cause of the zombie-server issue.
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  /* Output directories */
  outputDir: 'test-results/',
});