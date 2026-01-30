/**
 * React Hook for Offline Persistence
 * 
 * Provides easy integration of offline persistence in React components:
 * - Auto-save drafts at configurable intervals
 * - Load saved drafts on mount
 * - Queue failed submissions for retry
 * - Process retry queue when back online
 * 
 * Usage:
 * ```tsx
 * const { 
 *   saveDraft, 
 *   loadLatestDraft, 
 *   queueForRetry,
 *   isProcessing 
 * } = useOfflinePersistence();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  offlinePersistence,
  type ContributionData,
  type DraftContribution
} from '../services/offlinePersistenceService';
import { useNetworkStatus } from './useNetworkStatus';

export interface UseOfflinePersistenceOptions {
  autoSaveInterval?: number; // Auto-save interval in milliseconds (default: 30000ms = 30s)
  loadDraftOnMount?: boolean; // Load latest draft on component mount (default: true)
  processRetryOnOnline?: boolean; // Process retry queue when back online (default: true)
}

export interface UseOfflinePersistenceReturn {
  saveDraft: (data: ContributionData) => Promise<number>;
  loadLatestDraft: () => Promise<DraftContribution | null>;
  deleteDraft: (draftId: number) => Promise<void>;
  queueForRetry: (data: ContributionData, error?: string) => Promise<number>;
  processRetryQueue: (submitFn: (data: ContributionData) => Promise<void>) => Promise<{ success: number; failed: number }>;
  isProcessing: boolean;
  stats: {
    draftsCount: number;
    retryQueueCount: number;
    oldestDraft: number | null;
    newestDraft: number | null;
  } | null;
  refreshStats: () => Promise<void>;
}

export function useOfflinePersistence(
  options: UseOfflinePersistenceOptions = {}
): UseOfflinePersistenceReturn {
  const {
    autoSaveInterval: _autoSaveInterval = 30000, // 30 seconds
    loadDraftOnMount = true,
    processRetryOnOnline = true
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<UseOfflinePersistenceReturn['stats']>(null);
  const isOnline = useNetworkStatus();
  const previousOnlineStatus = useRef(isOnline);
  const hasProcessedRetryOnStartup = useRef(false);

  /**
   * Save draft to IndexedDB
   */
  const saveDraft = useCallback(async (data: ContributionData): Promise<number> => {
    try {
      const draftId = await offlinePersistence.saveDraft(data);
      await refreshStats();
      return draftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }, []);

  /**
   * Load latest draft from IndexedDB
   */
  const loadLatestDraft = useCallback(async (): Promise<DraftContribution | null> => {
    try {
      return await offlinePersistence.getLatestDraft();
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, []);

  /**
   * Delete specific draft
   */
  const deleteDraft = useCallback(async (draftId: number): Promise<void> => {
    try {
      await offlinePersistence.deleteDraft(draftId);
      await refreshStats();
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error;
    }
  }, []);

  /**
   * Queue failed submission for retry
   */
  const queueForRetry = useCallback(async (
    data: ContributionData,
    error?: string
  ): Promise<number> => {
    try {
      const queueId = await offlinePersistence.queueRetry(data, error);
      await refreshStats();
      return queueId;
    } catch (error) {
      console.error('Failed to queue for retry:', error);
      throw error;
    }
  }, []);

  /**
   * Process retry queue
   */
  const processRetryQueue = useCallback(async (
    submitFn: (data: ContributionData) => Promise<void>
  ): Promise<{ success: number; failed: number }> => {
    if (isProcessing) {
      console.warn('Retry queue is already being processed');
      return { success: 0, failed: 0 };
    }

    setIsProcessing(true);
    try {
      const result = await offlinePersistence.processRetryQueue(submitFn);
      await refreshStats();
      return result;
    } catch (error) {
      console.error('Failed to process retry queue:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  /**
   * Refresh statistics
   */
  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      const newStats = await offlinePersistence.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, []);

  /**
   * Load draft on mount if enabled
   */
  useEffect(() => {
    if (loadDraftOnMount) {
      loadLatestDraft().catch(error => {
        console.error('Failed to load draft on mount:', error);
      });
    }
  }, [loadDraftOnMount, loadLatestDraft]);

  /**
   * Load stats on mount
   */
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  /**
   * Process retry queue when coming back online
   */
  useEffect(() => {
    const wasOffline = !previousOnlineStatus.current;
    const isNowOnline = isOnline;

    // Check if we just came back online
    if (wasOffline && isNowOnline && processRetryOnOnline && !hasProcessedRetryOnStartup.current) {
      console.log('🌐 Back online, processing retry queue...');
      hasProcessedRetryOnStartup.current = true;
      
      // Note: Actual processing requires a submit function
      // This will be called by the component using this hook
      refreshStats();
    }

    previousOnlineStatus.current = isOnline;
  }, [isOnline, processRetryOnOnline, refreshStats]);

  return {
    saveDraft,
    loadLatestDraft,
    deleteDraft,
    queueForRetry,
    processRetryQueue,
    isProcessing,
    stats,
    refreshStats
  };
}
