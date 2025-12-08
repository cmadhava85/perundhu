package com.perundhu.infrastructure.config;

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
     * Default Caffeine cache configuration:
     * - TTL: 10 minutes (data freshness)
     * - Max size: 1000 entries (memory protection)
     * - Record stats for monitoring
     */
    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
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
                CONNECTING_ROUTES_CACHE);

        cacheManager.setCaffeine(defaultCacheBuilder());
        cacheManager.setAllowNullValues(false);

        return cacheManager;
    }

    /**
     * Default cache builder with reasonable defaults for most caches.
     */
    private Caffeine<Object, Object> defaultCacheBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES) // TTL for cache entries
                .maximumSize(1000) // Prevent unbounded growth
                .recordStats(); // Enable statistics for monitoring
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