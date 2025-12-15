package com.perundhu.infrastructure.security;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter that adds a unique traceId to each request for distributed tracing.
 * The traceId is added to MDC (Mapped Diagnostic Context) and included in all
 * log entries.
 * 
 * Features:
 * - Generates unique traceId for each request
 * - Respects existing X-Trace-Id or X-Request-Id headers (for distributed
 * systems)
 * - Adds traceId to response headers for client correlation
 * - Cleans up MDC after request completes
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

  public static final String TRACE_ID_KEY = "traceId";
  public static final String REQUEST_ID_KEY = "requestId";
  public static final String USER_ID_KEY = "userId";
  public static final String CLIENT_IP_KEY = "clientIp";

  private static final String TRACE_ID_HEADER = "X-Trace-Id";
  private static final String REQUEST_ID_HEADER = "X-Request-Id";
  private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    try {
      // Generate or extract traceId
      String traceId = extractOrGenerateTraceId(request);
      String requestId = generateShortId();

      // Add to MDC for logging
      MDC.put(TRACE_ID_KEY, traceId);
      MDC.put(REQUEST_ID_KEY, requestId);
      MDC.put(CLIENT_IP_KEY, getClientIp(request));

      // Add request context
      MDC.put("method", request.getMethod());
      MDC.put("uri", request.getRequestURI());

      // Add traceId to response headers for client correlation
      response.setHeader(TRACE_ID_HEADER, traceId);
      response.setHeader(REQUEST_ID_HEADER, requestId);

      // Continue with the filter chain
      filterChain.doFilter(request, response);

    } finally {
      // Clean up MDC to prevent memory leaks
      MDC.clear();
    }
  }

  /**
   * Extract traceId from incoming headers or generate a new one.
   * Supports multiple header formats for compatibility with various systems.
   */
  private String extractOrGenerateTraceId(HttpServletRequest request) {
    // Check for existing trace headers (in order of preference)
    String traceId = request.getHeader(TRACE_ID_HEADER);
    if (traceId == null || traceId.isBlank()) {
      traceId = request.getHeader(REQUEST_ID_HEADER);
    }
    if (traceId == null || traceId.isBlank()) {
      traceId = request.getHeader(CORRELATION_ID_HEADER);
    }

    // Generate new traceId if none provided
    if (traceId == null || traceId.isBlank()) {
      traceId = generateTraceId();
    }

    return traceId;
  }

  /**
   * Generate a unique trace ID.
   * Format: timestamp-shortUUID for readability and uniqueness
   */
  private String generateTraceId() {
    // Use timestamp prefix for chronological sorting + short UUID for uniqueness
    long timestamp = System.currentTimeMillis();
    String shortUuid = UUID.randomUUID().toString().substring(0, 8);
    return String.format("%d-%s", timestamp, shortUuid);
  }

  /**
   * Generate a short request ID for within-request correlation
   */
  private String generateShortId() {
    return UUID.randomUUID().toString().substring(0, 8);
  }

  /**
   * Extract client IP, handling proxy headers
   */
  private String getClientIp(HttpServletRequest request) {
    String ip = request.getHeader("X-Forwarded-For");
    if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("X-Real-IP");
    }
    if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("Proxy-Client-IP");
    }
    if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getRemoteAddr();
    }

    // Handle multiple IPs (take the first one)
    if (ip != null && ip.contains(",")) {
      ip = ip.split(",")[0].trim();
    }

    return ip != null ? ip : "unknown";
  }
}
