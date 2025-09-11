package com.perundhu.infrastructure.security;

import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * JWT Token Utility for generating and validating JWT tokens
 */
@Component
public class JwtTokenUtil implements Serializable {

  private static final long serialVersionUID = -2550185165626007488L;

  public static final long JWT_TOKEN_VALIDITY = 5 * 60 * 60; // 5 hours

  @Value("${jwt.secret:perundhu-secret-key-change-in-production}")
  private String secret;

  // Retrieve username from jwt token
  public String getUsernameFromToken(String token) {
    return getClaimFromToken(token, Claims::getSubject);
  }

  // Retrieve expiration date from jwt token
  public Date getExpirationDateFromToken(String token) {
    return getClaimFromToken(token, Claims::getExpiration);
  }

  public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
    final Claims claims = getAllClaimsFromToken(token);
    return claimsResolver.apply(claims);
  }

  // For retrieving any information from token we will need the secret key
  private Claims getAllClaimsFromToken(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
  }

  // Check if the token has expired
  private Boolean isTokenExpired(String token) {
    final Date expiration = getExpirationDateFromToken(token);
    return expiration.before(new Date());
  }

  // Generate token for user
  public String generateToken(String username) {
    Map<String, Object> claims = new HashMap<>();
    return createToken(claims, username);
  }

  // While creating the token -
  // 1. Define claims of the token, like Issuer, Expiration, Subject, and the ID
  // 2. Sign the JWT using the HS512 algorithm and secret key.
  private String createToken(Map<String, Object> claims, String subject) {
    return Jwts.builder()
        .setClaims(claims)
        .setSubject(subject)
        .setIssuedAt(new Date(System.currentTimeMillis()))
        .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
        .signWith(getSigningKey(), SignatureAlgorithm.HS512)
        .compact();
  }

  // Validate token
  public Boolean validateToken(String token) {
    try {
      final String username = getUsernameFromToken(token);
      return (username != null && !isTokenExpired(token));
    } catch (Exception e) {
      return false;
    }
  }

  private SecretKey getSigningKey() {
    byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(keyBytes);
  }
}