package com.perundhu.adapter.in.rest;

import com.perundhu.infrastructure.security.RecaptchaValidationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * Contribution endpoints with reCAPTCHA protection.
 * Protects route and image contributions from bot abuse.
 * 
 * NOTE: This controller is kept for reference but routes/images endpoints
 * are handled by ContributionController.java which has the full implementation
 * including database persistence and OCR processing.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/contributions-security")
public class ContributionSecurityController {

  @Autowired
  private RecaptchaValidationService recaptchaValidationService;

  // Inject your actual contribution service here
  // @Autowired
  // private ContributionService contributionService;

  /**
   * Submit route contribution with reCAPTCHA protection.
   *
   * @param contributionData Route contribution data
   * @param recaptchaToken   reCAPTCHA Enterprise token from frontend
   * @return Submission response
   */
  @PostMapping("/routes")
  public ResponseEntity<?> submitRoute(
      @RequestBody RouteContributionRequest contributionData,
      @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {

    log.info("Route contribution submission received from: {}", contributionData.getBusName());

    // Validate reCAPTCHA token for submission action
    if (!recaptchaValidationService.validateToken(recaptchaToken, "SUBMIT_CONTRIBUTION")) {
      log.warn("Route contribution rejected: reCAPTCHA validation failed for bus: {}",
          contributionData.getBusName());
      return ResponseEntity
          .status(HttpStatus.FORBIDDEN)
          .body(errorResponse("reCAPTCHA validation failed",
              "Security validation failed. Please try again."));
    }

    try {
      // Validate request data
      if (!isValidRouteContribution(contributionData)) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse("Invalid data", "Please provide all required fields"));
      }

      // Process contribution (delegate to service)
      // RouteContribution saved = contributionService.submitRoute(contributionData);
      log.info("Route contribution accepted for bus: {}", contributionData.getBusName());

      return ResponseEntity.ok(successResponse(
          "Route contribution submitted successfully",
          Map.of(
              "busName", contributionData.getBusName(),
              "status", "pending_review")));

    } catch (Exception e) {
      log.error("Error processing route contribution: {}", e.getMessage(), e);
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(errorResponse("Submission error", "Failed to process your contribution"));
    }
  }

  /**
   * Submit image contribution with reCAPTCHA protection.
   *
   * @param image          Image file containing bus schedule
   * @param busName        Bus name
   * @param busNumber      Bus number
   * @param recaptchaToken reCAPTCHA Enterprise token from frontend
   * @return Submission response
   */
  @PostMapping("/images")
  public ResponseEntity<?> submitImage(
      @RequestParam("image") MultipartFile image,
      @RequestParam("busName") String busName,
      @RequestParam("busNumber") String busNumber,
      @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {

    log.info("Image contribution submission received for bus: {}", busName);

    // Validate reCAPTCHA token for submission action
    if (!recaptchaValidationService.validateToken(recaptchaToken, "SUBMIT_CONTRIBUTION")) {
      log.warn("Image contribution rejected: reCAPTCHA validation failed for bus: {}", busName);
      return ResponseEntity
          .status(HttpStatus.FORBIDDEN)
          .body(errorResponse("reCAPTCHA validation failed",
              "Security validation failed. Please try again."));
    }

    try {
      // Validate image
      if (image.isEmpty()) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse("Invalid image", "Please upload an image file"));
      }

      if (!isValidImageFile(image)) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse("Invalid image", "Only JPEG and PNG images are allowed"));
      }

      // Process image contribution (delegate to service)
      // ImageContribution saved = contributionService.submitImage(image, busName,
      // busNumber);
      log.info("Image contribution accepted for bus: {}", busName);

      return ResponseEntity.ok(successResponse(
          "Image contribution submitted successfully",
          Map.of(
              "busName", busName,
              "status", "pending_review")));

    } catch (Exception e) {
      log.error("Error processing image contribution: {}", e.getMessage(), e);
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(errorResponse("Submission error", "Failed to process your image"));
    }
  }

  // ===== Helper Methods =====

  private boolean isValidRouteContribution(RouteContributionRequest request) {
    return request != null &&
        request.getBusName() != null && !request.getBusName().isEmpty() &&
        request.getFromLocationName() != null && !request.getFromLocationName().isEmpty() &&
        request.getToLocationName() != null && !request.getToLocationName().isEmpty();
  }

  private boolean isValidImageFile(MultipartFile file) {
    String contentType = file.getContentType();
    return contentType != null &&
        (contentType.equals("image/jpeg") ||
            contentType.equals("image/png") ||
            contentType.equals("image/jpg"));
  }

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
   * Route Contribution Request DTO.
   */
  public static class RouteContributionRequest {
    private String busName;
    private String busNumber;
    private String fromLocationName;
    private String toLocationName;
    private String departureTime;
    private String arrivalTime;

    // Getters and Setters
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

    public String getFromLocationName() {
      return fromLocationName;
    }

    public void setFromLocationName(String fromLocationName) {
      this.fromLocationName = fromLocationName;
    }

    public String getToLocationName() {
      return toLocationName;
    }

    public void setToLocationName(String toLocationName) {
      this.toLocationName = toLocationName;
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
}
