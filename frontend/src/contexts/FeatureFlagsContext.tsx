import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AdminService from '../services/adminService';

/**
 * Feature flags that can be controlled by admin settings
 */
export interface FeatureFlags {
  // Contribution methods
  enableManualContribution: boolean;
  enableImageContribution: boolean;
  enableVoiceContribution: boolean;
  enablePasteContribution: boolean;
  enableRouteVerification: boolean;
  enableAddStops: boolean;
  enableReportIssue: boolean;
  
  // UI features
  enableShareRoute: boolean;
  enableMap: boolean;
  
  // System features
  enableAutoApproval: boolean;
  enableGeminiAI: boolean;
  enableCache: boolean;
  enableMaintenanceMode: boolean;
  
  // Security features
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  requireEmailVerification: boolean;
  
  // Additional features from backend
  enableSocialMedia: boolean;
  enableCommunityRewards: boolean;
  enableBusinessPartners: boolean;
  enableOsmIntegration: boolean;
  enableRealTimeUpdates: boolean;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  updateFlag: (flagName: keyof FeatureFlags, value: boolean | number) => void;
  updateFlags: (updates: Partial<FeatureFlags>) => void;
  resetToDefaults: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  saveToBackend: () => Promise<void>;
  syncToPreprod: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  isSyncingToPreprod: boolean;
  lastSyncError: string | null;
  isBackendAvailable: boolean;
  isPreprodAvailable: boolean;
}

// Storage key for persisted settings
const FEATURE_FLAGS_STORAGE_KEY = 'admin_feature_flags';

