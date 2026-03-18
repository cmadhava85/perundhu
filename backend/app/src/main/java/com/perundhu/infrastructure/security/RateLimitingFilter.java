package com.perundhu.infrastructure.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting filter to prevent API abuse
 * Implements per-IP rate limiting with different limits for different endpoint
 * types
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

  // Rate limit configurations
  @Value("${rate-limit.read.requests-per-minute:100}")
  private int readRequestsPerMinute;

  @Value("${rate-limit.write.requests-per-minute:10}")
  private int writeRequestsPerMinute;

  @Value("${rate-limit.upload.requests-per-minute:5}")
  private int uploadRequestsPerMinute;

  @Value("${rate-limit.enabled:true}")
  private boolean rateLimitEnabled;

  // Store for tracking requests per IP (with size limit)
  private final Map<String, RateLimitEntry> rateLimitStore = new ConcurrentHashMap<>();

  // Maximum entries to prevent memory exhaustion under attack
  private static final int MAX_RATE_LIMIT_ENTRIES = 50000;

  // Cleanup interval (5 minutes)
  private static final long CLEANUP_INTERVAL_MS = 300_000;
  private long lastCleanupTime = System.currentTimeMillis();

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (!rateLimitEnabled) {
      filterChain.doFilter(request, response);
      return;
    }

    String clientIp = getClientIp(request);
    String path = request.getRequestURI();
    String method = request.getMethod();
    String authHeader = request.getHeader("Authorization");

    // Skip rate limiting for health checks
    if (path.contains("/actuator/health")) {
      filterChain.doFilter(request, response);
      return;
    }

    // Skip rate limiting for authenticated admin requests (Basic or Bearer auth)
    if (authHeader != null && (authHeader.startsWith("Basic ") || authHeader.startsWith("Bearer "))) {
      log.debug("Skipping rate limiting for authenticated request to: {}", path);
      filterChain.doFilter(request, response);
      return;
    }

    // Determine rate limit based on endpoint type
    int limit = determineRateLimit(path, method);
    String limitKey = clientIp + ":" + getLimitCategory(path, method);

    // Periodic cleanup of old entries
    cleanupOldEntries();

    // Safety valve: if the store is still oversized after cleanup (e.g. under a
    // distributed IP-spoofing attack), reject new callers rather than letting
    // heap grow without bound. Known IPs already in the map are still served.
    if (!rateLimitStore.containsKey(limitKey) && rateLimitStore.size() >= MAX_RATE_LIMIT_ENTRIES) {
      log.warn("Rate limit store at capacity ({}), rejecting new IP: {}", MAX_RATE_LIMIT_ENTRIES, clientIp);
      response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
      response.setContentType("application/json");
      response.getWriter().write(
          "{\"error\":\"Service temporarily unavailable\",\"message\":\"Server is under high load. Please try again later.\"}");
      return;
    }

    // Check rate limit
    RateLimitEntry entry = rateLimitStore.computeIfAbsent(limitKey, k -> new RateLimitEntry());

    if (!entry.tryAcquire(limit)) {
      log.warn("Rate limit exceeded for IP: {} on path: {} - {} requests in last minute",
          clientIp, path, entry.getCount());

      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setContentType("application/json");
      response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
      response.setHeader("X-RateLimit-Remaining", "0");
      response.setHeader("X-RateLimit-Reset", String.valueOf(entry.getResetTime()));
      response.setHeader("Retry-After", "60");

      response.getWriter().write(
          "{\"error\":\"Too many requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"retryAfter\":60}");
      return;
    }

    // Add rate limit headers to response
    response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
    response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - entry.getCount())));
    response.setHeader("X-RateLimit-Reset", String.valueOf(entry.getResetTime()));

    filterChain.doFilter(request, response);
  }

  private String getClientIp(HttpServletRequest request) {
    // Check for forwarded IP (behind proxy/load balancer)
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      // Take the first IP in the chain (original client)
      return xForwardedFor.split(",")[0].trim();
    }

    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
      return xRealIp;
    }

    return request.getRemoteAddr();
  }

  private int determineRateLimit(String path, String method) {
    // Upload endpoints (most restrictive)
    if (path.contains("/analyze-image") || path.contains("/upload")) {
      return uploadRequestsPerMinute;
    }

    // Write operations (contributions, etc.)
    if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) ||
        "DELETE".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
      return writeRequestsPerMinute;
    }

    // Read operations
    return readRequestsPerMinute;
  }

  private String getLimitCategory(String path, String method) {
    if (path.contains("/analyze-image") || path.contains("/upload")) {
      return "upload";
    }
    if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) ||
        "DELETE".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
      return "write";
    }
    return "read";
  }

  private void cleanupOldEntries() {
    long now = System.currentTimeMillis();
    if (now - lastCleanupTime > CLEANUP_INTERVAL_MS) {
      lastCleanupTime = now;
      long cutoffTime = now - 60_000; // Remove entries older than 1 minute

      // Force cleanup if too many entries (under attack scenario)
      if (rateLimitStore.size() > MAX_RATE_LIMIT_ENTRIES) {
        log.warn("Rate limit store exceeded max size ({}), forcing aggressive cleanup", MAX_RATE_LIMIT_ENTRIES);
        cutoffTime = now - 30_000; // More aggressive: remove entries older than 30 seconds
      }

      final long finalCutoff = cutoffTime;
      rateLimitStore.entrySet().removeIf(entry -> entry.getValue().getWindowStart() < finalCutoff);
      log.debug("Cleaned up old rate limit entries, remaining: {}", rateLimitStore.size());
    }
  }

  /**
   * Rate limit entry tracking requests within a time window.
   * Lock-free implementation optimized for Java 21 virtual threads.
   */
  private static class RateLimitEntry {
    private final AtomicInteger count = new AtomicInteger(0);
    private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());

    public boolean tryAcquire(int limit) {
      long now = System.currentTimeMillis();
      long currentWindowStart = windowStart.get();

      // Reset window if it's been more than 1 minute (lock-free CAS)
      if (now - currentWindowStart > 60_000) {
        if (windowStart.compareAndSet(currentWindowStart, now)) {
          count.set(1);
          return true;
        }
        // Another thread reset the window, retry
        return tryAcquire(limit);
      }

      // Check if under limit (optimistic approach)
      int currentCount = count.get();
      if (currentCount < limit) {
        // Try to increment atomically
        if (count.compareAndSet(currentCount, currentCount + 1)) {
          return true;
        }
        // CAS failed, another thread incremented, retry
        return tryAcquire(limit);
      }

      return false;
    }

    public int getCount() {
      return count.get();
    }

    public long getWindowStart() {
      return windowStart.get();
    }

    public long getResetTime() {
      return Instant.ofEpochMilli(windowStart.get() + 60_000).getEpochSecond();
    }
  }
}
