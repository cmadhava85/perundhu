package com.perundhu.adapter.in.rest;

import com.perundhu.infrastructure.security.RecaptchaValidationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Admin Authentication Controller with reCAPTCHA protection.
 * Handles admin login with security validation.
 */
@Slf4j
@RestController
@RequestMapping("/admin/auth")
public class AdminAuthController {

  @Autowired(required = false)
  private AuthenticationManager authenticationManager;

  @Autowired(required = false)
  private RecaptchaValidationService recaptchaValidationService;

  /**
   * Admin login endpoint with reCAPTCHA protection.
   * Validates reCAPTCHA token before processing credentials.
   *
   * @param loginRequest   Login credentials
   * @param recaptchaToken reCAPTCHA Enterprise token from frontend
   * @return Authentication response with JWT token
   */
  @PostMapping("/login")
  public ResponseEntity<?> login(
      @RequestBody LoginRequest loginRequest,
      @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {

    log.info("Admin login attempt for user: {}", loginRequest.getUsername());

    // Validate reCAPTCHA token
    if (recaptchaValidationService != null && !recaptchaValidationService.validateToken(recaptchaToken, "LOGIN")) {
      log.warn("Admin login failed: reCAPTCHA validation failed for user: {}", loginRequest.getUsername());
      return ResponseEntity
          .status(HttpStatus.FORBIDDEN)
          .body(errorResponse("reCAPTCHA validation failed", "Security validation failed. Please try again."));
    }

    try {
      // Authenticate user
      if (authenticationManager == null) {
        log.warn("Authentication manager not available");
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorResponse("Authentication error", "Authentication service not available"));
      }

      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(
              loginRequest.getUsername(),
              loginRequest.getPassword()));

      // Set authentication context
      SecurityContextHolder.getContext().setAuthentication(authentication);

      log.info("Admin login successful for user: {}", loginRequest.getUsername());

      // Return success response
      return ResponseEntity.ok(successResponse(
          "Login successful",
          Map.of("username", loginRequest.getUsername())));

    } catch (BadCredentialsException e) {
      log.warn("Admin login failed: Invalid credentials for user: {}", loginRequest.getUsername());
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .body(errorResponse("Invalid credentials", "Username or password is incorrect"));

    } catch (Exception e) {
      log.error("Admin login error: {}", e.getMessage(), e);
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(errorResponse("Authentication error", "An error occurred during login"));
    }
  }

  /**
   * Check authentication status.
   * Can be called without reCAPTCHA token as it's just checking session status.
   *
   * @return Current authentication status
   */
  @GetMapping("/status")
  public ResponseEntity<?> checkStatus() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
      return ResponseEntity.ok(successResponse("Authenticated", Map.of(
          "username", auth.getName(),
          "authenticated", true)));
    }

    return ResponseEntity.ok(successResponse("Not authenticated", Map.of(
        "authenticated", false)));
  }

  /**
   * Admin logout endpoint.
   *
   * @return Logout confirmation
   */
  @PostMapping("/logout")
  public ResponseEntity<?> logout() {
    SecurityContextHolder.clearContext();
    log.info("Admin logout successful");
    return ResponseEntity.ok(successResponse("Logout successful", null));
  }

  // ===== Helper Methods =====

  private Map<String, Object> successResponse(String message, Map<String, ?> data) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", true);
    response.put("message", message);
    response.put("timestamp", System.currentTimeMillis());
    if (data != null) {
      response.put("data", data);
    }
    return response;
  }

  private Map<String, Object> errorResponse(String error, String message) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);
    response.put("error", error);
    response.put("message", message);
    response.put("timestamp", System.currentTimeMillis());
    return response;
  }

  /**
   * Login request DTO.
   */
  public static class LoginRequest {
    private String username;
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(String username, String password) {
      this.username = username;
      this.password = password;
    }

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }
}
