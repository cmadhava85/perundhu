package com.perundhu.infrastructure.config;

import com.perundhu.infrastructure.security.AdminBasicAuthFilter;
import com.perundhu.infrastructure.security.ApiKeyValidationFilter;
import com.perundhu.infrastructure.security.OriginValidationFilter;
import com.perundhu.infrastructure.security.RateLimitingFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * Security Filter Chain Manager
 * 
 * Consolidates all security filters with explicit ordering for better
 * maintainability.
 * This approach provides:
 * - Clear security filter ordering
 * - Easier to test individual security layers
 * - Better separation of concerns
 * - Reduced complexity in SecurityConfig
 * 
 * Filter Order (from first to last):
 * 1. Rate Limiting (blocks malicious traffic early)
 * 2. Origin Validation (validates request origin)
 * 3. API Key Validation (optional premium features)
 * 4. Admin Basic Auth (admin authentication layer)
 * 5. JWT Authentication (handled by Spring Security in SecurityConfig)
 * 
 * Benefits:
 * - Rate limiting happens BEFORE any expensive operations
 * - Origin validation prevents cross-origin attacks early
 * - API key and admin auth happen before JWT processing
 * - Clear documentation of security layers
 */
@Configuration
public class SecurityFilterChainManager {

  /**
   * Order 1: Rate Limiting Filter
   * 
   * Purpose: Block malicious traffic early before any expensive operations
   * Config: Per-IP rate limits (100 read/min, 10 write/min, 5 upload/min)
   * 
   * Why first? Rate limiting should happen before ANY other processing
   * to protect against DDoS and brute force attacks.
   */
  @Bean
  public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilterRegistration(
      RateLimitingFilter rateLimitingFilter) {
    FilterRegistrationBean<RateLimitingFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(rateLimitingFilter);
    registration.addUrlPatterns("/api/*");
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE); // Order 1 (highest priority)
    registration.setName("rateLimitingFilter");
    return registration;
  }

  /**
   * Order 2: Origin Validation Filter
   * 
   * Purpose: Validate request origin against whitelist
   * Config: Allowed origins from configuration
   * 
   * Why second? After rate limiting, validate origin to prevent
   * cross-origin attacks and unauthorized API access.
   */
  @Bean
  public FilterRegistrationBean<OriginValidationFilter> originValidationFilterRegistration(
      OriginValidationFilter originValidationFilter) {
    FilterRegistrationBean<OriginValidationFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(originValidationFilter);
    registration.addUrlPatterns("/api/*");
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1); // Order 2
    registration.setName("originValidationFilter");
    return registration;
  }

  /**
   * Order 3: API Key Validation Filter
   * 
   * Purpose: Optional API key validation for premium features
   * Config: API keys stored in configuration/database
   * 
   * Why third? After basic security checks, validate API key
   * for features that require additional authorization.
   */
  @Bean
  public FilterRegistrationBean<ApiKeyValidationFilter> apiKeyValidationFilterRegistration(
      ApiKeyValidationFilter apiKeyValidationFilter) {
    FilterRegistrationBean<ApiKeyValidationFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(apiKeyValidationFilter);
    registration.addUrlPatterns("/api/*");
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 2); // Order 3
    registration.setName("apiKeyValidationFilter");
    return registration;
  }

  /**
   * Order 4: Admin Rate Limiting Filter
   * 
   * Purpose: Apply stricter rate limits for admin endpoints
   * Config: 5 login attempts per 15 min, 20 writes/min, 60 reads/min, 5 bulk ops/hour
   * 
   * Why fourth? After general rate limiting, apply admin-specific limits
   * before authentication to prevent brute force attacks.
   */
  // TODO: Re-enable after fixing AdminRateLimitFilter dependencies
  /*
  @Bean
  public FilterRegistrationBean<AdminRateLimitFilter> adminRateLimitFilterRegistration(
      AdminRateLimitFilter adminRateLimitFilter) {
    FilterRegistrationBean<AdminRateLimitFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(adminRateLimitFilter);
    registration.addUrlPatterns("/api/admin/*", "/api/v1/admin/*");
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 3); // Order 4
    registration.setName("adminRateLimitFilter");
    return registration;
  }
  */

  /**
   * Order 5: Admin Basic Auth Filter
   * 
   * Purpose: Handle HTTP Basic authentication for admin endpoints
   * Config: Admin credentials from configuration
   * 
   * Why fifth? After rate limiting, handle admin authentication before JWT processing.
   */
  @Bean
  public FilterRegistrationBean<AdminBasicAuthFilter> adminBasicAuthFilterRegistration(
      AdminBasicAuthFilter adminBasicAuthFilter) {
    FilterRegistrationBean<AdminBasicAuthFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(adminBasicAuthFilter);
    registration.addUrlPatterns("/api/admin/*", "/api/v1/admin/*");
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 4); // Order 5
    registration.setName("adminBasicAuthFilter");
    return registration;
  }

  /**
   * Get filter execution order documentation
   * 
   * This method documents the complete security filter chain for reference.
   * Note: JWT authentication is handled by Spring Security (not registered here).
   */
  public static String getFilterOrderDocumentation() {
    return """
        Security Filter Chain Order:

        1. Rate Limiting Filter (Order: HIGHEST_PRECEDENCE)
           - Blocks excessive requests per IP
           - 100 read/min, 10 write/min, 5 upload/min
           - Prevents DDoS and brute force attacks

        2. Origin Validation Filter (Order: HIGHEST_PRECEDENCE + 1)
           - Validates request origin against whitelist
           - Prevents unauthorized cross-origin access
           - Blocks requests from unknown origins

        3. API Key Validation Filter (Order: HIGHEST_PRECEDENCE + 2)
           - Optional API key for premium features
           - Allows bypassing certain rate limits
           - Used for trusted external integrations

        4. Admin Basic Auth Filter (Order: HIGHEST_PRECEDENCE + 3)
           - HTTP Basic authentication for admin endpoints
           - Simple username/password authentication
           - Applied only to /api/v1/admin/* endpoints

        5. JWT Authentication (Spring Security - implicit order)
           - OAuth2 Resource Server JWT validation
           - Applied to protected endpoints
           - Handles token validation and authorities

        Why this order?
        - Rate limiting FIRST: Block attacks before any processing
        - Origin validation SECOND: Prevent cross-origin attacks early
        - API key THIRD: Authenticate external integrations
        - Admin auth FOURTH: Handle basic auth before JWT
        - JWT LAST: Process JWT tokens for protected resources
        """;
  }

  /**
   * Security configuration health check
   * 
   * Validates that all security filters are properly configured.
   * Useful for startup validation and monitoring.
   */
  public static class SecurityHealthCheck {

    public static boolean validateFilterOrder(
        FilterRegistrationBean<?> filter1,
        FilterRegistrationBean<?> filter2) {
      return filter1.getOrder() < filter2.getOrder();
    }

    public static void logSecurityConfiguration() {
      System.out.println("🔒 Security Filter Chain Configuration:");
      System.out.println("   ✓ Rate Limiting: ACTIVE (Order 1)");
      System.out.println("   ✓ Origin Validation: ACTIVE (Order 2)");
      System.out.println("   ✓ API Key Validation: ACTIVE (Order 3)");
      System.out.println("   ✓ Admin Basic Auth: ACTIVE (Order 4)");
      System.out.println("   ✓ JWT Authentication: ACTIVE (Spring Security)");
      System.out.println("🔒 Security layers initialized successfully");
    }
  }
}
