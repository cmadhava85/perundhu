import { vi } from 'vitest';

// Mock environment module before importing
vi.mock('../../utils/environment', () => ({
  getEnv: vi.fn().mockImplementation((key: string) => {
    switch (key) {
      case 'VITE_API_URL':
        return 'http://localhost:8080';
      case 'VITE_FEATURE_OFFLINE_MODE':
        return 'true';
      default:
        return '';
    }
  }),
  getFeatureFlag: vi.fn().mockImplementation((key: string, defaultValue: boolean = false) => {
    if (key === 'VITE_FEATURE_OFFLINE_MODE') return true;
    return defaultValue;
  }),
}));

<<<<<<< HEAD
// Import the API module after mocking environment
// Removed unused import

=======
>>>>>>> 75c2859 (production ready code need to test)
// Skip actual e2e tests when running in CI/CD pipeline
describe('API E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('Skip e2e tests in CI environment', () => {
    // This is just a placeholder test
    expect(true).toBe(true);
  });
});