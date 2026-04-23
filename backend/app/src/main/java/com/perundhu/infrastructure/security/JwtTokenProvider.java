package com.perundhu.infrastructure.security;

import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Provider for JWT token operations
 */
@Component
public class JwtTokenProvider {

  private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

  @Value("${app.jwtSecret}")
  private String jwtSecret;

  @PostConstruct
  public void validateConfig() {
    if (jwtSecret == null || jwtSecret.isBlank()) {
      throw new IllegalStateException("app.jwtSecret must be configured (set JWT_SECRET env var)");
    }
    try {
      Decoders.BASE64.decode(jwtSecret);
    } catch (IllegalArgumentException e) {
      throw new IllegalStateException("app.jwtSecret is not valid Base64 — token operations will fail", e);
    }
  }

  @Value("${app.jwtExpirationInMs:86400000}")
  private int jwtExpirationInMs;

  /**
   * Generate a JWT token for a user
   *
   * @param username The username
   * @param roles    The user's roles
   * @return The generated JWT token
   */
  public String generateToken(String username, List<String> roles) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

    List<String> authorities = roles.stream().map(r -> "ROLE_" + r).toList();

    return Jwts.builder()
        .subject(username)
        .claim("authorities", authorities)
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(getSigningKey(), Jwts.SIG.HS256)
        .compact();
  }

  /**
   * Get the username from a JWT token
   *
   * @param token The JWT token
   * @return The username
   */
  public String getUsernameFromToken(String token) {
    Claims claims = Jwts.parser()
        .verifyWith(getSigningKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();

    return claims.getSubject();
  }

  /**
   * Get the authorities (roles) from a JWT token
   *
   * @param token The JWT token
   * @return The list of authorities
   */
  @SuppressWarnings("unchecked")
  public List<SimpleGrantedAuthority> getAuthoritiesFromToken(String token) {
    Claims claims = Jwts.parser()
        .verifyWith(getSigningKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();

    List<String> authorities = (List<String>) claims.get("authorities");

    return authorities.stream()
        .map(SimpleGrantedAuthority::new)
        .toList();
  }

  /**
   * Validate a JWT token
   *
   * @param token The JWT token to validate
   * @return True if the token is valid, false otherwise
   */
  public boolean validateToken(String token) {
    try {
      Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
      return true;
    } catch (Exception ex) {
      log.debug("JWT token validation failed: {}", ex.getMessage());
      return false;
    }
  }

  /**
   * Get the signing key for JWT tokens
   *
   * @return The signing key
   */
  private SecretKey getSigningKey() {
    byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
    return Keys.hmacShaKeyFor(keyBytes);
  }
}