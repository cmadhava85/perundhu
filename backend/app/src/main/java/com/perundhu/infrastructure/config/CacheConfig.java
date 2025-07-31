package com.perundhu.infrastructure.config;

import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Configuration for application-level caching.
 * Uses Caffeine as the caching provider for high-performance caching.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String LATEST_BUS_LOCATIONS_CACHE = "latestBusLocationsCache";
    public static final String BUS_LOCATION_HISTORY_CACHE = "busLocationHistoryCache";
    public static final String NEARBY_BUSES_CACHE = "nearbyBusesCache";

    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(Duration.ofMinutes(1)));

        // Add specific cache configurations
        cacheManager.setCacheNames(java.util.Arrays.asList(
                LATEST_BUS_LOCATIONS_CACHE,
                BUS_LOCATION_HISTORY_CACHE,
                NEARBY_BUSES_CACHE));

        return cacheManager;
    }

    @Bean
    public Caffeine<Object, Object> latestBusLocationsCaffeine() {
        return Caffeine.newBuilder()
                .maximumSize(500) // Cache up to 500 buses
                .expireAfterWrite(Duration.ofSeconds(15)) // Very short TTL for latest positions
                .recordStats(); // Enable statistics for monitoring
    }

    @Bean
    public Caffeine<Object, Object> busLocationHistoryCaffeine() {
        return Caffeine.newBuilder()
                .maximumSize(100) // Cache up to 100 history queries
                .expireAfterWrite(Duration.ofMinutes(5))
                .recordStats();
    }

    @Bean
    public Caffeine<Object, Object> nearbyBusesCaffeine() {
        return Caffeine.newBuilder()
                .maximumSize(200) // Cache up to 200 location-based queries
                .expireAfterWrite(Duration.ofSeconds(30)) // Moderate TTL for spatial queries
                .recordStats();
    }

    @Bean
    public CaffeineCacheManager latestBusLocationsCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(LATEST_BUS_LOCATIONS_CACHE);
        cacheManager.setCaffeine(latestBusLocationsCaffeine());
        return cacheManager;
    }

    @Bean
    public CaffeineCacheManager busLocationHistoryCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(BUS_LOCATION_HISTORY_CACHE);
        cacheManager.setCaffeine(busLocationHistoryCaffeine());
        return cacheManager;
    }

    @Bean
    public CaffeineCacheManager nearbyBusesCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(NEARBY_BUSES_CACHE);
        cacheManager.setCaffeine(nearbyBusesCaffeine());
        return cacheManager;
    }
}