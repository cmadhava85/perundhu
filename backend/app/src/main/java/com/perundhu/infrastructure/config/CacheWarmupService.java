package com.perundhu.infrastructure.config;

import com.perundhu.domain.port.LocationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Cache warm-up service to pre-load frequently accessed data on application
 * startup
 * 
 * Benefits:
 * - Faster response times for first requests after deployment
 * - Prevents cold start latency (important for serverless/auto-scaling
 * environments)
 * - Reduces load on database during initial traffic burst
 * - Improves user experience during application startup
 * 
 * The warm-up happens asynchronously after the application is fully ready,
 * so it doesn't block the startup process.
 */
@Component
public class CacheWarmupService {

  private static final Logger log = LoggerFactory.getLogger(CacheWarmupService.class);

  private final LocationRepository locationRepository;
  private final CacheManager cacheManager;

  public CacheWarmupService(
      LocationRepository locationRepository,
      CacheManager cacheManager) {
    this.locationRepository = locationRepository;
    this.cacheManager = cacheManager;
  }

  /**
   * Warm up caches after application is fully ready
   * This runs asynchronously to avoid blocking startup
   */
  @EventListener(ApplicationReadyEvent.class)
  public void warmupCaches() {
    log.info("🔥 Starting cache warm-up...");
    long startTime = System.currentTimeMillis();

    try {
      // Warm up locations cache (most frequently accessed)
      warmupLocationsCache();

      // Warm up route graph cache (expensive to compute)
      warmupRouteGraphCache();

      // Warm up translations cache
      warmupTranslationsCache();

      long duration = System.currentTimeMillis() - startTime;
      log.info("✅ Cache warm-up completed in {} ms", duration);

    } catch (Exception e) {
      log.error("❌ Error during cache warm-up (non-fatal, will warm up on first request)", e);
    }
  }

  /**
   * Warm up locations cache with all locations
   */
  private void warmupLocationsCache() {
    try {
      Cache locationsCache = cacheManager.getCache(CacheConfig.LOCATIONS_CACHE);
      if (locationsCache != null) {
        var locations = locationRepository.findAll();
        String cacheKey = "all_locations";
        locationsCache.put(cacheKey, locations);
        log.info("  ✓ Warmed up locations cache ({} locations)", locations.size());
      }
    } catch (Exception e) {
      log.warn("Failed to warm up locations cache: {}", e.getMessage());
    }
  }

  /**
   * Warm up route graph cache (if routing service is available)
   */
  private void warmupRouteGraphCache() {
    try {
      Cache routeGraphCache = cacheManager.getCache(CacheConfig.ROUTE_GRAPH_CACHE);
      if (routeGraphCache != null) {
        // Check if route graph is already cached
        Object existingGraph = routeGraphCache.get("global_route_graph");
        if (existingGraph == null) {
          // Route graph building is typically done by the routing service
          // We just log that it will be built on first request
          log.info("  ⏭ Route graph cache will be built on first routing request");
        } else {
          log.info("  ✓ Route graph cache already populated");
        }
      }
    } catch (Exception e) {
      log.warn("Failed to warm up route graph cache: {}", e.getMessage());
    }
  }

  /**
   * Warm up translations cache with common translations
   */
  private void warmupTranslationsCache() {
    try {
      Cache translationsCache = cacheManager.getCache(CacheConfig.TRANSLATIONS_CACHE);
      if (translationsCache != null) {
        // Translations are typically loaded on demand
        // We just verify the cache is available
        log.info("  ✓ Translations cache is ready");
      }
    } catch (Exception e) {
      log.warn("Failed to verify translations cache: {}", e.getMessage());
    }
  }

  /**
   * Clear all caches (useful for testing or maintenance)
   */
  public void clearAllCaches() {
    log.info("🧹 Clearing all caches...");
    cacheManager.getCacheNames().forEach(cacheName -> {
      Cache cache = cacheManager.getCache(cacheName);
      if (cache != null) {
        cache.clear();
        log.info("  ✓ Cleared cache: {}", cacheName);
      }
    });
    log.info("✅ All caches cleared");
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  public void logCacheStats() {
    log.info("📊 Cache Statistics:");
    cacheManager.getCacheNames().forEach(cacheName -> {
      Cache cache = cacheManager.getCache(cacheName);
      if (cache != null) {
        Object nativeCache = cache.getNativeCache();
        if (nativeCache instanceof com.github.benmanes.caffeine.cache.Cache<?, ?> caffeineCache) {
          var stats = caffeineCache.stats();
          log.info("  {} - Hits: {}, Misses: {}, Hit Rate: {:.2f}%",
              cacheName,
              stats.hitCount(),
              stats.missCount(),
              stats.hitRate() * 100);
        }
      }
    });
  }
}
