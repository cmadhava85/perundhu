package com.perundhu.config;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Mock JWT decoder for development environments
 * Creates valid JWT tokens for testing without requiring OAuth2 setup
 */
public class MockJwtDecoder implements JwtDecoder {

  private static final Logger log = LoggerFactory.getLogger(MockJwtDecoder.class);

  @Override
  public Jwt decode(String token) throws JwtException {
    log.debug("MockJwtDecoder: Decoding token for development environment");

    // Create a mock JWT with realistic claims
    Map<String, Object> headers = new HashMap<>();
    headers.put("alg", "RS256");
    headers.put("typ", "JWT");

    Map<String, Object> claims = new HashMap<>();

    // Check if this is an admin token request (any token in development can be
    // admin)
    if (token.contains("admin") || token.equals("dev-admin-token")) {
      // Create admin user for admin panel access
      claims.put("sub", "dev-admin-123");
      claims.put("email", "admin@perundhu.com");
      claims.put("name", "Development Admin");
      claims.put("roles", List.of("USER", "VERIFIED", "ADMIN"));
      // Add Spring Security authorities with ROLE_ prefix
      claims.put("authorities", List.of("ROLE_USER", "ROLE_VERIFIED", "ROLE_ADMIN"));
      log.info("MockJwtDecoder: Creating ADMIN token for development");
    } else {
      // Create regular user
      claims.put("sub", "dev-user-123");
      claims.put("email", "developer@perundhu.com");
      claims.put("name", "Development User");
      claims.put("roles", List.of("USER", "VERIFIED"));
      // Add Spring Security authorities with ROLE_ prefix
      claims.put("authorities", List.of("ROLE_USER", "ROLE_VERIFIED"));
      log.info("MockJwtDecoder: Creating USER token for development");
    }

    claims.put("iss", "https://auth.perundhu.com");
    claims.put("aud", "perundhu-api");

    Instant now = Instant.now();
    claims.put("iat", now);
    claims.put("exp", now.plusSeconds(3600)); // 1 hour expiry
    claims.put("nbf", now);

    return Jwt.withTokenValue(token)
        .headers(h -> h.putAll(headers))
        .claims(c -> c.putAll(claims))
        .build();
  }
}