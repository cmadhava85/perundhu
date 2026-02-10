package com.perundhu.infrastructure.config;

import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * DEPRECATED: Cache configuration moved to CacheConfig.java
 * 
 * This file is kept for reference but is no longer active.
 * All Gemini caches are now managed in the primary CacheConfig.
 * 
 * COST OPTIMIZATION: Cache configuration for Gemini Vision API responses
 * 
 * Caching OCR results reduces expensive API calls to Gemini.
 * 
 * Savings Estimate:
 * - Free tier: 1500 requests/day
 * - Paid tier: $0.0025 per image (gemini-2.0-flash)
 * - With 80% cache hit rate: Save $50-200/month
 * 
 * Cache Strategy:
 * - Key: SHA-256 hash of image bytes
 * - TTL: 7 days (bus schedules don't change frequently)
 * - Max size: 1000 entries (~50MB memory)
 * - Eviction: LRU (Least Recently Used)
 */
// @Configuration - DISABLED: Moved to CacheConfig
// @EnableCaching
public class GeminiCacheConfig {

  public static final String GEMINI_OCR_CACHE = "geminiOcrCache";
  public static final String GEMINI_BATCH_CACHE = "geminiBatchCache";

  // @Bean - DISABLED: Moved to CacheConfig
  public CacheManager geminiCacheManager() {
    CaffeineCacheManager cacheManager = new CaffeineCacheManager(
        GEMINI_OCR_CACHE,
        GEMINI_BATCH_CACHE);

    cacheManager.setCaffeine(
        Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofDays(7))
            .maximumSize(1000)
            .recordStats());

    return cacheManager;
  }
}
