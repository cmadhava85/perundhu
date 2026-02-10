/* eslint-disable no-console */
/**
 * Offline Persistence Service using IndexedDB
 * 
 * Provides offline-first functionality for user contributions:
 * - Auto-saves draft contributions locally
 * - Queues failed submissions for retry
 * - Processes retry queue when connection restored
 * - Prevents data loss during poor connectivity
 * 
 * Compatible with all modern browsers supporting IndexedDB
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'perundhu-offline';
const DB_VERSION = 1;
const DRAFTS_STORE = 'drafts';
const RETRY_QUEUE_STORE = 'retryQueue';

export interface ContributionData {
  id?: number;
  busName?: string;
  busNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  departureTime?: string;
  arrivalTime?: string;
  stops?: string[];
  contributionMethod?: string;
  imageData?: string;
  voiceData?: string;
  [key: string]: unknown;
}

export interface DraftContribution extends ContributionData {
  id: number;
  timestamp: number;
  type: 'draft';
}

export interface RetryQueueItem extends ContributionData {
  id: number;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

class OfflinePersistenceService {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.db = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Store for draft contributions
            if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
              const draftsStore = db.createObjectStore(DRAFTS_STORE, {
                keyPath: 'id',
                autoIncrement: true
              });
              draftsStore.createIndex('timestamp', 'timestamp');
            }

            // Store for failed submissions (retry queue)
            if (!db.objectStoreNames.contains(RETRY_QUEUE_STORE)) {
              const retryStore = db.createObjectStore(RETRY_QUEUE_STORE, {
                keyPath: 'id',
                autoIncrement: true
              });
              retryStore.createIndex('timestamp', 'timestamp');
              retryStore.createIndex('retryCount', 'retryCount');
            }
          }
        });
        
        console.log('✅ IndexedDB initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize IndexedDB:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Save draft contribution locally
   */
  async saveDraft(contributionData: ContributionData): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const draft: Omit<DraftContribution, 'id'> = {
      ...contributionData,
      timestamp: Date.now(),
      type: 'draft'
    };

    const id = await this.db.put(DRAFTS_STORE, draft);
    console.log('💾 Draft saved with ID:', id);
    return id as number;
  }

  /**
   * Get all draft contributions
   */
  async getDrafts(): Promise<DraftContribution[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const drafts = await this.db.getAll(DRAFTS_STORE);
    return drafts;
  }

  /**
   * Get most recent draft
   */
  async getLatestDraft(): Promise<DraftContribution | null> {
    const drafts = await this.getDrafts();
    if (drafts.length === 0) return null;

    // Sort by timestamp descending and return the most recent
    const sorted = [...drafts].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0];
  }

  /**
   * Delete a specific draft
   */
  async deleteDraft(draftId: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete(DRAFTS_STORE, draftId);
    console.log(`🗑️ Draft deleted: ${draftId}`);
  }

  /**
   * Clear all drafts
   */
  async clearAllDrafts(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.clear(DRAFTS_STORE);
    console.log('🧹 All drafts cleared');
  }

  /**
   * Queue failed submission for retry
   */
  async queueRetry(
    contributionData: ContributionData,
    error?: string
  ): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const retryItem: Omit<RetryQueueItem, 'id'> = {
      ...contributionData,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      lastError: error
    };

    const id = await this.db.put(RETRY_QUEUE_STORE, retryItem);
    console.log('📤 Queued for retry with ID:', id);
    return id as number;
  }

  /**
   * Get all items in retry queue
   */
  async getRetryQueue(): Promise<RetryQueueItem[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return await this.db.getAll(RETRY_QUEUE_STORE);
  }

  /**
   * Update retry item after failed attempt
   */
  async updateRetryItem(item: RetryQueueItem): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put(RETRY_QUEUE_STORE, item);
  }

  /**
   * Remove item from retry queue
   */
  async removeFromRetryQueue(itemId: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete(RETRY_QUEUE_STORE, itemId);
    console.log(`✅ Removed from retry queue: ${itemId}`);
  }

  /**
   * Process retry queue (call when back online)
   * Returns number of successfully retried items
   */
  async processRetryQueue(
    submitFunction: (data: ContributionData) => Promise<void>
  ): Promise<{ success: number; failed: number }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const queueItems = await this.getRetryQueue();
    let successCount = 0;
    let failedCount = 0;

    console.log(`🔄 Processing retry queue: ${queueItems.length} items`);

    for (const item of queueItems) {
      try {
        // Attempt to submit
        await submitFunction(item);
        
        // Success - remove from queue
        await this.removeFromRetryQueue(item.id);
        successCount++;
        
        console.log(`✅ Successfully retried item ${item.id}`);
      } catch (error) {
        // Failed - increment retry count
        item.retryCount++;
        item.lastError = error instanceof Error ? error.message : String(error);

        if (item.retryCount >= item.maxRetries) {
          // Max retries reached - remove from queue
          await this.removeFromRetryQueue(item.id);
          failedCount++;
          console.error(`❌ Max retries reached for item ${item.id}, removing from queue`);
        } else {
          // Update with new retry count
          await this.updateRetryItem(item);
          console.warn(`⚠️ Retry ${item.retryCount}/${item.maxRetries} failed for item ${item.id}`);
        }
      }
    }

    console.log(`📊 Retry queue processed: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  }

  /**
   * Get statistics about offline storage
   */
  async getStats(): Promise<{
    draftsCount: number;
    retryQueueCount: number;
    oldestDraft: number | null;
    newestDraft: number | null;
  }> {
    await this.init();

    const drafts = await this.getDrafts();
    const retryQueue = await this.getRetryQueue();

    const timestamps = drafts.map(d => d.timestamp);
    const oldestDraft = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestDraft = timestamps.length > 0 ? Math.max(...timestamps) : null;

    return {
      draftsCount: drafts.length,
      retryQueueCount: retryQueue.length,
      oldestDraft,
      newestDraft
    };
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.clear(DRAFTS_STORE);
    await this.db.clear(RETRY_QUEUE_STORE);
    console.log('🧹 All offline data cleared');
  }

  /**
   * Check if IndexedDB is supported
   */
  static isSupported(): boolean {
    return typeof indexedDB !== 'undefined';
  }
}

// Export singleton instance
export const offlinePersistence = new OfflinePersistenceService();

// Export class for testing
export { OfflinePersistenceService };
