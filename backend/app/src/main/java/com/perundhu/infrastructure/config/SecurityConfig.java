package com.perundhu.infrastructure.config;

import java.util.List;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.perundhu.infrastructure.security.AdminBasicAuthFilter;
import com.perundhu.infrastructure.security.ApiKeyValidationFilter;
import com.perundhu.infrastructure.security.OriginValidationFilter;
import com.perundhu.infrastructure.security.RateLimitingFilter;

import lombok.extern.slf4j.Slf4j;

/**
 * Security configuration with proper JWT handling for both development and
 * production. Includes rate limiting, origin validation, and API key
 * protection.
 */
@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile("!prod") // Only active in non-production environments (dev, test, preprod)
public class SecurityConfig {

  @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
  private String jwkSetUri;

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}")
  private String issuerUri;

  @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173}")
  private String allowedOrigins;

  private final RateLimitingFilter rateLimitingFilter;
  private final OriginValidationFilter originValidationFilter;
  private final ApiKeyValidationFilter apiKeyValidationFilter;
  private final AdminBasicAuthFilter adminBasicAuthFilter;

  public SecurityConfig(RateLimitingFilter rateLimitingFilter,
      OriginValidationFilter originValidationFilter,
      ApiKeyValidationFilter apiKeyValidationFilter,
      AdminBasicAuthFilter adminBasicAuthFilter) {
    this.rateLimitingFilter = rateLimitingFilter;
    this.originValidationFilter = originValidationFilter;
    this.apiKeyValidationFilter = apiKeyValidationFilter;
    this.adminBasicAuthFilter = adminBasicAuthFilter;
  }

  @Bean
  public SecurityContextRepository securityContextRepository() {
    // Shared repository for admin authentication
    // This bean is injected into both AdminBasicAuthFilter and SecurityFilterChains
    // Using RequestAttributeSecurityContextRepository for stateless admin auth
    return new RequestAttributeSecurityContextRepository();
  }

  @Bean
  @Order(1) // Higher priority - matches admin endpoints first
  public SecurityFilterChain adminSecurityFilterChain(
      HttpSecurity http,
      SecurityContextRepository securityContextRepository) throws Exception {
    // CSRF protection configuration
    XorCsrfTokenRequestAttributeHandler csrfTokenRequestAttributeHandler = new XorCsrfTokenRequestAttributeHandler();
    csrfTokenRequestAttributeHandler.setCsrfRequestAttributeName("_csrf");

    http
        // Only match admin endpoints
        .securityMatcher("/admin/**", "/api/admin/**", "/v1/admin/**")
        // Configure security context repository to use request attributes
        .securityContext(context -> context.securityContextRepository(securityContextRepository))
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(csrfTokenRequestAttributeHandler)
            .ignoringRequestMatchers(
                "/admin/**", // All admin endpoints (Protected by Basic Auth)
                "/api/admin/**", // API admin endpoints
                "/v1/admin/**")) // Admin v1 endpoints
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // Disable anonymous authentication - admin endpoints require explicit auth
        .anonymous(anonymous -> anonymous.disable())
        // Add security filters - admin basic auth is key here
        .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(originValidationFilter, RateLimitingFilter.class)
        .addFilterAfter(apiKeyValidationFilter, OriginValidationFilter.class)
        .addFilterAfter(adminBasicAuthFilter, ApiKeyValidationFilter.class)
        .authorizeHttpRequests(authz -> authz
            // Admin auth endpoints are public (for login)
            .requestMatchers("/admin/auth/**", "/api/admin/auth/**").permitAll()
            // All other admin endpoints require authentication (role check via
            // @PreAuthorize in controllers)
            .anyRequest().authenticated());

    // NO OAuth2 resource server for admin endpoints - they use BasicAuth via
    // AdminBasicAuthFilter

    return http.build();
  }

  @Bean
  @Order(2) // Lower priority - matches everything else after admin filter chain
  public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
    // CSRF protection: Use HttpOnly=false so JavaScript can read the token for AJAX
    // requests
    XorCsrfTokenRequestAttributeHandler csrfTokenRequestAttributeHandler = new XorCsrfTokenRequestAttributeHandler();
    csrfTokenRequestAttributeHandler.setCsrfRequestAttributeName("_csrf");

    http
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(csrfTokenRequestAttributeHandler)
            .ignoringRequestMatchers(
                "/v1/analytics/**", // Analytics can be without CSRF (stateless API)
                "/v1/contributions/analyze-image", // Image analysis is stateless
                "/v1/contributions/paste/validate", // Validation endpoint (read-only)
                "/v1/contributions/paste", // Paste contributions (public write with built-in security)
                "/v1/contributions/images", // Image contributions (public write with built-in security)
                "/v1/contributions/voice/transcribe", // Voice transcription (read-only, no persistence)
                "/v1/contributions/routes", // Anonymous route contributions (public write with built-in security)
                "/v1/contributions/routes/stops", // Anonymous stop contributions (public write)
                "/v1/contributions/buses/**", // Anonymous bus contributions (public write)
                "/v1/contributions/stops/**", // Anonymous stop contributions (public write)
                "/v1/duplicates/**", // Duplicate check is stateless (read-only validation)
                "/v1/route-issues", // Public route issue submission (includes CSRF via reCAPTCHA)
                "/v1/route-issues/**", // Route issue endpoints with wildcard
                "/admin/auth/**", // Admin auth endpoints (login/logout with built-in security)
                "/api/admin/auth/**" // Admin auth endpoints with /api prefix
            ))
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // Add security filters before authentication
        .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(originValidationFilter, RateLimitingFilter.class)
        .addFilterAfter(apiKeyValidationFilter, OriginValidationFilter.class)
        // Add admin basic auth filter after API key validation
        .addFilterAfter(adminBasicAuthFilter, ApiKeyValidationFilter.class)
        .authorizeHttpRequests(authz -> authz
            // Public endpoints
            .requestMatchers("/v1/csrf/**").permitAll() // CSRF endpoint (must be public)
            .requestMatchers("/v1/bus-schedules/**").permitAll()
            .requestMatchers("/v1/analytics/**").permitAll()
            .requestMatchers("/v1/contributions/analyze-image").permitAll()
            .requestMatchers("/v1/contributions/routes").permitAll() // Allow anonymous route contributions
            .requestMatchers("/v1/contributions/routes/stops").permitAll() // Allow anonymous stop contributions to
                                                                           // existing routes
            .requestMatchers("/v1/contributions/buses/**").permitAll() // Allow anonymous bus contributions
            .requestMatchers("/v1/contributions/stops/**").permitAll() // Allow anonymous stop contributions
            .requestMatchers("/v1/buses/**").permitAll()
            .requestMatchers("/v1/stops/**").permitAll()
            .requestMatchers("/v1/locations/**").permitAll()
            .requestMatchers("/images/**").permitAll() // Allow public access to images
            .requestMatchers("/actuator/health").permitAll()
            // Protected endpoints - user management
            .requestMatchers("/v1/contributions/manage/**").authenticated()
            // Route issues endpoints - public for reporting, admin handled by separate
            // filter chain
            .requestMatchers("/v1/route-issues/report").permitAll()
            // Allow all other requests for development
            .anyRequest().permitAll());

    // Configure OAuth2 Resource Server with JWT for API endpoints (admin endpoints
    // handled separately)
    http.oauth2ResourceServer(oauth2 -> oauth2
        .jwt(jwt -> jwt
            .decoder(jwtDecoder)
            .jwtAuthenticationConverter(jwtAuthenticationConverter()))
        .authenticationEntryPoint((request, response, authException) -> {
          // API endpoints need JWT
          response.setStatus(401);
          response.setHeader("WWW-Authenticate", "Bearer");
          response.setContentType("application/json");
          response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"JWT token required\",\"status\":401}");
        }));

    return http.build();
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();

    // Configure to read authorities from both 'authorities' and 'roles' claims
    authoritiesConverter.setAuthoritiesClaimName("authorities");
    authoritiesConverter.setAuthorityPrefix(""); // No prefix since our authorities already have ROLE_

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);

    return converter;
  }

  @Bean
  public JwtDecoder jwtDecoder() {
    if (hasJwtConfiguration()) {
      return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    } else {
      // For development and test: create a mock JWT decoder
      return new MockJwtDecoder();
    }
  }

  private boolean hasJwtConfiguration() {
    return jwkSetUri != null && !jwkSetUri.trim().isEmpty() &&
        issuerUri != null && !issuerUri.trim().isEmpty();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // Parse allowed origins from configuration
    List<String> origins = List.of(allowedOrigins.split(","));
    configuration.setAllowedOriginPatterns(origins);

    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
    configuration.setAllowedHeaders(List.of(
        "Authorization", "Content-Type", "X-Requested-With", "X-API-Key", "Accept-Language",
        "X-reCAPTCHA-Token", "X-Form-Timestamp",
        "X-Trace-Id", "X-Session-Id", "X-Request-Id",
        "X-CSRF-TOKEN", "X-XSRF-TOKEN")); // CSRF tokens headers
    configuration.setExposedHeaders(List.of(
        "X-Request-ID", "X-Security-Level", "X-Rate-Limit-Remaining",
        "X-Trace-Id", "X-Session-Id", "X-Request-Id",
        "X-CSRF-TOKEN", "X-XSRF-TOKEN")); // Expose CSRF headers to client
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    // Use BCryptPasswordEncoder directly since our database hashes don't have {bcrypt} prefix
    // DelegatingPasswordEncoder would require {bcrypt} prefix in password_hash column
    return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
  }

  /**
   * Database-backed UserDetailsService using JdbcUserDetailsManager.
   * Replaces InMemoryUserDetailsManager for production-grade admin authentication.
   * 
   * Benefits:
   * - No redeployment needed to change credentials
   * - BCrypt password hashing (secure)
   * - Multiple admin users supported
   * - Credentials stored in admin_users table
   * 
   * Schema: V100__create_admin_users_table.sql
   */
  @Bean
  public UserDetailsService userDetailsService(DataSource dataSource) {
    JdbcUserDetailsManager userDetailsManager = new JdbcUserDetailsManager(dataSource);
    
    // Custom queries for admin_users table
    userDetailsManager.setUsersByUsernameQuery(
        "SELECT username, password_hash as password, enabled " +
        "FROM admin_users WHERE username = ?"
    );
    
    userDetailsManager.setAuthoritiesByUsernameQuery(
        "SELECT username, role as authority FROM ( " +
        "  SELECT username, " +
        "    TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(roles, ',', numbers.n), ',', -1)) as role " +
        "  FROM admin_users " +
        "  CROSS JOIN ( " +
        "    SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 " +
        "  ) numbers " +
        "  WHERE CHAR_LENGTH(roles) - CHAR_LENGTH(REPLACE(roles, ',', '')) >= numbers.n - 1 " +
        ") roles " +
        "WHERE username = ?"
    );
    
    log.info("Configured database-backed UserDetailsService with admin_users table");
    return userDetailsManager;
  }

  @Bean
  public AuthenticationManager authenticationManager(
      UserDetailsService userDetailsService,
      PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
    authenticationProvider.setUserDetailsService(userDetailsService);
    authenticationProvider.setPasswordEncoder(passwordEncoder);

    log.info("Configured AuthenticationManager with database-backed UserDetailsService");
    return new ProviderManager(authenticationProvider);
  }
}