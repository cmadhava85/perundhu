import React from 'react';
import { render, renderHook } from '@testing-library/react';
import type { RenderOptions, RenderHookOptions } from '@testing-library/react';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

/**
 * Default mock feature flags for testing - all features enabled
 */
export const mockFeatureFlags = {
  enableManualContribution: true,
  enableVoiceContribution: true,
  enableImageContribution: true,
  enablePasteContribution: true,
  enableRouteVerification: true,
  enableAddStops: true,
  enableReportIssue: true,
  enableShareRoute: true,
  enableMap: true,
  enableAutoApproval: false,
  enableGeminiAI: true,
  enableCache: true,
  enableMaintenanceMode: false,
  enableRateLimiting: true,
  maxRequestsPerMinute: 60,
  requireEmailVerification: false,
  enableSocialMedia: false,
  enableCommunityRewards: false,
  enableBusinessPartners: false,
  enableOsmIntegration: false,
  enableRealTimeUpdates: true,
};

/**
 * Create a test query client with disabled retries
 * Each test gets a fresh client to prevent memory leaks
 */
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0, // Disable cache time to free memory immediately
      staleTime: 0, // Don't keep data fresh
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * All providers wrapper for testing
 * Wraps components with all necessary context providers
 * Creates new instances per render to avoid memory leaks
 */
interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  // Create a fresh query client for each test component
  const [queryClient] = React.useState(() => createTestQueryClient());
  
  // Cleanup query client on unmount
  React.useEffect(() => {
    return () => {
      queryClient.clear();
      queryClient.unmount();
    };
  }, [queryClient]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FeatureFlagsProvider>
          {children}
        </FeatureFlagsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Custom render function that wraps component with all providers
 */
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

/**
 * Custom renderHook function that wraps hook with all providers
 */
const customRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'>
) => renderHook(hook, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render and renderHook with custom versions
export { customRender as render, customRenderHook as renderHook };
