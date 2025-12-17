package com.perundhu.infrastructure.config;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Configuration for application-level caching using Caffeine.
 * Provides TTL-based cache eviction and size limits for optimal memory usage.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    // Cache names used across the application
    public static final String LATEST_BUS_LOCATIONS_CACHE = "latestBusLocationsCache";
    public static final String BUS_LOCATION_HISTORY_CACHE = "busLocationHistoryCache";
    public static final String NEARBY_BUSES_CACHE = "nearbyBusesCache";
    public static final String LOCATIONS_CACHE = "locationsCache";
    public static final String ALL_BUSES_CACHE = "allBusesCache";
    public static final String TRANSLATIONS_CACHE = "translations"; // Used by CachingTranslationServiceImpl
    public static final String ROUTE_GRAPH_CACHE = "routeGraphCache";
    public static final String SEARCH_RESULTS_CACHE = "searchResultsCache";
    public static final String BUS_SEARCH_CACHE = "busSearchCache";
    public static final String STOPS_CACHE = "stopsCache";
    public static final String CONNECTING_ROUTES_CACHE = "connectingRoutesCache";

    /**
     * Custom cache manager with specific TTLs for different cache types.
     * - Route graph cache: 1 hour (rarely changes, expensive to rebuild)
     * - Connecting routes cache: 30 minutes (pre-computed routes)
     * - Default: 10 minutes
     */
    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager() {
            @Override
            protected com.github.benmanes.caffeine.cache.Cache<Object, Object> createNativeCaffeineCache(String name) {
                return getCacheBuilder(name).build();
            }
        };

        // Register all cache names
        cacheManager.setCacheNames(java.util.List.of(
                LATEST_BUS_LOCATIONS_CACHE,
                BUS_LOCATION_HISTORY_CACHE,
                NEARBY_BUSES_CACHE,
                LOCATIONS_CACHE,
                ALL_BUSES_CACHE,
                TRANSLATIONS_CACHE,
                ROUTE_GRAPH_CACHE,
                SEARCH_RESULTS_CACHE,
                BUS_SEARCH_CACHE,
                STOPS_CACHE,
                CONNECTING_ROUTES_CACHE));

        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }

    /**
     * Get cache builder with specific configuration based on cache name.
     */
    private Caffeine<Object, Object> getCacheBuilder(String cacheName) {
        return switch (cacheName) {
            // Route graph is expensive to build and rarely changes
            // Use 1 hour TTL - will be warmed on startup
            case ROUTE_GRAPH_CACHE -> Caffeine.newBuilder()
                    .expireAfterWrite(60, TimeUnit.MINUTES)
                    .maximumSize(5) // Only need 1 entry (the global graph)
                    .recordStats();

            // Connecting routes results can be cached longer
            case CONNECTING_ROUTES_CACHE -> Caffeine.newBuilder()
                    .expireAfterWrite(30, TimeUnit.MINUTES)
                    .maximumSize(500) // Cache popular route queries
                    .recordStats();

            // Live location data needs short TTL
            case LATEST_BUS_LOCATIONS_CACHE, NEARBY_BUSES_CACHE -> Caffeine.newBuilder()
                    .expireAfterWrite(30, TimeUnit.SECONDS)
                    .maximumSize(200)
                    .recordStats();

            // Translations rarely change
            case TRANSLATIONS_CACHE -> Caffeine.newBuilder()
                    .expireAfterWrite(60, TimeUnit.MINUTES)
                    .maximumSize(2000)
                    .recordStats();

            // Locations rarely change
            case LOCATIONS_CACHE -> Caffeine.newBuilder()
                    .expireAfterWrite(30, TimeUnit.MINUTES)
                    .maximumSize(500)
                    .recordStats();

            // Default for all other caches
            default -> Caffeine.newBuilder()
                    .expireAfterWrite(10, TimeUnit.MINUTES)
                    .maximumSize(1000)
                    .recordStats();
        };
    }

    /**
     * Cache builder for location data (longer TTL as locations rarely change).
     */
    @Bean
    public Caffeine<Object, Object> locationsCacheBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES) // Locations change infrequently
                .maximumSize(500)
                .recordStats();
    }

    /**
     * Cache builder for live bus locations (short TTL for real-time data).
     */
    @Bean
    public Caffeine<Object, Object> liveBusCacheBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.SECONDS) // Real-time data needs short TTL
                .maximumSize(200)
                .recordStats();
    }

    /**
     * Cache builder for translations (very long TTL as translations rarely change).
     */
    @Bean
    public Caffeine<Object, Object> translationsCacheBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(60, TimeUnit.MINUTES) // Translations are static
                .maximumSize(2000)
                .recordStats();
    }
}