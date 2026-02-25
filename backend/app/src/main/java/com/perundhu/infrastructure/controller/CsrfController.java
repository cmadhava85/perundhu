package com.perundhu.infrastructure.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * CSRF Token endpoint for frontend consumption
 * Provides CSRF token for stateful operations
 */
@RestController
@RequestMapping("/v1/csrf")
public class CsrfController {

  /**
   * Get CSRF token for frontend
   * Called before any state-changing operations (POST, PUT, DELETE)
   * 
   * @param token The CSRF token from Spring Security
   * @return Token details
   */
  @GetMapping("/token")
  public CsrfTokenResponse getCsrfToken(CsrfToken token) {
    return new CsrfTokenResponse(
        token.getToken(),
        token.getHeaderName(),
        token.getParameterName());
  }

  /**
   * DTO for CSRF token response
   */
  public record CsrfTokenResponse(
      String token,
      String headerName,
      String parameterName) {
  }
}
