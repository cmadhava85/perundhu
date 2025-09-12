package com.perundhu.adapter.in.rest;

import com.perundhu.domain.port.ContributionInputPort;
import com.perundhu.domain.port.SecurityMonitoringPort;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.application.service.AuthenticationService;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.application.service.ImageContributionProcessingService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

/**
 * Inbound adapter for contribution REST API.
 * Follows strict hexagonal architecture by depending only on domain ports.
 */
@RestController
@RequestMapping("/api/v1/contributions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ContributionController {

  private final ContributionInputPort contributionInputPort;
  private final SecurityMonitoringPort securityMonitoringPort;
  private final InputValidationPort inputValidationPort;
  private final AuthenticationService authenticationService;
  private final ImageContributionProcessingService imageProcessingService;

  /**
   * Submit a route contribution with comprehensive security validation
   */
  @PostMapping("/routes")
  public ResponseEntity<Map<String, Object>> submitRouteContribution(
      @RequestBody Map<String, Object> contributionData,
      HttpServletRequest request) {

    String clientId = getClientId(request);
    String userId = authenticationService.getCurrentUserId();

    // For anonymous users, generate a unique identifier
    if (userId == null || userId.equals("anonymous")) {
      userId = "anonymous_" + clientId;
    }

    try {
      // Security pre-checks using domain port
      if (!performSecurityChecksAnonymous(request, clientId, "route-contribution")) {
        return createSecurityBlockedResponse();
      }

      // Rate limiting check using domain port
      if (!securityMonitoringPort.checkRateLimit(clientId, "contributions", 3, 3600000)) {
        log.warn("Rate limit exceeded for contribution submission: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Please try again later."));
      }

      // Validate and sanitize input data using domain port
      InputValidationPort.ContributionValidationResult validationResult = inputValidationPort
          .validateContributionData(contributionData);

      if (!validationResult.valid()) {
        log.warn("Security validation failed for contribution from user {}: {}", userId,
            validationResult.errors());

        // Record security event using domain port
        securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
            clientId,
            "SECURITY_VALIDATION_FAILURE",
            "HIGH",
            "Security validation failed: " + validationResult.errors(),
            "/api/v1/contributions/routes",
            request.getHeader("User-Agent"),
            LocalDateTime.now()));

        return ResponseEntity.badRequest()
            .body(createValidationErrorResponse(validationResult.errors()));
      }

      // Submit route contribution through input port
      RouteContribution savedContribution = contributionInputPort
          .submitRouteContribution(validationResult.sanitizedValues(), userId);

      // Log security event for successful submission using domain port
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "DATA_SUBMISSION",
          "INFO",
          "Route contribution submitted successfully",
          "/api/v1/contributions/routes",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Route contribution submitted successfully");
      response.put("submissionId", savedContribution.getId());
      response.put("status", savedContribution.getStatus());
      response.put("estimatedProcessingTime", "24-48 hours");

      return ResponseEntity.ok(response);

    } catch (IllegalArgumentException e) {
      log.warn("Validation error for route contribution from user {}: {}", userId, e.getMessage());
      return ResponseEntity.badRequest()
          .body(createErrorResponse(e.getMessage()));

    } catch (Exception e) {
      log.error("Error processing route contribution from user {}: {}", userId, e.getMessage(), e);

      // Log security event for processing error using domain port
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "PROCESSING_ERROR",
          "HIGH",
          "Route contribution processing failed: " + e.getMessage(),
          "/api/v1/contributions/routes",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to process contribution. Please try again."));
    }
  }

  /**
   * Submit an image contribution with enhanced AI/OCR processing
   */
  @PostMapping("/images")
  public ResponseEntity<Map<String, Object>> submitImageContribution(
      @RequestParam("image") MultipartFile imageFile,
      @RequestParam Map<String, String> metadata,
      HttpServletRequest request) {

    String clientId = getClientId(request);
    String userId = authenticationService.getCurrentUserId();

    // For anonymous users, generate a unique identifier
    if (userId == null || userId.equals("anonymous")) {
      userId = "anonymous_" + clientId;
    }

    try {
      log.info("Processing image contribution from user: {}, file: {} (size: {} bytes)",
          userId, imageFile.getOriginalFilename(), imageFile.getSize());

      // Security pre-checks using domain port
      if (!performSecurityChecksAnonymous(request, clientId, "image-contribution")) {
        return createSecurityBlockedResponse();
      }

      // Rate limiting check for image uploads
      if (!securityMonitoringPort.checkRateLimit(clientId, "image-contributions", 5, 3600000)) {
        log.warn("Rate limit exceeded for image contribution submission: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Please try again later."));
      }

      // Validate image file with enhanced security checks
      if (!isValidImageFile(imageFile)) {
        log.warn("Invalid image file submitted by user: {}", userId);
        return ResponseEntity.badRequest()
            .body(
                createErrorResponse("Invalid image file. Please upload a valid JPEG, PNG, or WebP image under 10MB."));
      }

      // Validate metadata using domain port
      Map<String, String> sanitizedMetadata = sanitizeImageMetadata(metadata);

      // Check image content for security threats
      if (!isImageContentSafe(imageFile)) {
        log.warn("Potentially malicious image detected from user: {}", userId);
        securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
            clientId,
            "MALICIOUS_CONTENT",
            "HIGH",
            "Potentially malicious image content detected",
            "/api/v1/contributions/images",
            request.getHeader("User-Agent"),
            LocalDateTime.now()));

        return ResponseEntity.badRequest()
            .body(createErrorResponse(
                "Image content validation failed. Please ensure the image is a valid bus schedule."));
      }

      // Process image contribution with enhanced AI/OCR processing
      ImageContribution contribution = imageProcessingService.processImageContribution(
          imageFile, sanitizedMetadata, userId);

      // Log successful submission
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "IMAGE_SUBMISSION",
          "INFO",
          "Image contribution submitted successfully",
          "/api/v1/contributions/images",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Image contribution submitted successfully and is being processed");
      response.put("contributionId", contribution.getId());
      response.put("status", contribution.getStatus());
      response.put("processingInfo", createProcessingInfoResponse(contribution));

      return ResponseEntity.ok(response);

    } catch (IllegalArgumentException e) {
      log.warn("Validation error for image contribution from user {}: {}", userId, e.getMessage());
      return ResponseEntity.badRequest()
          .body(createErrorResponse(e.getMessage()));

    } catch (Exception e) {
      log.error("Error processing image contribution from user {}: {}", userId, e.getMessage(), e);

      // Log security event for processing error
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "PROCESSING_ERROR",
          "HIGH",
          "Image contribution processing failed: " + e.getMessage(),
          "/api/v1/contributions/images",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to process image contribution. Please try again."));
    }
  }

  /**
   * Get image processing status
   */
  @GetMapping("/images/{contributionId}/status")
  public ResponseEntity<Map<String, Object>> getImageProcessingStatus(
      @PathVariable String contributionId,
      HttpServletRequest request) {

    String userId = authenticationService.getCurrentUserId();
    String clientId = getClientId(request);

    try {
      // Security checks
      if (!performSecurityChecksAnonymous(request, clientId, "image-status")) {
        return createSecurityBlockedResponse();
      }

      // Get image contribution status
      Optional<ImageContribution> optContribution = contributionInputPort.findById(contributionId);
      if (optContribution.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      ImageContribution contribution = optContribution.get();

      // Check if user owns this contribution (or is admin)
      if (!contribution.getUserId().equals(userId) && !isAdminUser(userId)) {
        return ResponseEntity.status(403)
            .body(createErrorResponse("Access denied"));
      }

      Map<String, Object> response = new HashMap<>();
      response.put("contributionId", contribution.getId());
      response.put("status", contribution.getStatus());
      response.put("submissionDate", contribution.getSubmissionDate());
      response.put("processedDate", contribution.getProcessedDate());
      response.put("validationMessage", contribution.getValidationMessage());
      response.put("processingInfo", createDetailedProcessingInfo(contribution));

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error retrieving image processing status for {}: {}", contributionId, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to retrieve processing status"));
    }
  }

  /**
   * Retry failed image processing
   */
  @PostMapping("/images/{contributionId}/retry")
  public ResponseEntity<Map<String, Object>> retryImageProcessing(
      @PathVariable String contributionId,
      HttpServletRequest request) {

    String userId = authenticationService.getCurrentUserId();
    String clientId = getClientId(request);

    try {
      // Security checks
      if (!performSecurityChecks(request, clientId, "retry-processing")) {
        return createSecurityBlockedResponse();
      }

      // Retry processing
      boolean retrySuccess = imageProcessingService.retryImageProcessing(contributionId);

      if (retrySuccess) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Image processing retry initiated");
        response.put("contributionId", contributionId);
        return ResponseEntity.ok(response);
      } else {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Cannot retry processing for this contribution"));
      }

    } catch (Exception e) {
      log.error("Error retrying image processing for {}: {}", contributionId, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to retry processing"));
    }
  }

  /**
   * Get image processing statistics for admin
   */
  @GetMapping("/images/admin/stats")
  public ResponseEntity<Map<String, Object>> getImageProcessingStatistics(
      HttpServletRequest request) {

    String clientId = getClientId(request);

    try {
      // Security checks for admin access
      if (!performSecurityChecks(request, clientId, "admin-image-stats")) {
        return createSecurityBlockedResponse();
      }

      // Get processing statistics
      Map<String, Object> stats = imageProcessingService.getProcessingStatistics();

      return ResponseEntity.ok(stats);

    } catch (Exception e) {
      log.error("Error retrieving image processing statistics: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to retrieve statistics"));
    }
  }

  /**
   * Get contribution status with security validation
   */
  @GetMapping("/status")
  public ResponseEntity<List<Map<String, Object>>> getContributionStatus(
      HttpServletRequest request) {

    String userId = authenticationService.getCurrentUserId();
    String clientId = getClientId(request);

    try {
      // Security checks using domain port
      if (!performSecurityChecks(request, clientId, "contribution-status")) {
        return ResponseEntity.status(403).build();
      }

      // Get user's contributions through input port
      List<Map<String, Object>> contributions = contributionInputPort.getUserContributions(userId);

      // Sanitize sensitive information before returning
      List<Map<String, Object>> sanitizedContributions = contributions.stream()
          .map(this::sanitizeContributionForDisplay)
          .toList();

      return ResponseEntity.ok(sanitizedContributions);

    } catch (Exception e) {
      log.error("Error retrieving contribution status for user {}: {}", userId, e.getMessage(), e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Get all contributions for admin
   */
  @GetMapping("/admin/all")
  public ResponseEntity<List<Map<String, Object>>> getAllContributions(
      HttpServletRequest request) {

    String userId = authenticationService.getCurrentUserId();
    String clientId = getClientId(request);

    try {
      // Security checks for admin access
      if (!performSecurityChecks(request, clientId, "admin-contributions")) {
        return ResponseEntity.status(403).build();
      }

      // Get all contributions through input port
      List<Map<String, Object>> contributions = contributionInputPort.getAllContributions();

      return ResponseEntity.ok(contributions);

    } catch (Exception e) {
      log.error("Error retrieving all contributions: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Approve a contribution
   */
  @PutMapping("/{contributionId}/approve")
  public ResponseEntity<Map<String, Object>> approveContribution(
      @PathVariable String contributionId,
      @RequestParam String type,
      HttpServletRequest request) {

    String adminId = authenticationService.getCurrentUserId();
    String clientId = getClientId(request);

    try {
      // Security checks for admin access
      if (!performSecurityChecks(request, clientId, "approve-contribution")) {
        return ResponseEntity.status(403).build();
      }

      // Approve through input port based on type
      if ("ROUTE".equals(type)) {
        contributionInputPort.approveRouteContribution(contributionId, adminId);
      } else if ("IMAGE".equals(type)) {
        contributionInputPort.approveImageContribution(contributionId, adminId);
      } else {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Invalid contribution type"));
      }

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Contribution approved successfully");

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error approving contribution {}: {}", contributionId, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to approve contribution"));
    }
  }

  /**
   * Reject a contribution
   */
  @PutMapping("/{contributionId}/reject")
  public ResponseEntity<Map<String, Object>> rejectContribution(
      @PathVariable String contributionId,
      @RequestParam String type,
      @RequestParam String reason,
      HttpServletRequest request) {

    String adminId = authenticationService.getCurrentUserId();
    String clientId = getClientId(request);

    try {
      // Security checks for admin access
      if (!performSecurityChecks(request, clientId, "reject-contribution")) {
        return ResponseEntity.status(403).build();
      }

      // Reject through input port based on type
      if ("ROUTE".equals(type)) {
        contributionInputPort.rejectRouteContribution(contributionId, reason, adminId);
      } else if ("IMAGE".equals(type)) {
        contributionInputPort.rejectImageContribution(contributionId, reason, adminId);
      } else {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Invalid contribution type"));
      }

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Contribution rejected successfully");

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error rejecting contribution {}: {}", contributionId, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to reject contribution"));
    }
  }

  /**
   * Get contribution statistics
   */
  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> getContributionStatistics(
      HttpServletRequest request) {

    String clientId = getClientId(request);

    try {
      // Security checks
      if (!performSecurityChecks(request, clientId, "contribution-stats")) {
        return ResponseEntity.status(403).build();
      }

      // Get statistics through input port
      Map<String, Object> stats = contributionInputPort.getContributionStatistics();

      return ResponseEntity.ok(stats);

    } catch (Exception e) {
      log.error("Error retrieving contribution statistics: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError().build();
    }
  }

  // Security helper methods

  /**
   * Security checks for anonymous users - more restrictive but allows
   * contributions
   */
  private boolean performSecurityChecksAnonymous(HttpServletRequest request, String clientId, String operation) {
    // Check if IP is blocked using domain port
    String ipAddress = getClientIpAddress(request);
    if (securityMonitoringPort.isIpBlocked(ipAddress)) {
      log.warn("Blocked IP {} attempted {}", ipAddress, operation);
      return false;
    }

    // Check user agent using domain port
    String userAgent = request.getHeader("User-Agent");
    if (inputValidationPort.isSuspiciousUserAgent(userAgent)) {
      log.warn("Suspicious user agent detected: {}", userAgent);
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "SUSPICIOUS_USER_AGENT",
          "MEDIUM",
          "Suspicious user agent: " + userAgent,
          null,
          userAgent,
          LocalDateTime.now()));
      return false;
    }

    // Allow anonymous contributions - no authentication check required
    return true;
  }

  private boolean performSecurityChecks(HttpServletRequest request, String clientId, String operation) {
    // Check if IP is blocked using domain port
    String ipAddress = getClientIpAddress(request);
    if (securityMonitoringPort.isIpBlocked(ipAddress)) {
      log.warn("Blocked IP {} attempted {}", ipAddress, operation);
      return false;
    }

    // Check user agent using domain port
    String userAgent = request.getHeader("User-Agent");
    if (inputValidationPort.isSuspiciousUserAgent(userAgent)) {
      log.warn("Suspicious user agent detected: {}", userAgent);
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "SUSPICIOUS_USER_AGENT",
          "MEDIUM",
          "Suspicious user agent: " + userAgent,
          null,
          userAgent,
          LocalDateTime.now()));
      return false;
    }

    // Check authentication
    return !authenticationService.getCurrentUserId().equals("anonymous");
  }

  private boolean isValidImageFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      return false;
    }

    // Check file size (max 10MB)
    if (file.getSize() > 10 * 1024 * 1024) {
      return false;
    }

    // Check content type
    String contentType = file.getContentType();
    return contentType != null && (contentType.equals("image/jpeg") ||
        contentType.equals("image/png") ||
        contentType.equals("image/webp"));
  }

  private boolean isImageContentSafe(MultipartFile file) {
    try {
      byte[] content = file.getBytes();

      if (content.length < 4) {
        log.warn("Image file too small: {} bytes", content.length);
        return false;
      }

      return hasValidImageSignature(content);

    } catch (Exception e) {
      log.warn("Error validating image content: {}", e.getMessage());
      return false;
    }
  }

  private boolean hasValidImageSignature(byte[] content) {
    if (content.length < 4)
      return false;

    // JPEG: FF D8 FF
    if (content[0] == (byte) 0xFF && content[1] == (byte) 0xD8 && content[2] == (byte) 0xFF) {
      return true;
    }

    // PNG: 89 50 4E 47
    if (content[0] == (byte) 0x89 && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47) {
      return true;
    }

    // WebP: starts with "RIFF" and contains "WEBP"
    if (content.length >= 12 &&
        content[0] == 0x52 && content[1] == 0x49 && content[2] == 0x46 && content[3] == 0x46 && // "RIFF"
        content[8] == 0x57 && content[9] == 0x45 && content[10] == 0x42 && content[11] == 0x50) { // "WEBP"
      return true;
    }

    return false;
  }

  private Map<String, String> sanitizeImageMetadata(Map<String, String> metadata) {
    Map<String, String> sanitized = new HashMap<>();

    metadata.forEach((key, value) -> {
      String sanitizedKey = inputValidationPort.sanitizeTextInput(key);
      String sanitizedValue = inputValidationPort.sanitizeTextInput(value);

      if (!inputValidationPort.containsMaliciousPatterns(sanitizedKey) &&
          !inputValidationPort.containsMaliciousPatterns(sanitizedValue)) {
        sanitized.put(sanitizedKey, sanitizedValue);
      }
    });

    return sanitized;
  }

  private Map<String, Object> sanitizeContributionForDisplay(Map<String, Object> contribution) {
    Map<String, Object> sanitized = new HashMap<>();

    // Only include safe fields for display
    sanitized.put("id", contribution.get("id"));
    sanitized.put("type", contribution.get("type"));
    sanitized.put("status", contribution.get("status"));
    sanitized.put("submissionDate", contribution.get("submissionDate"));
    sanitized.put("lastUpdated", contribution.get("lastUpdated"));

    // Sanitize route information if present
    if (contribution.containsKey("busNumber")) {
      sanitized.put("busNumber", inputValidationPort.sanitizeTextInput((String) contribution.get("busNumber")));
    }

    if (contribution.containsKey("route")) {
      sanitized.put("route", inputValidationPort.sanitizeTextInput((String) contribution.get("route")));
    }

    return sanitized;
  }

  private String getClientId(HttpServletRequest request) {
    String ip = getClientIpAddress(request);
    String userAgent = request.getHeader("User-Agent");
    return String.valueOf((ip + userAgent).hashCode());
  }

  private String getClientIpAddress(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }

    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
      return xRealIp;
    }

    return request.getRemoteAddr();
  }

  private ResponseEntity<Map<String, Object>> createSecurityBlockedResponse() {
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);
    response.put("error", "ACCESS_DENIED");
    response.put("message", "Access denied due to security restrictions");
    return ResponseEntity.status(403).body(response);
  }

  private Map<String, Object> createErrorResponse(String message) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);
    response.put("error", "VALIDATION_ERROR");
    response.put("message", message);
    return response;
  }

  private Map<String, Object> createValidationErrorResponse(Map<String, String> errors) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);
    response.put("error", "VALIDATION_ERROR");
    response.put("message", "Input validation failed");
    response.put("validationErrors", errors);
    return response;
  }

  private Map<String, Object> createProcessingInfoResponse(ImageContribution contribution) {
    Map<String, Object> processingInfo = new HashMap<>();
    processingInfo.put("estimatedCompletionTime", "2-4 hours");
    processingInfo.put("currentStatus", contribution.getStatus());
    return processingInfo;
  }

  private Map<String, Object> createDetailedProcessingInfo(ImageContribution contribution) {
    Map<String, Object> detailedInfo = new HashMap<>();
    detailedInfo.put("status", contribution.getStatus());
    detailedInfo.put("validationMessage", contribution.getValidationMessage());
    detailedInfo.put("processedDate", contribution.getProcessedDate());
    return detailedInfo;
  }

  private boolean isAdminUser(String userId) {
    // Placeholder for admin user check logic
    return "admin".equals(userId);
  }
}
