package com.perundhu.infrastructure.config;

import java.util.Arrays;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration for application-level caching.
 * Uses ConcurrentMapCacheManager for simplicity until Caffeine integration
 * issues are resolved.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String LATEST_BUS_LOCATIONS_CACHE = "latestBusLocationsCache";
    public static final String BUS_LOCATION_HISTORY_CACHE = "busLocationHistoryCache";
    public static final String NEARBY_BUSES_CACHE = "nearbyBusesCache";
    public static final String LOCATIONS_CACHE = "locationsCache";
    public static final String ALL_BUSES_CACHE = "allBusesCache";
    public static final String TRANSLATIONS_CACHE = "translationsCache";
    public static final String ROUTE_GRAPH_CACHE = "routeGraphCache";
    public static final String SEARCH_RESULTS_CACHE = "searchResultsCache";

    @Bean
    @Primary
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();

        // Set cache names
        cacheManager.setCacheNames(Arrays.asList(
                LATEST_BUS_LOCATIONS_CACHE,
                BUS_LOCATION_HISTORY_CACHE,
                NEARBY_BUSES_CACHE,
                LOCATIONS_CACHE,
                ALL_BUSES_CACHE,
                TRANSLATIONS_CACHE,
                ROUTE_GRAPH_CACHE,
                SEARCH_RESULTS_CACHE));

        return cacheManager;
    }
}