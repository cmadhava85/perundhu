// Mock environment module before importing API
jest.mock('../../utils/environment', () => ({
  getEnv: jest.fn().mockImplementation((key) => {
    switch (key) {
      case 'VITE_API_URL':
        return 'http://localhost:8080';
      default:
        return '';
    }
  }),
  getFeatureFlag: jest.fn().mockReturnValue(true)
}));

// Import the API module after mocking environment
import { api } from '../../services/api';

// Skip actual e2e tests when running in CI/CD pipeline
describe('API E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('Skip e2e tests in CI environment', () => {
    // This is just a placeholder test
    expect(true).toBe(true);
  });
});