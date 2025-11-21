package com.perundhu.infrastructure.config;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

import com.google.common.util.concurrent.RateLimiter;

/**
 * Rate limiting configuration using Guava RateLimiter
 * Provides per-user and global rate limiting capabilities
 */
@Configuration
public class RateLimitConfig {

  /**
   * Global rate limiter for API endpoints
   * Allows 100 requests per second globally
   */
  @Bean
  @Scope("singleton")
  public RateLimiter globalRateLimiter() {
    return RateLimiter.create(100.0); // 100 requests per second
  }

  /**
   * Map to store per-user rate limiters
   * Each user gets their own rate limiter instance
   */
  @Bean
  @Scope("singleton")
  public ConcurrentHashMap<String, RateLimiter> userRateLimiters() {
    return new ConcurrentHashMap<>();
  }

  /**
   * Get or create a rate limiter for a specific user
   * Limits each user to 10 requests per second
   * 
   * @param userId           The user identifier
   * @param userRateLimiters The map of user rate limiters
   * @return RateLimiter for the specified user
   */
  public static RateLimiter getUserRateLimiter(
      String userId,
      ConcurrentHashMap<String, RateLimiter> userRateLimiters) {

    return userRateLimiters.computeIfAbsent(
        userId,
        k -> RateLimiter.create(10.0) // 10 requests per second per user
    );
  }
}
