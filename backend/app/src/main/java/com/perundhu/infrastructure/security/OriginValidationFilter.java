package com.perundhu.infrastructure.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
 * Filter to validate request origin and prevent direct API access from unknown
 * sources
 * This adds an extra layer of protection beyond CORS
 */
@Component
public class OriginValidationFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(OriginValidationFilter.class);

  @Value("${security.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173,https://perundhu.app,https://www.perundhu.app}")
  private String allowedOriginsConfig;

  @Value("${security.origin-validation.enabled:true}")
  private boolean originValidationEnabled;

  @Value("${security.origin-validation.strict-mode:false}")
  private boolean strictMode;

  // Paths that should always be accessible (health checks, etc.)
  private static final Set<String> ALWAYS_ALLOWED_PATHS = Set.of(
      "/actuator/health",
      "/actuator/info");

  // Paths that require strict origin validation (write operations)
  private static final Set<String> STRICT_VALIDATION_PATHS = Set.of(
      "/api/v1/contributions",
      "/api/v1/route-issues/report");

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (!originValidationEnabled) {
      filterChain.doFilter(request, response);
      return;
    }

    String path = request.getRequestURI();
    String method = request.getMethod();

    // Allow preflight requests
    if ("OPTIONS".equalsIgnoreCase(method)) {
      filterChain.doFilter(request, response);
      return;
    }

    // Always allow health check endpoints
    if (ALWAYS_ALLOWED_PATHS.stream().anyMatch(path::startsWith)) {
      filterChain.doFilter(request, response);
      return;
    }

    // Get origin and referer headers
    String origin = request.getHeader("Origin");
    String referer = request.getHeader("Referer");

    // Parse allowed origins
    List<String> allowedOrigins = parseAllowedOrigins();

    // Validate origin for write operations (POST, PUT, DELETE, PATCH)
    boolean isWriteOperation = isWriteOperation(method);
    boolean requiresStrictValidation = requiresStrictValidation(path) || isWriteOperation;

    if (requiresStrictValidation) {
      if (!isValidOrigin(origin, referer, allowedOrigins)) {
        log.warn("Origin validation failed - Origin: {}, Referer: {}, Path: {}, IP: {}",
            origin, referer, path, getClientIp(request));

        if (strictMode) {
          response.setStatus(HttpStatus.FORBIDDEN.value());
          response.setContentType("application/json");
          response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Request origin not allowed\"}");
          return;
        } else {
          // In non-strict mode, log but allow (for gradual rollout)
          log.warn("Origin validation would have blocked request (strict mode disabled)");
        }
      }
    }

    // Add security headers
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("X-XSS-Protection", "1; mode=block");

    filterChain.doFilter(request, response);
  }

  private List<String> parseAllowedOrigins() {
    return Arrays.stream(allowedOriginsConfig.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toList());
  }

  private boolean isWriteOperation(String method) {
    return "POST".equalsIgnoreCase(method) ||
        "PUT".equalsIgnoreCase(method) ||
        "DELETE".equalsIgnoreCase(method) ||
        "PATCH".equalsIgnoreCase(method);
  }

  private boolean requiresStrictValidation(String path) {
    return STRICT_VALIDATION_PATHS.stream().anyMatch(path::startsWith);
  }

  private boolean isValidOrigin(String origin, String referer, List<String> allowedOrigins) {
    // Check origin header
    if (origin != null && !origin.isEmpty()) {
      for (String allowed : allowedOrigins) {
        if (origin.equals(allowed) || matchesPattern(origin, allowed)) {
          return true;
        }
      }
    }

    // Check referer as fallback (some browsers don't send Origin for same-origin
    // requests)
    if (referer != null && !referer.isEmpty()) {
      for (String allowed : allowedOrigins) {
        if (referer.startsWith(allowed)) {
          return true;
        }
      }
    }

    // If no origin or referer, check if it's a server-to-server request (no browser
    // headers)
    // This is a fallback for legitimate API clients
    if (origin == null && referer == null) {
      // Could be a mobile app or server-to-server call
      // In strict mode, we reject; in non-strict mode, we allow with logging
      return false;
    }

    return false;
  }

  private boolean matchesPattern(String origin, String pattern) {
    // Support wildcard patterns like https://*.perundhu.app
    if (pattern.contains("*")) {
      String regex = pattern.replace(".", "\\.").replace("*", ".*");
      return origin.matches(regex);
    }
    return origin.equals(pattern);
  }

  private String getClientIp(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
