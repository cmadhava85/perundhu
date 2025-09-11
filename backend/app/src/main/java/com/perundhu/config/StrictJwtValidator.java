package com.perundhu.config;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Strict JWT validator with enhanced security checks to prevent token tampering
 */
public class StrictJwtValidator implements OAuth2TokenValidator<Jwt> {

  private static final Logger log = LoggerFactory.getLogger(StrictJwtValidator.class);

  // Allowed issuers (restrict to your auth providers only)
  private static final Set<String> ALLOWED_ISSUERS = Set.of(
      "https://auth.perundhu.com",
      "https://accounts.google.com",
      "https://login.microsoftonline.com");

  // Required claims for route access
  private static final Set<String> REQUIRED_CLAIMS = Set.of(
      "sub", "email", "roles", "iat", "exp");

  @Override
  public OAuth2TokenValidatorResult validate(Jwt jwt) {
    try {
      // Check token expiration with buffer
      if (!isTokenValid(jwt)) {
        log.warn("Token validation failed for subject: {}", jwt.getSubject());
        return OAuth2TokenValidatorResult.failure(
            new OAuth2Error("invalid_token", "Token is expired or invalid", null));
      }

      // Validate issuer
      if (!isValidIssuer(jwt)) {
        log.warn("Invalid issuer in token: {}", jwt.getIssuer());
        return OAuth2TokenValidatorResult.failure(
            new OAuth2Error("invalid_issuer", "Token issuer not trusted", null));
      }

      // Check required claims
      if (!hasRequiredClaims(jwt)) {
        log.warn("Missing required claims in token for subject: {}", jwt.getSubject());
        return OAuth2TokenValidatorResult.failure(
            new OAuth2Error("missing_claims", "Token missing required claims", null));
      }

      // Validate roles format
      if (!hasValidRoles(jwt)) {
        log.warn("Invalid roles in token for subject: {}", jwt.getSubject());
        return OAuth2TokenValidatorResult.failure(
            new OAuth2Error("invalid_roles", "Token contains invalid roles", null));
      }

      // Check for suspicious patterns
      if (hasSuspiciousPatterns(jwt)) {
        log.warn("Suspicious patterns detected in token for subject: {}", jwt.getSubject());
        return OAuth2TokenValidatorResult.failure(
            new OAuth2Error("suspicious_token", "Token contains suspicious patterns", null));
      }

      log.debug("Token validation successful for subject: {}", jwt.getSubject());
      return OAuth2TokenValidatorResult.success();

    } catch (Exception e) {
      log.error("Token validation error", e);
      return OAuth2TokenValidatorResult.failure(
          new OAuth2Error("validation_error", "Token validation failed", null));
    }
  }

  private boolean isTokenValid(Jwt jwt) {
    Instant now = Instant.now();

    // Check expiration with 30-second buffer
    Instant expiration = jwt.getExpiresAt();
    if (expiration == null || now.isAfter(expiration.minusSeconds(30))) {
      return false;
    }

    // Check issued at time (not too far in the future)
    Instant issuedAt = jwt.getIssuedAt();
    if (issuedAt == null || issuedAt.isAfter(now.plusSeconds(60))) {
      return false;
    }

    // Check token age (max 24 hours for route access)
    if (issuedAt.isBefore(now.minusSeconds(86400))) {
      return false;
    }

    return true;
  }

  private boolean isValidIssuer(Jwt jwt) {
    String issuer = jwt.getIssuer().toString();
    return ALLOWED_ISSUERS.contains(issuer);
  }

  private boolean hasRequiredClaims(Jwt jwt) {
    for (String claim : REQUIRED_CLAIMS) {
      if (!jwt.hasClaim(claim) || jwt.getClaim(claim) == null) {
        return false;
      }
    }
    return true;
  }

  private boolean hasValidRoles(Jwt jwt) {
    try {
      List<String> roles = jwt.getClaimAsStringList("roles");
      if (roles == null || roles.isEmpty()) {
        return false;
      }

      // Validate each role
      Set<String> validRoles = Set.of("GUEST", "USER", "VERIFIED", "PREMIUM", "ADMIN");
      for (String role : roles) {
        if (!validRoles.contains(role.toUpperCase())) {
          return false;
        }
      }

      return true;
    } catch (Exception e) {
      return false;
    }
  }

  private boolean hasSuspiciousPatterns(Jwt jwt) {
    // Check for suspiciously long claims (potential injection)
    String email = jwt.getClaimAsString("email");
    if (email != null && email.length() > 254) {
      return true;
    }

    String subject = jwt.getSubject();
    if (subject != null && subject.length() > 100) {
      return true;
    }

    // Check for suspicious email patterns
    if (email != null && isSuspiciousEmail(email)) {
      return true;
    }

    // Check for too many roles (potential privilege escalation)
    List<String> roles = jwt.getClaimAsStringList("roles");
    if (roles != null && roles.size() > 3) {
      return true;
    }

    return false;
  }

  private boolean isSuspiciousEmail(String email) {
    // Check for common disposable email domains
    String[] disposableDomains = {
        "tempmail.org", "10minutemail.com", "guerrillamail.com",
        "mailinator.com", "trash-mail.com", "throwaway.email"
    };

    String domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
    for (String disposable : disposableDomains) {
      if (domain.equals(disposable)) {
        return true;
      }
    }

    // Check for suspicious patterns
    if (email.contains("..") || email.startsWith(".") || email.endsWith(".")) {
      return true;
    }

    return false;
  }
}