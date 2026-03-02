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
        public static final String PUBLIC_STATS_CACHE = "publicStatsCache";
        
        // Entity-level caches for 100k user scale optimization
        public static final String ROUTE_CONTRIBUTIONS_CACHE = "routeContributionsCache";
        public static final String IMAGE_CONTRIBUTIONS_CACHE = "imageContributionsCache";
        public static final String REVIEWS_CACHE = "reviewsCache";
        public static final String BUSES_CACHE = "busesCache";
        public static final String BUS_ROUTES_CACHE = "busRoutesCache";
        
        // Gemini Vision AI caches (cost optimization)
        public static final String GEMINI_OCR_CACHE = "geminiOcrCache";
        public static final String GEMINI_BATCH_CACHE = "geminiBatchCache";
        
        // Admin and operational caches
        public static final String BUS_ADMIN_CACHE = "busAdminCache";
        public static final String TERMINALS_CACHE = "terminalsCache";
        public static final String ANNOUNCEMENTS_CACHE = "announcementsCache";
        public static final String SETTINGS_CACHE = "settingsCache";
        
        // Bus tracking caches (real-time data with short TTLs)
        public static final String LIVE_TRACKING_CACHE = "liveTrackingCache";
        public static final String BUS_HISTORY_CACHE = "busHistoryCache";
        public static final String BUS_ETA_CACHE = "busEtaCache";
        public static final String BUS_REWARDS_CACHE = "busRewardsCache";

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
                        protected com.github.benmanes.caffeine.cache.Cache<Object, Object> createNativeCaffeineCache(
                                        String name) {
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
                                CONNECTING_ROUTES_CACHE,
                                PUBLIC_STATS_CACHE,
                                ROUTE_CONTRIBUTIONS_CACHE,
                                IMAGE_CONTRIBUTIONS_CACHE,
                                REVIEWS_CACHE,
                                BUSES_CACHE,
                                BUS_ROUTES_CACHE,
                                GEMINI_OCR_CACHE,
                                GEMINI_BATCH_CACHE,
                                BUS_ADMIN_CACHE,
                                TERMINALS_CACHE,
                                ANNOUNCEMENTS_CACHE,
                                SETTINGS_CACHE,
                                LIVE_TRACKING_CACHE,
                                BUS_HISTORY_CACHE,
                                BUS_ETA_CACHE,
                                BUS_REWARDS_CACHE));

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

                        // Public stats can be cached longer (changes rarely)
                        case PUBLIC_STATS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(60, TimeUnit.MINUTES)
                                        .maximumSize(10)
                                        .recordStats();

                        // Route contributions cache (moderate TTL, user actions)
                        case ROUTE_CONTRIBUTIONS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(5, TimeUnit.MINUTES)
                                        .maximumSize(1000)
                                        .recordStats();

                        // Image contributions cache (moderate TTL)
                        case IMAGE_CONTRIBUTIONS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(5, TimeUnit.MINUTES)
                                        .maximumSize(500)
                                        .recordStats();

                        // Reviews cache (longer TTL, less frequent updates)
                        case REVIEWS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(15, TimeUnit.MINUTES)
                                        .maximumSize(5000)
                                        .recordStats();

                        // Buses cache (longer TTL, schedule data)
                        case BUSES_CACHE, BUS_ROUTES_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(30, TimeUnit.MINUTES)
                                        .maximumSize(2000)
                                        .recordStats();

                        // Gemini Vision AI caches (7 days TTL for OCR results)
                        case GEMINI_OCR_CACHE, GEMINI_BATCH_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(7, TimeUnit.DAYS)
                                        .maximumSize(1000)
                                        .recordStats();
                        
                        // Bus admin cache (5 min TTL for admin panel queries)
                        case BUS_ADMIN_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(5, TimeUnit.MINUTES)
                                        .maximumSize(1000)
                                        .recordStats();
                        
                        // Terminals cache (60 min TTL - static/rarely changing data)
                        case TERMINALS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(60, TimeUnit.MINUTES)
                                        .maximumSize(100)
                                        .recordStats();
                        
                        // Announcements cache (10 min TTL - moderately dynamic)
                        case ANNOUNCEMENTS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(10, TimeUnit.MINUTES)
                                        .maximumSize(50)
                                        .recordStats();
                        
                        // Settings cache (10 min TTL - rarely changes, high read traffic)
                        case SETTINGS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(10, TimeUnit.MINUTES)
                                        .maximumSize(100)
                                        .recordStats();
                        
                        // Live tracking cache (30s TTL - real-time bus locations)
                        case LIVE_TRACKING_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(30, TimeUnit.SECONDS)
                                        .maximumSize(100)
                                        .recordStats();
                        
                        // Bus history cache (5 min TTL - historical location data)
                        case BUS_HISTORY_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(5, TimeUnit.MINUTES)
                                        .maximumSize(500)
                                        .recordStats();
                        
                        // Bus ETA cache (1 min TTL - frequently changing estimates)
                        case BUS_ETA_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(1, TimeUnit.MINUTES)
                                        .maximumSize(1000)
                                        .recordStats();
                        
                        // Bus rewards cache (5 min TTL - user reward points)
                        case BUS_REWARDS_CACHE -> Caffeine.newBuilder()
                                        .expireAfterWrite(5, TimeUnit.MINUTES)
                                        .maximumSize(10000)
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