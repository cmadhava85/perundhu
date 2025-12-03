package com.perundhu.adapter.out.cache;

import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory repository for storing and checking image hashes to prevent
 * duplicate uploads.
 * This is a temporary implementation that can be swapped with Redis in
 * production.
 * 
 * @author Perundhu Team
 */
@Repository
public class InMemoryImageHashRepository {

  private static final int DEFAULT_TTL_HOURS = 24;

  // Thread-safe map storing hash -> HashEntry
  private final Map<String, HashEntry> hashStore = new ConcurrentHashMap<>();

  /**
   * Check if an image hash exists in cache (indicating duplicate).
   *
   * @param hash Image hash to check
   * @return true if hash exists and not expired (duplicate), false otherwise
   */
  public boolean isDuplicate(String hash) {
    cleanupExpiredEntries();
    HashEntry entry = hashStore.get(hash);
    return entry != null && !entry.isExpired();
  }

  /**
   * Store an image hash with default 24-hour TTL.
   *
   * @param hash           Image hash to store
   * @param contributionId ID of the contribution
   */
  public void storeHash(String hash, String contributionId) {
    storeHash(hash, contributionId, DEFAULT_TTL_HOURS);
  }

  /**
   * Store an image hash with custom TTL.
   *
   * @param hash           Image hash to store
   * @param contributionId ID of the contribution
   * @param ttlHours       Time to live in hours
   */
  public void storeHash(String hash, String contributionId, int ttlHours) {
    LocalDateTime expiresAt = LocalDateTime.now().plusHours(ttlHours);
    hashStore.put(hash, new HashEntry(contributionId, expiresAt));
  }

  /**
   * Get the contribution ID associated with an image hash.
   *
   * @param hash Image hash to look up
   * @return Contribution ID or null if not found or expired
   */
  public String getContributionId(String hash) {
    HashEntry entry = hashStore.get(hash);
    if (entry != null && !entry.isExpired()) {
      return entry.contributionId;
    }
    return null;
  }

  /**
   * Delete an image hash from cache.
   *
   * @param hash Image hash to delete
   * @return true if hash was deleted, false if it didn't exist
   */
  public boolean deleteHash(String hash) {
    return hashStore.remove(hash) != null;
  }

  /**
   * Clean up expired entries (called periodically).
   */
  private void cleanupExpiredEntries() {
    hashStore.entrySet().removeIf(entry -> entry.getValue().isExpired());
  }

  /**
   * Get total number of stored hashes (for monitoring).
   */
  public int size() {
    cleanupExpiredEntries();
    return hashStore.size();
  }

  /**
   * Clear all stored hashes (for testing).
   */
  public void clear() {
    hashStore.clear();
  }

  /**
   * Internal class to store hash entry with expiration time.
   */
  private static class HashEntry {
    private final String contributionId;
    private final LocalDateTime expiresAt;

    HashEntry(String contributionId, LocalDateTime expiresAt) {
      this.contributionId = contributionId;
      this.expiresAt = expiresAt;
    }

    boolean isExpired() {
      return LocalDateTime.now().isAfter(expiresAt);
    }
  }
}
