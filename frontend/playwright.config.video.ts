import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for recording demo videos
 * This config is optimized for creating high-quality promotional videos
 */

export default defineConfig({
  testDir: './e2e/video-demos',
  
  // Give enough time for the demos to complete
  timeout: 60000,
  
  // Run tests serially to ensure clean recordings
  fullyParallel: false,
  workers: 1,
  
  // Don't retry - we want a single clean recording
  retries: 0,
  
  // Use a simple reporter
  reporter: [['list']],
  
  use: {
    // Base URL for the app
    baseURL: 'https://perundhu.com',
    
    // VIDEO RECORDING SETTINGS
    video: {
      mode: 'on', // Always record
      size: { width: 390, height: 844 } // True iPhone 13 Pro CSS viewport (triggers mobile layout)
    },
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Slow down actions for better visibility
    actionTimeout: 15000,
    navigationTimeout: 45000,
    
    // Trace recording for debugging
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone 13 Pro'],
        // Use native iPhone 13 Pro viewport (390x844) — triggers mobile CSS breakpoints
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        // Slow down for smooth recording
        launchOptions: {
          slowMo: 50,
        },
      },
    },
  ],

  // Start dev server before running tests
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
