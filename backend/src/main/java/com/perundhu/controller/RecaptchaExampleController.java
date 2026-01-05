package com.perundhu.controller;

import com.perundhu.security.RecaptchaValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Example controller showing reCAPTCHA Enterprise integration
 * 
 * Pattern for protecting endpoints with reCAPTCHA validation:
 * 1. Extract X-reCAPTCHA-Token header from request
 * 2. Call recaptchaValidationService.validateToken(token, "ACTION_NAME")
 * 3. Return 403 Forbidden if validation fails
 * 4. Process request normally if validation passes
 */
@RestController
@RequestMapping("/api")
public class RecaptchaExampleController {

  private static final Logger logger = LoggerFactory.getLogger(RecaptchaExampleController.class);

  @Autowired
  private RecaptchaValidationService recaptchaService;

  /**
   * Example: Admin login endpoint with reCAPTCHA protection
   * 
   * Protected actions:
   * - Admin authentication
   * - Database access
   * - Sensitive operations
   */
  @PostMapping("/admin/login")
  public ResponseEntity<?> adminLogin(
      @RequestParam String username,
      @RequestParam String password,
      @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {

    logger.info("Admin login attempt for user: {}", username);

    // Validate reCAPTCHA token for LOGIN action
    if (!recaptchaService.validateToken(recaptchaToken, "LOGIN")) {
      logger.warn("Admin login failed reCAPTCHA validation for user: {}", username);
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(new ApiError("reCAPTCHA validation failed", "Security check failed. Please try again."));
    }

    // Validate credentials (your existing authentication logic here)
    // if (!authenticateUser(username, password)) {
    // return ResponseEntity.status(401).body(new ApiError("Invalid credentials"));
    // }

    logger.info("Admin login successful for user: {}", username);
    return ResponseEntity.ok(new ApiResponse("Login successful", true));
  }

  /**
   * Example: Route contribution endpoint with reCAPTCHA protection
   * 
   * Protected actions:
   * - User submissions
   * - Contribution data validation
   * - Database writes
   */
  @PostMapping("/v1/contributions/routes")
  public ResponseEntity<?> submitRouteContribution(
      @RequestBody RouteContributionRequest request,
      @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {

    logger.info("Route contribution submission from user");

    // Validate reCAPTCHA token for SUBMIT_CONTRIBUTION action
    if (!recaptchaService.validateToken(recaptchaToken, "SUBMIT_CONTRIBUTION")) {
      logger.warn("Route contribution failed reCAPTCHA validation");
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(new ApiError("reCAPTCHA validation failed", "Security check failed. Please try again."));
    }

    // Validate contribution data
    if (!isValidContribution(request)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(new ApiError("Invalid contribution", "Please check your input and try again."));
    }

    // Save contribution to database (your existing logic here)
    // contributionService.saveRoute(request);

    logger.info("Route contribution submitted successfully");
    return ResponseEntity.ok(new ApiResponse("Contribution submitted", true));
  }

  /**
   * Example: Image contribution endpoint with reCAPTCHA protection
   */
  @PostMapping("/v1/contributions/images")
  public ResponseEntity<?> submitImageContribution(
      @RequestParam String busName,
      @RequestParam String busNumber,
      @RequestParam String fromLocation,
      @RequestParam String toLocation,
      @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {

    logger.info("Image contribution submission");

    // Validate reCAPTCHA token for SUBMIT_CONTRIBUTION action
    if (!recaptchaService.validateToken(recaptchaToken, "SUBMIT_CONTRIBUTION")) {
      logger.warn("Image contribution failed reCAPTCHA validation");
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(new ApiError("reCAPTCHA validation failed", "Security check failed. Please try again."));
    }

    // Process image contribution (your existing logic here)
    // imageService.saveContribution(busName, busNumber, fromLocation, toLocation);

    logger.info("Image contribution submitted successfully");
    return ResponseEntity.ok(new ApiResponse("Image submitted", true));
  }

  /**
   * Example: Search endpoint with reCAPTCHA protection (optional)
   * Use when search queries need protection against abuse
   */
  @GetMapping("/search")
  public ResponseEntity<?> searchRoutes(
      @RequestParam String from,
      @RequestParam String to,
      @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {

    // Validate reCAPTCHA token for SEARCH action
    if (!recaptchaService.validateToken(recaptchaToken, "SEARCH")) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(new ApiError("reCAPTCHA validation failed"));
    }

    // Execute search (your existing logic here)
    // List<Route> results = routeService.search(from, to);

    return ResponseEntity.ok(new ApiResponse("Search completed", true));
  }

  // Helper methods
  private boolean isValidContribution(RouteContributionRequest request) {
    return request != null &&
        request.getBusName() != null && !request.getBusName().isEmpty() &&
        request.getFromLocation() != null && !request.getFromLocation().isEmpty() &&
        request.getToLocation() != null && !request.getToLocation().isEmpty();
  }

  // Simple DTOs
  public static class RouteContributionRequest {
    private String busName;
    private String busNumber;
    private String fromLocation;
    private String toLocation;
    private String departureTime;
    private String arrivalTime;

    // Getters and setters
    public String getBusName() {
      return busName;
    }

    public void setBusName(String busName) {
      this.busName = busName;
    }

    public String getBusNumber() {
      return busNumber;
    }

    public void setBusNumber(String busNumber) {
      this.busNumber = busNumber;
    }

    public String getFromLocation() {
      return fromLocation;
    }

    public void setFromLocation(String fromLocation) {
      this.fromLocation = fromLocation;
    }

    public String getToLocation() {
      return toLocation;
    }

    public void setToLocation(String toLocation) {
      this.toLocation = toLocation;
    }

    public String getDepartureTime() {
      return departureTime;
    }

    public void setDepartureTime(String departureTime) {
      this.departureTime = departureTime;
    }

    public String getArrivalTime() {
      return arrivalTime;
    }

    public void setArrivalTime(String arrivalTime) {
      this.arrivalTime = arrivalTime;
    }
  }

  public static class ApiError {
    private String error;
    private String message;
    private long timestamp;

    public ApiError(String error) {
      this.error = error;
      this.message = error;
      this.timestamp = System.currentTimeMillis();
    }

    public ApiError(String error, String message) {
      this.error = error;
      this.message = message;
      this.timestamp = System.currentTimeMillis();
    }

    // Getters
    public String getError() {
      return error;
    }

    public String getMessage() {
      return message;
    }

    public long getTimestamp() {
      return timestamp;
    }
  }

  public static class ApiResponse {
    private String message;
    private boolean success;

    public ApiResponse(String message, boolean success) {
      this.message = message;
      this.success = success;
    }

    // Getters
    public String getMessage() {
      return message;
    }

    public boolean isSuccess() {
      return success;
    }
  }
}
