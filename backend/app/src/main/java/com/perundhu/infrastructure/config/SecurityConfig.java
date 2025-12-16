package com.perundhu.infrastructure.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.perundhu.infrastructure.security.AdminBasicAuthFilter;
import com.perundhu.infrastructure.security.ApiKeyValidationFilter;
import com.perundhu.infrastructure.security.OriginValidationFilter;
import com.perundhu.infrastructure.security.RateLimitingFilter;

/**
 * Security configuration with proper JWT handling for both development and
 * production. Includes rate limiting, origin validation, and API key
 * protection.
 */
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
  public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
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
            .requestMatchers("/api/v1/bus-schedules/**").permitAll()
            .requestMatchers("/api/v1/analytics/**").permitAll()
            .requestMatchers("/api/v1/contributions/analyze-image").permitAll()
            .requestMatchers("/api/v1/contributions/routes").permitAll() // Allow anonymous route contributions
            .requestMatchers("/api/v1/contributions/routes/stops").permitAll() // Allow anonymous stop contributions to existing routes
            .requestMatchers("/api/v1/contributions/buses/**").permitAll() // Allow anonymous bus contributions
            .requestMatchers("/api/v1/contributions/stops/**").permitAll() // Allow anonymous stop contributions
            .requestMatchers("/api/v1/buses/**").permitAll()
            .requestMatchers("/api/v1/stops/**").permitAll()
            .requestMatchers("/api/v1/locations/**").permitAll()
            .requestMatchers("/api/images/**").permitAll() // Allow public access to images
            .requestMatchers("/actuator/health").permitAll()
            // Protected endpoints - user management and admin
            .requestMatchers("/api/v1/contributions/manage/**").authenticated()
            // Admin endpoints require authentication (role check via @PreAuthorize)
            .requestMatchers("/api/v1/admin/**").authenticated()
            .requestMatchers("/api/admin/**").authenticated()
            // Route issues endpoints - public for reporting, admin for management
            .requestMatchers("/api/v1/route-issues/report").permitAll()
            .requestMatchers("/api/v1/route-issues/admin/**").authenticated()
            // Allow all other requests for development
            .anyRequest().permitAll());

    // Configure OAuth2 Resource Server with JWT for development
    http.oauth2ResourceServer(oauth2 -> oauth2
        .jwt(jwt -> jwt
            .decoder(jwtDecoder)
            .jwtAuthenticationConverter(jwtAuthenticationConverter())));

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
        "X-Recaptcha-Token", "X-Form-Timestamp",
        "X-Trace-Id", "X-Session-Id", "X-Request-Id")); // Distributed tracing headers
    configuration.setExposedHeaders(List.of(
        "X-Request-ID", "X-Security-Level", "X-Rate-Limit-Remaining",
        "X-Trace-Id", "X-Session-Id", "X-Request-Id")); // Expose tracing headers to client
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }
}