import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock the environment module before importing featureFlags
const mockGetEnv = vi.fn();

vi.mock('../../utils/environment', () => ({
  getEnv: (key: string) => mockGetEnv(key)
}));

describe('Feature Flags', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetEnv.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('enableAddStops flag', () => {
    it('is enabled by default when env var is not set', async () => {
      mockGetEnv.mockImplementation((key: string) => {
        if (key === 'VITE_ENABLE_ADD_STOPS') return undefined;
        return undefined;
      });

      const { featureFlags } = await import('../../config/featureFlags');
      expect(featureFlags.enableAddStops).toBe(true);
    });

    it('is disabled when env var is explicitly set to false', async () => {
      mockGetEnv.mockImplementation((key: string) => {
        if (key === 'VITE_ENABLE_ADD_STOPS') return 'false';
        return undefined;
      });

      // Force re-import
      vi.resetModules();
      const { featureFlags } = await import('../../config/featureFlags');
      expect(featureFlags.enableAddStops).toBe(false);
    });
  });

  describe('enableRouteVerification flag', () => {
    it('is enabled by default when env var is not set', async () => {
      mockGetEnv.mockImplementation((key: string) => {
        if (key === 'VITE_ENABLE_ROUTE_VERIFICATION') return undefined;
        return undefined;
      });

      vi.resetModules();
      const { featureFlags } = await import('../../config/featureFlags');
      expect(featureFlags.enableRouteVerification).toBe(true);
    });

    it('is disabled when env var is explicitly set to false', async () => {
      mockGetEnv.mockImplementation((key: string) => {
        if (key === 'VITE_ENABLE_ROUTE_VERIFICATION') return 'false';
        return undefined;
      });

      vi.resetModules();
      const { featureFlags } = await import('../../config/featureFlags');
      expect(featureFlags.enableRouteVerification).toBe(false);
    });
  });

  describe('enableManualContribution flag', () => {
    it('is enabled by default', async () => {
      mockGetEnv.mockImplementation(() => undefined);

      vi.resetModules();
      const { featureFlags } = await import('../../config/featureFlags');
      expect(featureFlags.enableManualContribution).toBe(true);
    });
  });

  describe('enableVoiceContribution flag', () => {
    it('is disabled by default (requires explicit enablement)', async () => {
      mockGetEnv.mockImplementation(() => undefined);

      vi.resetModules();
      const { featureFlags } = await import('../../config/featureFlags');
      expect(featureFlags.enableVoiceContribution).toBe(false);
    });

    it('is enabled when env var is set to true', async () => {
      mockGetEnv.mockImplementation((key: string) => {
        if (key === 'VITE_ENABLE_VOICE_CONTRIBUTION') return 'true';
        return undefined;
      });

      vi.resetModules();
      const { featureFlags } = await import('../../config/featureFlags');
      expect(featureFlags.enableVoiceContribution).toBe(true);
    });
  });

  describe('isFeatureEnabled helper', () => {
    it('returns correct value for enabled feature', async () => {
      mockGetEnv.mockImplementation(() => undefined);

      vi.resetModules();
      const { isFeatureEnabled } = await import('../../config/featureFlags');
      expect(isFeatureEnabled('enableManualContribution')).toBe(true);
    });

    it('returns correct value for disabled feature', async () => {
      mockGetEnv.mockImplementation(() => undefined);

      vi.resetModules();
      const { isFeatureEnabled } = await import('../../config/featureFlags');
      expect(isFeatureEnabled('enableVoiceContribution')).toBe(false);
    });
  });
});
