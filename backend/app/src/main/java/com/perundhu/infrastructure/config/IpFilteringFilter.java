package com.perundhu.infrastructure.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Advanced IP filtering to prevent unauthorized access and data theft
 * Blocks known malicious IPs, bot networks, and suspicious patterns
 * Using in-memory implementation for simplicity
 */
@Component
public class IpFilteringFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(IpFilteringFilter.class);

  @Value("${security.ip-filtering.enabled:true}")
  private boolean enabled;

  @Value("${spring.profiles.active:}")
  private String activeProfile;

  // Trust calls coming from known frontend origins for read-only endpoints
  @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173}")
  private String allowedOriginsConfig;

  // In-memory storage for IP tracking
  private final Set<String> blockedIps = ConcurrentHashMap.newKeySet();
  private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, Long> requestTimes = new ConcurrentHashMap<>();

  // Known malicious IP patterns and bot networks
  private static final List<Pattern> BLOCKED_IP_PATTERNS = List.of(
      // Common bot networks and scrapers
      Pattern.compile("^5\\.188\\..*"), // Known bot network
      Pattern.compile("^185\\.220\\..*"), // Tor exit nodes
      Pattern.compile("^198\\.98\\..*"), // VPN/Proxy range
      Pattern.compile("^192\\.42\\.116\\..*"), // Tor relay
      // Add more patterns as needed
      Pattern.compile("^10\\.0\\.0\\..*"), // Internal networks (should not reach public API)
      Pattern.compile("^172\\.16\\..*"), // Private networks
      Pattern.compile("^192\\.168\\..*") // Local networks
  );

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    if (!enabled) {
      filterChain.doFilter(request, response);
      return;
    }

    String clientIp = getClientIpAddress(request);
    String userAgent = request.getHeader("User-Agent");
    String requestUri = request.getRequestURI();
    String origin = request.getHeader("Origin");
    String referer = request.getHeader("Referer");
    String method = request.getMethod();
    String authHeader = request.getHeader("Authorization");

    // Skip filtering for admin auth endpoints (they have their own security)
    if (requestUri != null && requestUri.startsWith("/api/admin/auth/")) {
      filterChain.doFilter(request, response);
      return;
    }

    // Skip IP filtering for authenticated admin requests (Basic or Bearer auth)
    if (authHeader != null && (authHeader.startsWith("Basic ") || authHeader.startsWith("Bearer "))) {
      log.debug("Skipping IP filtering for authenticated admin request: {}", requestUri);
      filterChain.doFilter(request, response);
      return;
    }

    // Skip IP filtering for validation/analysis endpoints that use POST but don't
    // modify state
    // These are preview/validation endpoints that should be treated as read-only
    if (isValidationEndpoint(requestUri) && isApiPath(requestUri)
        && (isAllowedOrigin(origin) || isAllowedReferer(referer))) {
      log.debug("Allowing validation endpoint from allowed origin: {} - Method: {}", requestUri, method);
      filterChain.doFilter(request, response);
      return;
    }

    // Skip IP filtering for state-changing POST endpoints from allowed frontend
    // origins
    // These endpoints include contributions, route issues, etc. that require user
    // interaction
    // and are submitted from the frontend with proper CSRF protection
    if (isStateChangingContributionEndpoint(requestUri) && "POST".equalsIgnoreCase(method) && isApiPath(requestUri)
        && (isAllowedOrigin(origin) || isAllowedReferer(referer))) {
      log.debug("Allowing contribution endpoint from allowed origin: {} - Method: {}", requestUri, method);
      filterChain.doFilter(request, response);
      return;
    }

    // If this is a read-only API call from an allowed frontend origin,
    // skip IP-based blocking to avoid false positives behind Cloud Run proxies.
    // Many browsers omit Origin header for simple GET image requests, but include
    // Referer.
    // Accept either Origin or Referer for allowed frontend domains to avoid false
    // 403 blocks.
    if (isReadOnlyMethod(method) && isApiPath(requestUri) && (isAllowedOrigin(origin) || isAllowedReferer(referer))) {
      filterChain.doFilter(request, response);
      return;
    }

    // Check if IP is blocked
    if (isIpBlocked(clientIp, userAgent, requestUri)) {
      log.warn("Blocked request from IP: {} - User-Agent: {} - URI: {}",
          clientIp, userAgent, requestUri);

      response.setStatus(403);
      response.setContentType("application/json");
      response.getWriter().write(
          "{\"error\":\"Access denied\",\"message\":\"Request blocked for security reasons\"}");
      return;
    }

    // Track legitimate requests for pattern analysis
    trackRequest(clientIp, userAgent, requestUri);

    filterChain.doFilter(request, response);
  }

  private boolean isReadOnlyMethod(String method) {
    return "GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method);
  }

  private boolean isApiPath(String uri) {
    return uri != null && uri.startsWith("/api/");
  }

  /**
   * Check if URI is a validation/analysis endpoint that uses POST but doesn't
   * modify state.
   * These endpoints should be treated as read-only for IP filtering purposes.
   */
  private boolean isValidationEndpoint(String uri) {
    if (uri == null) {
      return false;
    }
    // Validation endpoints that use POST but are read-only (no state changes)
    return uri.equals("/api/v1/contributions/paste/validate") || // Paste validation (preview only)
        uri.equals("/api/v1/contributions/analyze-image") || // Image analysis (no persistence)
        uri.equals("/api/v1/contributions/voice/transcribe") || // Voice transcription (no persistence)
        uri.startsWith("/api/v1/analytics/"); // Analytics queries (read-only aggregations)
  }

  /**
   * Check if URI is a state-changing contribution endpoint that accepts POST
   * submissions from users.
   * These are legitimate user contributions that should be allowed from frontend
   * origins.
   */
  private boolean isStateChangingContributionEndpoint(String uri) {
    if (uri == null) {
      return false;
    }
    // User contribution endpoints (POST to submit data)
    return uri.equals("/api/v1/contributions/routes") || // Submit route contributions
        uri.equals("/api/v1/contributions/routes/stops") || // Submit stop contributions to routes
        uri.equals("/api/v1/contributions/paste") || // Submit paste/text contributions
                                                     // uri.equals("/api/v1/contributions/images") || // Submit image
                                                     // contributions uri.equals("/api/v1/contributions/buses") || //
                                                     // Submit bus contributions
        uri.startsWith("/api/v1/contributions/buses/") || // Bus contribution sub-paths
        uri.equals("/api/v1/contributions/stops") || // Submit stop contributions
        uri.startsWith("/api/v1/contributions/stops/") || // Stop contribution sub-paths
        uri.equals("/api/v1/route-issues/report") || // Report route issues
        uri.startsWith("/api/v1/route-issues"); // Route issues management
  }

  private boolean isAllowedOrigin(String origin) {
    if (origin == null || origin.isBlank()) {
      return false;
    }
    List<String> allowedOrigins = Arrays.stream(allowedOriginsConfig.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toList();

    for (String allowed : allowedOrigins) {
      if (origin.equals(allowed) || matchesPattern(origin, allowed)) {
        return true;
      }
    }
    return false;
  }

  private boolean isAllowedReferer(String referer) {
    if (referer == null || referer.isBlank()) {
      return false;
    }
    List<String> allowedOrigins = Arrays.stream(allowedOriginsConfig.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toList();

    for (String allowed : allowedOrigins) {
      // Referer will include path; ensure it starts with allowed origin
      if (referer.startsWith(allowed) || matchesPattern(referer, allowed)) {
        return true;
      }
    }
    return false;
  }

  private boolean matchesPattern(String origin, String pattern) {
    if (pattern.contains("*")) {
      String regex = pattern.replace(".", "\\.").replace("*", ".*");
      return origin.matches(regex);
    }
    return origin.equals(pattern);
  }

  private String getClientIpAddress(HttpServletRequest request) {
    // Check various headers for real IP (in order of preference)
    String[] headers = {
        "CF-Connecting-IP", // Cloudflare
        "X-Original-Forwarded-For",
        "X-Forwarded-For",
        "X-Real-IP",
        "X-Client-IP",
        "X-Forwarded",
        "X-Cluster-Client-IP",
        "Forwarded-For",
        "Forwarded"
    };

    for (String header : headers) {
      String ip = request.getHeader(header);
      if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
        // Take the first IP if multiple are present
        if (ip.contains(",")) {
          ip = ip.split(",")[0].trim();
        }
        if (isValidIp(ip)) {
          return ip;
        }
      }
    }

    return request.getRemoteAddr();
  }

  private boolean isIpBlocked(String clientIp, String userAgent, String requestUri) {
    // Allow localhost and local development IPs
    if (isLocalhost(clientIp) || "dev".equals(activeProfile)) {
      return false;
    }

    // Check blocked IP patterns
    for (Pattern pattern : BLOCKED_IP_PATTERNS) {
      if (pattern.matcher(clientIp).matches()) {
        return true;
      }
    }

    // Check if IP is in in-memory blacklist
    if (blockedIps.contains(clientIp)) {
      return true;
    }

    // Check for suspicious user agents
    if (isSuspiciousUserAgent(userAgent)) {
      // Add IP to temporary blacklist
      addToTemporaryBlacklist(clientIp, "Suspicious user agent");
      return true;
    }

    // Check for route data scraping patterns
    if (isScrapingPattern(requestUri, userAgent)) {
      addToTemporaryBlacklist(clientIp, "Scraping pattern detected");
      return true;
    }

    // Check request frequency
    return isHighFrequencyRequest(clientIp);
  }

  private boolean isLocalhost(String ip) {
    if (ip == null) {
      return false;
    }
    // Check for various localhost formats
    return ip.equals("127.0.0.1") ||
        ip.equals("::1") ||
        ip.equals("0:0:0:0:0:0:0:1") ||
        ip.equals("localhost") ||
        ip.startsWith("127.") ||
        ip.equals("0.0.0.0");
  }

  private boolean isSuspiciousUserAgent(String userAgent) {
    if (userAgent == null || userAgent.trim().isEmpty()) {
      return true; // Block requests without user agent
    }

    // Allow curl and other tools in development profile
    if ("dev".equals(activeProfile)) {
      return false;
    }

    String ua = userAgent.toLowerCase();

    // Known scraping tools and bots
    String[] suspiciousPatterns = {
        "wget", "curl", "python", "scrapy", "beautifulsoup", "requests",
        "bot", "spider", "crawler", "scraper", "harvest", "extract",
        "download", "fetch", "grab", "collect", "mine", "parse",
        "selenium", "phantomjs", "headless", "automated"
    };

    for (String pattern : suspiciousPatterns) {
      if (ua.contains(pattern)) {
        return true;
      }
    }

    // Check for unusual user agent patterns
    return ua.length() < 10 || ua.length() > 512;
  }

  private boolean isScrapingPattern(String requestUri, String userAgent) {
    if (!requestUri.startsWith("/api/")) {
      return false;
    }

    // Detect rapid sequential requests to route endpoints
    if (requestUri.contains("/buses/") || requestUri.contains("/stops/") ||
        requestUri.contains("/search/")) {

      // Flag known scraping patterns
      if (userAgent != null && userAgent.toLowerCase().contains("python")) {
        return true;
      }
    }

    return false;
  }

  private boolean isHighFrequencyRequest(String clientIp) {
    long currentTime = System.currentTimeMillis();
    String key = "ip_freq:" + clientIp;

    // Clean old entries (older than 1 minute)
    requestTimes.entrySet().removeIf(entry -> currentTime - entry.getValue() > 60000);

    AtomicInteger count = requestCounts.computeIfAbsent(key, k -> new AtomicInteger(0));
    requestTimes.put(key, currentTime);

    return count.incrementAndGet() > 100; // More than 100 requests per minute
  }

  private void addToTemporaryBlacklist(String clientIp, String reason) {
    blockedIps.add(clientIp);

    // Log the blocking
    log.warn("Added IP {} to temporary blacklist. Reason: {}", clientIp, reason);

    // Schedule removal after 24 hours (simplified implementation)
    // In production, you'd want a more sophisticated cleanup mechanism
  }

  private void trackRequest(String clientIp, String userAgent, String requestUri) {
    // Track legitimate requests for pattern analysis
    if (requestUri.startsWith("/api/")) {
      // Simple tracking implementation
      log.debug("Legitimate request from {}: {}", clientIp, requestUri);
    }
  }

  /**
   * Enhanced validation using Java 17 compatible switch expressions
   */
  private boolean isValidIp(String ip) {
    if (ip == null || ip.isEmpty()) {
      return false;
    }

    String[] parts = ip.split("\\.");
    if (parts.length != 4) {
      return false;
    }

    return Arrays.stream(parts)
        .allMatch(part -> {
          try {
            int num = Integer.parseInt(part);
            return num >= 0 && num <= 255;
          } catch (NumberFormatException e) {
            return false;
          }
        });
  }
}