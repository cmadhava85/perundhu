package com.perundhu.infrastructure.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting filter to prevent API abuse and protect against data scraping
 */
@Component
public class RateLimitingFilter implements Filter {

  private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

  // Rate limits per endpoint type
  private static final int SEARCH_LIMIT_PER_MINUTE = 10;
  private static final int DETAIL_LIMIT_PER_MINUTE = 30;
  private static final int TRACKING_LIMIT_PER_MINUTE = 60;
  private static final int GENERAL_LIMIT_PER_MINUTE = 100;

  // Storage for tracking requests
  private final ConcurrentHashMap<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

  @Value("${security.api.rate-limit.enabled:true}")
  private boolean enabled;

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {

    if (!enabled) {
      chain.doFilter(request, response);
      return;
    }

    HttpServletRequest httpRequest = (HttpServletRequest) request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;

    String clientId = getClientIdentifier(httpRequest);
    String endpoint = httpRequest.getRequestURI();

    if (isRateLimited(clientId, endpoint)) {
      log.warn("Rate limit exceeded for client: {} on endpoint: {}", clientId, endpoint);

      httpResponse.setStatus(429);
      httpResponse.setContentType("application/json");
      httpResponse.getWriter().write(
          "{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please slow down.\"}");
      return;
    }

    chain.doFilter(request, response);
  }

  private String getClientIdentifier(HttpServletRequest request) {
    // Use multiple identifiers for better tracking
    String userAgent = request.getHeader("User-Agent");
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    String remoteAddr = request.getRemoteAddr();

    // Create composite identifier
    return String.format("%s|%s|%s",
        remoteAddr != null ? remoteAddr : "unknown",
        xForwardedFor != null ? xForwardedFor.split(",")[0].trim() : "none",
        userAgent != null ? userAgent.hashCode() : "no-agent");
  }

  private boolean isRateLimited(String clientId, String endpoint) {
    int limit = getEndpointLimit(endpoint);
    String key = clientId + "|" + getEndpointCategory(endpoint);

    RequestCounter counter = requestCounts.computeIfAbsent(key,
        k -> new RequestCounter());

    return !counter.allowRequest(limit);
  }

  private int getEndpointLimit(String endpoint) {
    if (endpoint.contains("/search") || endpoint.contains("/connecting-routes")) {
      return SEARCH_LIMIT_PER_MINUTE;
    } else if (endpoint.contains("/buses/") || endpoint.contains("/stops")) {
      return DETAIL_LIMIT_PER_MINUTE;
    } else if (endpoint.contains("/tracking") || endpoint.contains("/live")) {
      return TRACKING_LIMIT_PER_MINUTE;
    }
    return GENERAL_LIMIT_PER_MINUTE;
  }

  private String getEndpointCategory(String endpoint) {
    if (endpoint.contains("/search"))
      return "search";
    if (endpoint.contains("/tracking"))
      return "tracking";
    if (endpoint.contains("/buses/"))
      return "details";
    return "general";
  }

  /**
   * Thread-safe request counter with time window
   */
  private static class RequestCounter {
    private LocalDateTime windowStart = LocalDateTime.now();
    private AtomicInteger count = new AtomicInteger(0);

    synchronized boolean allowRequest(int limit) {
      LocalDateTime now = LocalDateTime.now();

      // Reset window if a minute has passed
      if (now.isAfter(windowStart.plusMinutes(1))) {
        windowStart = now;
        count.set(0);
      }

      return count.incrementAndGet() <= limit;
    }
  }
}