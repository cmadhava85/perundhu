/**
 * Configuration for E2E tests
 */

// Device viewport dimensions for responsive design testing
export const deviceViewports = {
  mobileSmall: { width: 320, height: 568, name: 'small mobile (320x568)' },
  mobileMedium: { width: 375, height: 667, name: 'medium mobile (375x667)' },
  mobileLarge: { width: 425, height: 812, name: 'large mobile (425x812)' },
  tablet: { width: 768, height: 1024, name: 'tablet (768x1024)' },
  desktop: { width: 1024, height: 768, name: 'desktop (1024x768)' },
  desktopLarge: { width: 1440, height: 900, name: 'large desktop (1440x900)' }
};

// Browser user agents for cross-browser testing
export const browserUserAgents = {
  chromeDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
  firefoxDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0',
  safariDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15',
  edgeDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 Edg/98.0.1108.56',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.101 Mobile Safari/537.36',
  safariIOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1'
};

// Common location settings for testing
export const locationSettings = {
  chennai: { latitude: 13.0827, longitude: 80.2707, accuracy: 10 },
  tambaram: { latitude: 12.9249, longitude: 80.1270, accuracy: 15 },
  guindy: { latitude: 13.0067, longitude: 80.2206, accuracy: 12 },
  tNagar: { latitude: 13.0418, longitude: 80.2341, accuracy: 8 },
  // Waypoints for simulating a moving bus along a route
  movingBus: [
    { latitude: 13.0827, longitude: 80.2707, accuracy: 10 }, // Chennai Central
    { latitude: 13.0731, longitude: 80.2590, accuracy: 12 }, // Waypoint 1
    { latitude: 13.0629, longitude: 80.2473, accuracy: 15 }, // Waypoint 2
    { latitude: 13.0512, longitude: 80.2409, accuracy: 11 }, // Waypoint 3
    { latitude: 13.0418, longitude: 80.2341, accuracy: 8 },  // T Nagar
    { latitude: 13.0306, longitude: 80.2241, accuracy: 14 }, // Waypoint 4
    { latitude: 13.0067, longitude: 80.2206, accuracy: 12 }, // Guindy
    { latitude: 12.9770, longitude: 80.1867, accuracy: 13 }, // Waypoint 5
    { latitude: 12.9490, longitude: 80.1402, accuracy: 10 }, // Waypoint 6
    { latitude: 12.9249, longitude: 80.1270, accuracy: 15 }  // Tambaram
  ]
};

// Simulated network conditions
export const networkConditions = {
  wifi: { offline: false, latency: 5, name: 'WiFi' },
  fastLTE: { offline: false, latency: 50, name: 'Fast LTE' },
  slowLTE: { offline: false, latency: 150, name: 'Slow LTE' },
  regular3G: { offline: false, latency: 300, name: 'Regular 3G' },
  slow3G: { offline: false, latency: 500, name: 'Slow 3G' },
  offline: { offline: true, latency: 0, name: 'Offline' }
};

// Timeout settings for tests
export const timeouts = {
  defaultTimeout: 5000, // 5 seconds
  longRunningTest: 10000, // 10 seconds
  networkRequestTimeout: 15000, // 15 seconds
  animation: 1000, // 1 second
  transition: 500 // 0.5 seconds
};

// Add a simple test to prevent the "empty test suite" error
describe('Config', () => {
  test('has necessary configuration values', () => {
    expect(deviceViewports).toBeDefined();
    expect(browserUserAgents).toBeDefined();
    expect(networkConditions).toBeDefined();
    expect(timeouts).toBeDefined();
    
    // Test specific values
    expect(deviceViewports.mobileSmall.width).toBe(320);
    expect(browserUserAgents.chromeDesktop).toContain('Chrome');
    expect(networkConditions.wifi.latency).toBeLessThan(networkConditions.slow3G.latency);
    expect(timeouts.defaultTimeout).toBeLessThan(timeouts.longRunningTest);
  });
});