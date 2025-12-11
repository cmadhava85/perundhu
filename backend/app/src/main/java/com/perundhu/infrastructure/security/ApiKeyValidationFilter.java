package com.perundhu.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Set;

/**
 * API Key validation filter for public endpoints
 * Provides an additional layer of protection even for unauthenticated endpoints
 */
@Component
public class ApiKeyValidationFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(ApiKeyValidationFilter.class);

  // Header name for API key
  private static final String API_KEY_HEADER = "X-API-Key";
  private static final String API_KEY_PARAM = "api_key";

  @Value("${security.api-key.enabled:false}")
  private boolean apiKeyEnabled;

  @Value("${security.api-key.public-key:}")
  private String publicApiKey;

  @Value("${security.api-key.strict-mode:false}")
  private boolean strictMode;

  // Paths that always require API key (when enabled)
  private static final Set<String> API_KEY_REQUIRED_PATHS = Set.of(
      "/api/v1/bus-schedules",
      "/api/v1/locations",
      "/api/v1/buses",
      "/api/v1/stops");

  // Paths that never require API key
  private static final Set<String> API_KEY_EXEMPT_PATHS = Set.of(
      "/actuator/health",
      "/actuator/info",
      "/api/v1/auth");

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (!apiKeyEnabled) {
      filterChain.doFilter(request, response);
      return;
    }

    String path = request.getRequestURI();

    // Skip exempt paths
    if (isExemptPath(path)) {
      filterChain.doFilter(request, response);
      return;
    }

    // Check if path requires API key
    boolean requiresApiKey = requiresApiKey(path);

    if (requiresApiKey || strictMode) {
      String apiKey = extractApiKey(request);

      if (apiKey == null || apiKey.isEmpty()) {
        if (strictMode) {
          log.warn("Missing API key for path: {}, IP: {}", path, getClientIp(request));
          sendError(response, HttpStatus.UNAUTHORIZED, "API key required");
          return;
        } else {
          // Non-strict mode: log warning but allow request
          log.debug("No API key provided for path: {} (non-strict mode)", path);
        }
      } else if (!isValidApiKey(apiKey)) {
        log.warn("Invalid API key for path: {}, IP: {}", path, getClientIp(request));
        sendError(response, HttpStatus.UNAUTHORIZED, "Invalid API key");
        return;
      }
    }

    // Add header to indicate API key validation was performed
    response.setHeader("X-API-Key-Validated", apiKeyEnabled ? "true" : "false");

    filterChain.doFilter(request, response);
  }

  private String extractApiKey(HttpServletRequest request) {
    // Try header first
    String apiKey = request.getHeader(API_KEY_HEADER);
    if (apiKey != null && !apiKey.isEmpty()) {
      return apiKey;
    }

    // Try query parameter as fallback
    apiKey = request.getParameter(API_KEY_PARAM);
    return apiKey;
  }

  private boolean isValidApiKey(String providedKey) {
    if (publicApiKey == null || publicApiKey.isEmpty()) {
      log.warn("No public API key configured");
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    return constantTimeEquals(providedKey, publicApiKey);
  }

  private boolean constantTimeEquals(String a, String b) {
    if (a == null || b == null) {
      return false;
    }

    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] hashA = md.digest(a.getBytes());
      md.reset();
      byte[] hashB = md.digest(b.getBytes());

      // Constant time comparison
      int result = 0;
      for (int i = 0; i < hashA.length; i++) {
        result |= hashA[i] ^ hashB[i];
      }
      return result == 0;
    } catch (NoSuchAlgorithmException e) {
      // Fallback to regular comparison (less secure but functional)
      return a.equals(b);
    }
  }

  private boolean requiresApiKey(String path) {
    return API_KEY_REQUIRED_PATHS.stream().anyMatch(path::startsWith);
  }

  private boolean isExemptPath(String path) {
    return API_KEY_EXEMPT_PATHS.stream().anyMatch(path::startsWith);
  }

  private String getClientIp(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  private void sendError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
    response.setStatus(status.value());
    response.setContentType("application/json");
    response.getWriter()
        .write(String.format("{\"error\":\"%s\",\"message\":\"%s\"}", status.getReasonPhrase(), message));
  }
}
