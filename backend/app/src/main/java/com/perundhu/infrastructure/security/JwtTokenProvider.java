package com.perundhu.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Provider for JWT token operations
 */
@Component
@Slf4j
public class JwtTokenProvider {

  @Value("${app.jwtSecret:defaultSecretKeyForDevelopmentPleaseChangeInProduction}")
  private String jwtSecret;

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

    return Jwts.builder()
        .setSubject(username)
        .claim("roles", roles)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(getSigningKey(), SignatureAlgorithm.HS512)
        .compact();
  }

  /**
   * Get the username from a JWT token
   *
   * @param token The JWT token
   * @return The username
   */
  public String getUsernameFromToken(String token) {
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();

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
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();

    List<String> roles = (List<String>) claims.get("roles");

    return roles.stream()
        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
        .collect(Collectors.toList());
  }

  /**
   * Validate a JWT token
   *
   * @param token The JWT token to validate
   * @return True if the token is valid, false otherwise
   */
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
      return true;
    } catch (Exception ex) {
      log.error("Invalid JWT token", ex);
      return false;
    }
  }

  /**
   * Get the signing key for JWT tokens
   *
   * @return The signing key
   */
  private Key getSigningKey() {
    byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
    return Keys.hmacShaKeyFor(keyBytes);
  }
}