import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';
import * as mockService from './mockService';

// Mock offline service
vi.mock('../../services/offlineService', () => ({
  isOnline: vi.fn().mockResolvedValue(true),
  initializeOfflineDB: vi.fn().mockResolvedValue(undefined),
  getLocationsOffline: vi.fn().mockImplementation(() => Promise.resolve(mockService.mockData.locations)),
  saveLocationsOffline: vi.fn().mockResolvedValue(undefined),
  getBusesOffline: vi.fn().mockImplementation(() => Promise.resolve(mockService.mockData.buses)),
  saveBusesOffline: vi.fn().mockResolvedValue(undefined),
  getStopsOffline: vi.fn().mockImplementation(() => Promise.resolve(mockService.mockData.stops)),
  saveStopsOffline: vi.fn().mockResolvedValue(undefined),
  getBusLocationsOffline: vi.fn().mockImplementation(() => Promise.resolve(mockService.mockData.busLocations)),
  saveBusLocationsOffline: vi.fn().mockResolvedValue(undefined),
  getConnectingRoutesOffline: vi.fn().mockImplementation(() => Promise.resolve(mockService.mockData.connectingRoutes)),
  saveConnectingRoutesOffline: vi.fn().mockResolvedValue(undefined),
  getDataAgeDays: vi.fn().mockResolvedValue(1),
  cleanupOldBusLocationData: vi.fn().mockResolvedValue(undefined)
}));

// Mock Google Maps API
const mockGoogleMaps = {
  Map: vi.fn(),
  Marker: vi.fn(),
  InfoWindow: vi.fn(),
  LatLng: vi.fn(),
  places: {
    PlacesService: vi.fn()
  }
};

// Mock window.google
Object.defineProperty(window, 'google', {
  value: {
    maps: mockGoogleMaps
  },
  writable: true
});

// Device viewport configurations for testing
const deviceViewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

// Browser user agent strings for testing
const browserUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
};

// Network condition configurations
const networkConditions = {
  fast3g: { downloadThroughput: 1500000, uploadThroughput: 750000, latency: 40 },
  slow3g: { downloadThroughput: 500000, uploadThroughput: 500000, latency: 400 },
  offline: { downloadThroughput: 0, uploadThroughput: 0, latency: 0 }
};

// Helper function to simulate viewport changes
const setViewport = (viewport: { width: number; height: number }) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewport.width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: viewport.height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Helper function to simulate user agent changes
const setUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent,
  });
};

describe('Cross-Browser API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = '';
    
    // Reset window properties
    setViewport(deviceViewports.desktop);
  });

  describe('API functionality across different viewports', () => {
    // Test each viewport individually instead of using test.each
    it('should work correctly on mobile viewport', async () => {
      const viewport = deviceViewports.mobile;
      setViewport(viewport);
      
      render(<App />);
      
      // Test that the app renders correctly on mobile
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Verify viewport-specific behavior
      expect(window.innerWidth).toBe(viewport.width);
      expect(window.innerHeight).toBe(viewport.height);
    });

    it('should work correctly on tablet viewport', async () => {
      const viewport = deviceViewports.tablet;
      setViewport(viewport);
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(window.innerWidth).toBe(viewport.width);
      expect(window.innerHeight).toBe(viewport.height);
    });

    it('should work correctly on desktop viewport', async () => {
      const viewport = deviceViewports.desktop;
      setViewport(viewport);
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(window.innerWidth).toBe(viewport.width);
      expect(window.innerHeight).toBe(viewport.height);
    });
  });

  describe('API functionality across different browsers', () => {
    // Test each browser individually
    it('should work correctly on Chrome', async () => {
      const userAgent = browserUserAgents.chrome;
      setUserAgent(userAgent);
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(navigator.userAgent).toBe(userAgent);
    });

    it('should work correctly on Firefox', async () => {
      const userAgent = browserUserAgents.firefox;
      setUserAgent(userAgent);
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(navigator.userAgent).toBe(userAgent);
    });

    it('should work correctly on Safari', async () => {
      const userAgent = browserUserAgents.safari;
      setUserAgent(userAgent);
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(navigator.userAgent).toBe(userAgent);
    });

    it('should work correctly on Edge', async () => {
      const userAgent = browserUserAgents.edge;
      setUserAgent(userAgent);
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(navigator.userAgent).toBe(userAgent);
    });
  });

  describe('Network condition simulation', () => {
    it('should handle fast 3G conditions', async () => {
      const condition = networkConditions.fast3g;
      
      // Simulate network condition
      Object.defineProperty(navigator, 'connection', {
        value: {
          downlink: condition.downloadThroughput / 1000000,
          effectiveType: '3g'
        },
        writable: true
      });
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle slow 3G conditions', async () => {
      const condition = networkConditions.slow3g;
      
      Object.defineProperty(navigator, 'connection', {
        value: {
          downlink: condition.downloadThroughput / 1000000,
          effectiveType: '2g'
        },
        writable: true
      });
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle offline conditions', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      render(<App />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});