// Default feature flag values
const defaultFlags: FeatureFlags = {
  // Contribution methods - some enabled by default
  enableManualContribution: true,
  enableImageContribution: true,
  enableVoiceContribution: false,
  enablePasteContribution: false,
  enableRouteVerification: false,
  enableAddStops: true,
  enableReportIssue: true,
  
  // UI features
  enableShareRoute: true,
  enableMap: false,
  
  // System features
  enableAutoApproval: false,
  enableGeminiAI: true,
  enableCache: true,
  enableMaintenanceMode: false,
  
  // Security features
  enableRateLimiting: true,
  maxRequestsPerMinute: 60,
  requireEmailVerification: false,
  
  // Additional features from backend
  enableSocialMedia: false,
  enableCommunityRewards: false,
  enableBusinessPartners: false,
  enableOsmIntegration: false,
  enableRealTimeUpdates: false,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingToPreprod, setIsSyncingToPreprod] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [isPreprodAvailable, setIsPreprodAvailable] = useState(false);

  // Save to localStorage
  const saveToLocalStorage = useCallback((newFlags: FeatureFlags) => {
    try {
      localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(newFlags));
    } catch (error) {
      console.error('Failed to save feature flags to localStorage:', error);
    }
  }, []);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): FeatureFlags | null => {
    try {
      const saved = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      if (saved) {
        return { ...defaultFlags, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load feature flags from localStorage:', error);
    }
    return null;
  }, []);

  // Sync with backend
  const syncWithBackend = useCallback(async () => {
    setIsSyncing(true);
    setLastSyncError(null);
    
    try {
      const backendFlags = await AdminService.getFeatureFlags();
      setIsBackendAvailable(true);
      
      // Merge backend flags with defaults (backend takes priority)
      const mergedFlags = { ...defaultFlags, ...backendFlags } as FeatureFlags;
      setFlags(mergedFlags);
      saveToLocalStorage(mergedFlags);
      
      console.log('Feature flags synced from backend');
    } catch (error) {
      console.warn('Backend not available, using local settings:', error);
      setIsBackendAvailable(false);
      
      // Try to load from localStorage
      const localFlags = loadFromLocalStorage();
      if (localFlags) {
        setFlags(localFlags);
      }
      
      // Set error only if we expected the backend to be available
      if (error instanceof Error && !error.message.includes('401') && !error.message.includes('403')) {
        setLastSyncError('Backend sync failed. Using local settings.');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [saveToLocalStorage, loadFromLocalStorage]);

  // Save current flags to backend
  const saveToBackend = useCallback(async () => {
    if (!isBackendAvailable) {
      console.warn('Backend not available, saving to localStorage only');
      return;
    }
    
    setIsSyncing(true);
    setLastSyncError(null);
    
    try {
      // Convert FeatureFlags to Record<string, boolean>
      const flagsRecord: Record<string, boolean> = {};
      Object.entries(flags).forEach(([key, value]) => {
        flagsRecord[key] = value;
      });
      
      const result = await AdminService.updateFeatureFlags(flagsRecord);
      console.log('Feature flags saved to backend:', result);
      
      // Update local state with what backend returned
      if (result.flags) {
        const updatedFlags = { ...defaultFlags, ...result.flags } as FeatureFlags;
        setFlags(updatedFlags);
        saveToLocalStorage(updatedFlags);
      }
    } catch (error) {
      console.error('Failed to save feature flags to backend:', error);
      setLastSyncError('Failed to save settings to server.');
    } finally {
      setIsSyncing(false);
    }
  }, [flags, isBackendAvailable, saveToLocalStorage]);

  // Sync current flags to preprod environment
  const syncToPreprod = useCallback(async () => {
    setIsSyncingToPreprod(true);
    setLastSyncError(null);
    
    try {
      // Convert FeatureFlags to Record<string, boolean>
      const flagsRecord: Record<string, boolean> = {};
      Object.entries(flags).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          flagsRecord[key] = value;
        } else if (typeof value === 'number') {
          // For numeric values like maxRequestsPerMinute, skip or convert
          // These settings might not be supported as boolean flags
        }
      });
      
      const result = await AdminService.syncFeatureFlagsToPreprod(flagsRecord);
      console.log('Feature flags synced to preprod:', result);
      setIsPreprodAvailable(true);
    } catch (error) {
      console.error('Failed to sync feature flags to preprod:', error);
      setIsPreprodAvailable(false);
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          setLastSyncError('Authentication failed for preprod. Please check your credentials.');
        } else if (error.message.includes('Network Error') || error.message.includes('timeout')) {
          setLastSyncError('Preprod server not reachable. Please try again later.');
        } else {
          setLastSyncError('Failed to sync to preprod: ' + error.message);
        }
      } else {
        setLastSyncError('Failed to sync settings to preprod.');
      }
      throw error;
    } finally {
      setIsSyncingToPreprod(false);
    }
  }, [flags]);

  // Check preprod availability on mount
  useEffect(() => {
    const checkPreprodAvailability = async () => {
      const available = await AdminService.isPreprodAvailable();
      setIsPreprodAvailable(available);
    };
    checkPreprodAvailability();
  }, []);

  // Initialize on mount - try backend first, fall back to localStorage
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      // First, load from localStorage for immediate display
      const localFlags = loadFromLocalStorage();
      if (localFlags) {
        setFlags(localFlags);
      }
      
      // Then try to sync with backend (admin only feature)
      try {
        await syncWithBackend();
      } catch {
        // Ignore - will use local settings
      }
      
      setIsLoading(false);
    };
    
    initialize();
  }, [loadFromLocalStorage, syncWithBackend]);

  const updateFlag = useCallback((flagName: keyof FeatureFlags, value: boolean | number) => {
    setFlags(prev => {
      const updated = { ...prev, [flagName]: value };
      saveToLocalStorage(updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const updateFlags = useCallback((updates: Partial<FeatureFlags>) => {
    setFlags(prev => {
      const updated = { ...prev, ...updates };
      saveToLocalStorage(updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const resetToDefaults = useCallback(async () => {
    setFlags(defaultFlags);
    saveToLocalStorage(defaultFlags);
    
    // Also reset on backend if available
    if (isBackendAvailable) {
      try {
        const result = await AdminService.resetFeatureFlags();
        if (result.flags) {
          const backendDefaults = { ...defaultFlags, ...result.flags } as FeatureFlags;
          setFlags(backendDefaults);
          saveToLocalStorage(backendDefaults);
        }
      } catch (error) {
        console.error('Failed to reset flags on backend:', error);
      }
    }
  }, [saveToLocalStorage, isBackendAvailable]);

  return (
    <FeatureFlagsContext.Provider 
      value={{ 
        flags, 
        updateFlag, 
        updateFlags, 
        resetToDefaults, 
        syncWithBackend,
        saveToBackend,
        syncToPreprod,
        isLoading, 
        isSyncing,
        isSyncingToPreprod,
        lastSyncError,
        isBackendAvailable,
        isPreprodAvailable
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

/**
 * Hook to check if a specific feature is enabled
 * Only works for boolean flags, not numeric settings
 */
export const useIsFeatureEnabled = (flagName: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  const value = flags[flagName];
  // Handle both boolean and numeric values (for maxRequestsPerMinute)
  if (typeof value === 'boolean') {
    return value;
  }
  // For numeric values, treat non-zero as enabled
  if (typeof value === 'number') {
    return value > 0;
  }
  return false;
};

export default FeatureFlagsContext;
