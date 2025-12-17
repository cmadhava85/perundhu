package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.perundhu.adapter.out.cache.InMemoryImageHashRepository;
import com.perundhu.infrastructure.security.RecaptchaService;
import com.perundhu.application.service.AuthenticationService;
import com.perundhu.application.service.ImageContributionProcessingService;
import com.perundhu.application.service.PasteContributionValidator;
import com.perundhu.application.service.RouteTextParser;
import com.perundhu.application.service.TextFormatNormalizer;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ContributionInputPort;
import com.perundhu.domain.port.GeminiVisionService;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.domain.port.SecurityMonitoringPort;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Inbound adapter for contribution REST API.
 * Follows strict hexagonal architecture by depending only on domain ports.
 */
@RestController
@RequestMapping("/api/v1/contributions")
@RequiredArgsConstructor
@Slf4j

public class ContributionController {

  private final ContributionInputPort contributionInputPort;
  private final SecurityMonitoringPort securityMonitoringPort;
  private final InputValidationPort inputValidationPort;
  private final AuthenticationService authenticationService;
  private final ImageContributionProcessingService imageProcessingService;
  private final RouteTextParser routeTextParser;
  private final PasteContributionValidator pasteValidator;
  private final TextFormatNormalizer textNormalizer;
  private final InMemoryImageHashRepository imageHashRepository;
  private final RecaptchaService recaptchaService;
  private final GeminiVisionService geminiVisionService;

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

      // Honeypot check (bot detection)
      String honeypot = (String) contributionData.get("website");
      if (honeypot != null && !honeypot.isEmpty()) {
        log.warn("Bot detected via honeypot in manual contribution from IP: {}", request.getRemoteAddr());
        // Return fake success to confuse bot
        Map<String, Object> fakeResponse = new HashMap<>();
        fakeResponse.put("success", true);
        fakeResponse.put("message", "Contribution received");
        return ResponseEntity.ok(fakeResponse);
      }

      // Rate limiting check using domain port
      if (!securityMonitoringPort.checkRateLimit(clientId, "contributions", 3, 3600000)) {
        log.warn("Rate limit exceeded for contribution submission: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Please try again later."));
      }

      // CAPTCHA verification for new users (placeholder - integrate with Google
      // reCAPTCHA or similar)
      // CAPTCHA verification for anonymous/new users
      String captchaToken = extractCaptchaToken(request, (String) contributionData.get("captchaToken"));
      if (recaptchaService.isEnabled()) {
        // Require CAPTCHA for new users (less than 5 approved contributions)
        // TODO: Get user contribution count from database
        // int userContributionCount =
        // contributionInputPort.getApprovedContributionCount(userId);
        // if (userContributionCount < 5 && !recaptchaService.verifyToken(captchaToken,
        // "manual_contribution")) {
        if (captchaToken != null && !recaptchaService.verifyToken(captchaToken, "manual_contribution")) {
          log.warn("CAPTCHA verification failed for user: {}", userId);
          return ResponseEntity.status(403).body(createErrorResponse("CAPTCHA verification failed"));
        }
      }

      // Duplicate detection - hash key fields to prevent identical submissions
      // Duplicate detection - hash key fields to prevent identical submissions
      String duplicateCheckHash = generateContributionHash(
          (String) contributionData.get("busNumber"),
          (String) contributionData.get("fromLocationName"),
          (String) contributionData.get("toLocationName"),
          (String) contributionData.get("departureTime"));

      // Check for duplicate within 24-hour window
      if (imageHashRepository.isDuplicate(duplicateCheckHash)) {
        String originalContributionId = imageHashRepository.getContributionId(duplicateCheckHash);
        log.warn("Duplicate manual contribution detected: hash={}, original={}",
            duplicateCheckHash, originalContributionId);
        return ResponseEntity.status(409)
            .body(createErrorResponse("Duplicate contribution detected. This route was already submitted recently."));
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

      // Store hash to prevent duplicates within 24 hours
      imageHashRepository.storeHash(duplicateCheckHash, savedContribution.getId());

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
   * Submit stops to be added to an existing bus route.
   * This creates a RouteContribution with type "ADD_STOPS" that requires admin
   * approval.
   */
  @PostMapping("/routes/stops")
  public ResponseEntity<Map<String, Object>> submitStopsContribution(
      @RequestBody Map<String, Object> requestData,
      HttpServletRequest request) {

    String clientId = getClientId(request);
    String userId = authenticationService.getCurrentUserId();

    // For anonymous users, generate a unique identifier
    if (userId == null || userId.equals("anonymous")) {
      userId = "anonymous_" + clientId;
    }

    try {
      log.info("Processing stops contribution from user: {}", userId);

      // Security pre-checks
      if (!performSecurityChecksAnonymous(request, clientId, "stops-contribution")) {
        return createSecurityBlockedResponse();
      }

      // Honeypot check (bot detection)
      String honeypot = (String) requestData.get("website");
      if (honeypot != null && !honeypot.isEmpty()) {
        log.warn("Bot detected via honeypot in stops contribution from IP: {}", request.getRemoteAddr());
        Map<String, Object> fakeResponse = new HashMap<>();
        fakeResponse.put("success", true);
        fakeResponse.put("message", "Stops submitted successfully");
        return ResponseEntity.ok(fakeResponse);
      }

      // Rate limiting check
      if (!securityMonitoringPort.checkRateLimit(clientId, "stops-contributions", 10, 3600000)) {
        log.warn("Rate limit exceeded for stops contribution submission: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Please try again later."));
      }

      // Extract and validate required fields
      Long busId = requestData.get("busId") != null ? Long.valueOf(requestData.get("busId").toString()) : null;
      String busNumber = (String) requestData.get("busNumber");
      String busName = (String) requestData.get("busName");
      String fromLocationName = (String) requestData.get("fromLocationName");
      String toLocationName = (String) requestData.get("toLocationName");
      String routeDepartureTime = (String) requestData.get("departureTime");
      String routeArrivalTime = (String) requestData.get("arrivalTime");
      String additionalNotes = (String) requestData.get("additionalNotes");

      @SuppressWarnings("unchecked")
      List<Map<String, Object>> stopsData = (List<Map<String, Object>>) requestData.get("stops");

      if (busId == null) {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Bus ID is required"));
      }

      if (stopsData == null || stopsData.isEmpty()) {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("At least one stop is required"));
      }

      // Convert stops data to StopContribution objects
      List<com.perundhu.domain.model.StopContribution> stops = new java.util.ArrayList<>();
      for (Map<String, Object> stopData : stopsData) {
        String locationName = (String) stopData.get("locationName");
        String stopArrivalTime = (String) stopData.get("arrivalTime");
        String stopDepartureTime = (String) stopData.get("departureTime");
        Integer order = stopData.get("order") != null ? Integer.valueOf(stopData.get("order").toString()) : null;
        Double latitude = stopData.get("latitude") != null ? Double.valueOf(stopData.get("latitude").toString()) : null;
        Double longitude = stopData.get("longitude") != null ? Double.valueOf(stopData.get("longitude").toString())
            : null;

        if (locationName == null || locationName.isBlank()) {
          return ResponseEntity.badRequest()
              .body(createErrorResponse("Stop location name is required"));
        }

        com.perundhu.domain.model.StopContribution stop = com.perundhu.domain.model.StopContribution.builder()
            .name(locationName)
            .arrivalTime(stopArrivalTime)
            .departureTime(stopDepartureTime)
            .stopOrder(order)
            .latitude(latitude)
            .longitude(longitude)
            .build();
        stops.add(stop);
      }

      // Create a RouteContribution for the stops
      // This will be reviewed by admins and then merged into the existing route
      RouteContribution contribution = RouteContribution.builder()
          .userId(userId)
          .busNumber(busNumber != null ? busNumber : "BUS-" + busId)
          .busName(busName != null ? busName : "")
          .fromLocationName(fromLocationName != null ? fromLocationName : "")
          .toLocationName(toLocationName != null ? toLocationName : "")
          .departureTime(routeDepartureTime)
          .arrivalTime(routeArrivalTime)
          .sourceBusId(busId)
          .contributionType("ADD_STOPS")
          .additionalNotes(additionalNotes != null ? "ADD_STOPS for bus ID: " + busId + ". " + additionalNotes
              : "ADD_STOPS for bus ID: " + busId)
          .stops(stops)
          .status("PENDING")
          .build();

      // Save the contribution
      RouteContribution savedContribution = contributionInputPort.submitRouteContribution(
          convertToContributionData(contribution), userId);

      log.info("Stops contribution submitted successfully. ID: {}, User: {}, Bus ID: {}, Stops count: {}",
          savedContribution.getId(), userId, busId, stops.size());

      // Log security event for successful submission
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "DATA_SUBMISSION",
          "INFO",
          "Stops contribution submitted for bus ID: " + busId,
          "/api/v1/contributions/routes/stops",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Stops submitted for review. An admin will review and approve your contribution.");
      response.put("submissionId", savedContribution.getId());
      response.put("status", savedContribution.getStatus());
      response.put("stopsCount", stops.size());
      response.put("estimatedProcessingTime", "24-48 hours");

      return ResponseEntity.ok(response);

    } catch (NumberFormatException e) {
      log.warn("Invalid number format in stops contribution from user {}: {}", userId, e.getMessage());
      return ResponseEntity.badRequest()
          .body(createErrorResponse("Invalid number format: " + e.getMessage()));

    } catch (Exception e) {
      log.error("Error processing stops contribution from user {}: {}", userId, e.getMessage(), e);

      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "PROCESSING_ERROR",
          "HIGH",
          "Stops contribution processing failed: " + e.getMessage(),
          "/api/v1/contributions/routes/stops",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to process contribution. Please try again."));
    }
  }

  /**
   * Convert RouteContribution to Map for the input port
   */
  private Map<String, Object> convertToContributionData(RouteContribution contribution) {
    Map<String, Object> data = new HashMap<>();
    data.put("busNumber", contribution.getBusNumber());
    data.put("busName", contribution.getBusName());
    data.put("fromLocationName", contribution.getFromLocationName());
    data.put("toLocationName", contribution.getToLocationName());
    data.put("departureTime", contribution.getDepartureTime());
    data.put("arrivalTime", contribution.getArrivalTime());
    data.put("additionalNotes", contribution.getAdditionalNotes());
    data.put("sourceBusId", contribution.getSourceBusId());
    data.put("contributionType", contribution.getContributionType());

    if (contribution.getStops() != null && !contribution.getStops().isEmpty()) {
      List<Map<String, Object>> stopsData = new java.util.ArrayList<>();
      for (var stop : contribution.getStops()) {
        Map<String, Object> stopMap = new HashMap<>();
        stopMap.put("name", stop.getName());
        stopMap.put("arrivalTime", stop.getArrivalTime());
        stopMap.put("departureTime", stop.getDepartureTime());
        stopMap.put("stopOrder", stop.getStopOrder());
        stopMap.put("latitude", stop.getLatitude());
        stopMap.put("longitude", stop.getLongitude());
        stopsData.add(stopMap);
      }
      data.put("stops", stopsData);
    }

    return data;
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

      // Honeypot check (bot detection)
      String honeypot = metadata.get("website");
      if (honeypot != null && !honeypot.isEmpty()) {
        log.warn("Bot detected via honeypot in image contribution from IP: {}", request.getRemoteAddr());
        Map<String, Object> fakeResponse = new HashMap<>();
        fakeResponse.put("success", true);
        fakeResponse.put("message", "Image uploaded successfully");
        return ResponseEntity.ok(fakeResponse);
      }

      // Rate limiting check for image uploads
      if (!securityMonitoringPort.checkRateLimit(clientId, "image-contributions", 5, 3600000)) {
        log.warn("Rate limit exceeded for image contribution submission: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Please try again later."));
      }

      // CAPTCHA verification for anonymous/new users
      String captchaToken = extractCaptchaToken(request, metadata.get("captchaToken"));
      if (recaptchaService.isEnabled() && captchaToken != null) {
        if (!recaptchaService.verifyToken(captchaToken, "image_upload")) {
          log.warn("CAPTCHA verification failed for image upload from user: {}", userId);
          return ResponseEntity.status(403).body(createErrorResponse("CAPTCHA verification failed"));
        }
      }

      // Validate image file with enhanced security checks
      if (!isValidImageFile(imageFile)) {
        log.warn("Invalid image file submitted by user: {}", userId);
        return ResponseEntity.badRequest()
            .body(
                createErrorResponse("Invalid image file. Please upload a valid JPEG, PNG, or WebP image under 10MB."));
      }

      // Image duplicate detection using file hash
      String imageHash = generateImageHash(imageFile);

      // Check for duplicate within 24-hour window
      if (imageHashRepository.isDuplicate(imageHash)) {
        String originalContributionId = imageHashRepository.getContributionId(imageHash);
        log.warn("Duplicate image detected: hash={}, original={}", imageHash, originalContributionId);
        return ResponseEntity.status(409)
            .body(createErrorResponse("Duplicate image detected. This image was already uploaded recently."));
      }

      // Validate metadata using domain port
      Map<String, String> sanitizedMetadata = sanitizeImageMetadata(metadata);

      // Check for spam patterns in metadata (description, location, etc.)
      for (Map.Entry<String, String> entry : sanitizedMetadata.entrySet()) {
        if (entry.getValue() != null && containsSpamPatterns(entry.getValue())) {
          log.warn("Spam detected in image metadata from user: {}", userId);
          return ResponseEntity.badRequest()
              .body(createErrorResponse("Invalid content detected in image metadata"));
        }
      }

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

      // Store hash to prevent duplicates within 24 hours
      imageHashRepository.storeHash(imageHash, contribution.getId());

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
   * Transcribe voice audio to text
   */
  @PostMapping("/voice/transcribe")
  public ResponseEntity<Map<String, Object>> transcribeVoice(
      @RequestParam("audio") MultipartFile audioFile,
      @RequestParam(value = "language", defaultValue = "auto") String language,
      HttpServletRequest request) {

    String clientId = getClientId(request);
    String userId = authenticationService.getCurrentUserId();

    if (userId == null || userId.equals("anonymous")) {
      userId = "anonymous_" + clientId;
    }

    try {
      log.info("Transcribing voice audio from user: {}, language: {}", userId, language);

      // Security checks
      if (!performSecurityChecksAnonymous(request, clientId, "voice-transcription")) {
        return createSecurityBlockedResponse();
      }

      // Rate limiting
      if (!securityMonitoringPort.checkRateLimit(clientId, "voice-transcriptions", 10, 3600000)) {
        log.warn("Rate limit exceeded for voice transcription: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Please try again later."));
      }

      // Validate audio file
      if (!isValidAudioFile(audioFile)) {
        log.warn("Invalid audio file submitted by user: {}", userId);
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Invalid audio file. Please upload a valid audio file under 5MB."));
      }

      // TODO: Integrate with Google Cloud Speech-to-Text API
      // For now, return a placeholder response
      String transcribedText = "Placeholder: Audio transcription will be implemented with Google Cloud Speech-to-Text API";

      // Parse transcribed text using NLP
      RouteTextParser.RouteData routeData = routeTextParser.extractRouteFromText(transcribedText);

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("transcribedText", transcribedText);
      response.put("confidence", routeData.getConfidence());
      response.put("extractedData", Map.of(
          "busNumber", routeData.getBusNumber() != null ? routeData.getBusNumber() : "",
          "fromLocation", routeData.getFromLocation() != null ? routeData.getFromLocation() : "",
          "toLocation", routeData.getToLocation() != null ? routeData.getToLocation() : "",
          "timings", routeData.getTimings(),
          "stops", routeData.getStops()));

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error transcribing voice audio from user {}: {}", userId, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to transcribe audio. Please try again."));
    }
  }

  /**
   * Submit a voice contribution with transcribed text
   */
  @PostMapping("/voice")
  public ResponseEntity<Map<String, Object>> submitVoiceContribution(
      @RequestParam(value = "audio", required = false) MultipartFile audioFile,
      @RequestParam("transcribedText") String transcribedText,
      @RequestParam(value = "language", defaultValue = "auto") String language,
      HttpServletRequest request) {

    String clientId = getClientId(request);
    String userId = authenticationService.getCurrentUserId();

    if (userId == null || userId.equals("anonymous")) {
      userId = "anonymous_" + clientId;
    }

    try {
      log.info("Processing voice contribution from user: {}", userId);

      // Security checks
      if (!performSecurityChecksAnonymous(request, clientId, "voice-contribution")) {
        return createSecurityBlockedResponse();
      }

      // Honeypot check (bot detection) - check request parameters
      String honeypot = request.getParameter("website");
      if (honeypot != null && !honeypot.isEmpty()) {
        log.warn("Bot detected via honeypot in voice contribution from IP: {}", request.getRemoteAddr());
        Map<String, Object> fakeResponse = new HashMap<>();
        fakeResponse.put("success", true);
        fakeResponse.put("message", "Voice contribution received");
        return ResponseEntity.ok(fakeResponse);
      }

      // CAPTCHA verification for new users
      String voiceCaptchaToken = extractCaptchaToken(request, request.getParameter("captchaToken"));
      if (recaptchaService.isEnabled() && voiceCaptchaToken != null) {
        if (!recaptchaService.verifyToken(voiceCaptchaToken, "voice_upload")) {
          log.warn("CAPTCHA verification failed for voice upload from user: {}", userId);
          return ResponseEntity.status(403).body(createErrorResponse("CAPTCHA verification failed"));
        }
      }

      // Rate limiting
      if (!securityMonitoringPort.checkRateLimit(clientId, "voice-contributions", 5, 3600000)) {
        log.warn("Rate limit exceeded for voice contribution submission: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Please try again later."));
      }

      // Validate transcribed text
      if (transcribedText == null || transcribedText.trim().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Transcribed text is required"));
      }

      // Sanitize transcribed text to prevent XSS and injection attacks
      String sanitizedText = inputValidationPort.sanitizeTextInput(transcribedText);

      // Validate transcribed text doesn't contain malicious patterns
      if (inputValidationPort.containsMaliciousPatterns(sanitizedText)) {
        log.warn("Malicious patterns detected in voice transcription from user: {}", userId);
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Invalid content detected in transcription"));
      }

      // Validate voice content using paste validator (spam, chat detection)
      PasteContributionValidator.ValidationResult contentValidation = pasteValidator
          .validatePasteContent(sanitizedText);

      if (!contentValidation.isValid()) {
        log.warn("Voice content validation failed for user {}: {}", userId, contentValidation.getReason());
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Invalid content: " + contentValidation.getReason()));
      }

      // Parse transcribed text using NLP
      RouteTextParser.RouteData routeData = routeTextParser.extractRouteFromText(sanitizedText);

      // Check if enough data was extracted
      if (routeData.getConfidence() < 0.3) {
        log.warn("Low confidence route data from voice contribution: {}", routeData.getConfidence());
        return ResponseEntity.badRequest()
            .body(createErrorResponse(
                "Could not extract enough route information from the transcription. Please provide more details."));
      }

      // Create contribution data map
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("busNumber", routeData.getBusNumber());
      contributionData.put("fromLocationName", routeData.getFromLocation());
      contributionData.put("toLocationName", routeData.getToLocation());
      contributionData.put("departureTime", !routeData.getTimings().isEmpty() ? routeData.getTimings().get(0) : null);
      contributionData.put("arrivalTime", routeData.getTimings().size() > 1 ? routeData.getTimings().get(1) : null);
      contributionData.put("additionalNotes", "Voice contribution - Raw text: " + transcribedText);
      contributionData.put("submittedBy", userId);
      contributionData.put("source", "VOICE");
      contributionData.put("language", language);

      // Add stops if extracted
      if (!routeData.getStops().isEmpty()) {
        contributionData.put("stops", routeData.getStops());
      }

      // Validate contribution data
      InputValidationPort.ContributionValidationResult validationResult = inputValidationPort
          .validateContributionData(contributionData);

      if (!validationResult.valid()) {
        log.warn("Validation failed for voice contribution from user {}: {}", userId,
            validationResult.errors());
        return ResponseEntity.badRequest()
            .body(createValidationErrorResponse(validationResult.errors()));
      }

      // Submit route contribution
      RouteContribution savedContribution = contributionInputPort
          .submitRouteContribution(validationResult.sanitizedValues(), userId);

      // Log security event
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "VOICE_CONTRIBUTION",
          "INFO",
          "Voice contribution submitted successfully",
          "/api/v1/contributions/voice",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Voice contribution submitted successfully");
      response.put("submissionId", savedContribution.getId());
      response.put("status", savedContribution.getStatus());
      response.put("confidence", routeData.getConfidence());
      response.put("extractedData", Map.of(
          "busNumber", routeData.getBusNumber() != null ? routeData.getBusNumber() : "",
          "fromLocation", routeData.getFromLocation() != null ? routeData.getFromLocation() : "",
          "toLocation", routeData.getToLocation() != null ? routeData.getToLocation() : ""));
      response.put("estimatedProcessingTime", "24-48 hours");

      return ResponseEntity.ok(response);

    } catch (IllegalArgumentException e) {
      log.warn("Validation error for voice contribution from user {}: {}", userId, e.getMessage());
      return ResponseEntity.badRequest()
          .body(createErrorResponse(e.getMessage()));

    } catch (Exception e) {
      log.error("Error processing voice contribution from user {}: {}", userId, e.getMessage(), e);

      // Log security event
      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "PROCESSING_ERROR",
          "HIGH",
          "Voice contribution processing failed: " + e.getMessage(),
          "/api/v1/contributions/voice",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to process voice contribution. Please try again."));
    }
  }

  /**
   * Submit a paste/text contribution with smart validation and NLP extraction
   */
  @PostMapping("/paste")
  public ResponseEntity<Map<String, Object>> submitPasteContribution(
      @RequestBody Map<String, Object> requestData,
      HttpServletRequest request) {

    String clientId = getClientId(request);
    String userId = authenticationService.getCurrentUserId();

    // For anonymous users, generate a unique identifier (same as image
    // contributions)
    if (userId == null || userId.equals("anonymous")) {
      userId = "anonymous_" + clientId;
    }

    try {
      // Security checks
      if (!performSecurityChecksAnonymous(request, clientId, "paste-contribution")) {
        return createSecurityBlockedResponse();
      }

      // Strict rate limiting for paste (5 per hour)
      if (!securityMonitoringPort.checkRateLimit(clientId, "paste-contributions", 5, 3600000)) {
        log.warn("Rate limit exceeded for paste contribution submission: {}", clientId);
        return ResponseEntity.status(429)
            .body(createErrorResponse("Rate limit exceeded. Maximum 5 paste contributions per hour."));
      }

      // Extract and validate text
      String pastedText = (String) requestData.get("text");
      String sourceAttribution = (String) requestData.get("sourceAttribution");

      // CAPTCHA verification for paste contributions
      String captchaToken = extractCaptchaToken(request, (String) requestData.get("captchaToken"));
      if (recaptchaService.isEnabled() && captchaToken != null) {
        if (!recaptchaService.verifyToken(captchaToken, "paste_contribution")) {
          log.warn("CAPTCHA verification failed for paste contribution from user: {}", userId);
          return ResponseEntity.status(403).body(createErrorResponse("CAPTCHA verification failed"));
        }
      }

      if (pastedText == null || pastedText.trim().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Pasted text cannot be empty"));
      }

      // Honeypot check (bot detection)
      String honeypot = (String) requestData.get("website");
      if (honeypot != null && !honeypot.isEmpty()) {
        log.warn("Bot detected via honeypot from IP: {}", request.getRemoteAddr());
        // Return fake success to confuse bot
        Map<String, Object> fakeResponse = new HashMap<>();
        fakeResponse.put("success", true);
        fakeResponse.put("message", "Contribution received");
        return ResponseEntity.ok(fakeResponse);
      }

      // Validate paste content
      PasteContributionValidator.ValidationResult validation = pasteValidator.validatePasteContent(pastedText);

      if (!validation.isValid()) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", validation.getReason());
        errorResponse.put("suggestions", validation.getSuggestions());
        return ResponseEntity.badRequest().body(errorResponse);
      }

      // Normalize text format (WhatsApp, Facebook, Twitter, etc.)
      String normalizedText = textNormalizer.normalizeToStandardFormat(pastedText);

      // Try Gemini AI extraction first (much more accurate than regex)
      Map<String, Object> geminiExtraction = null;
      double adjustedConfidence = 0.0;
      String busNumber = null;
      String fromLocation = null;
      String toLocation = null;
      List<String> timings = List.of();
      List<String> stops = List.of();

      if (geminiVisionService.isAvailable()) {
        log.info("Using Gemini AI for paste text extraction");
        geminiExtraction = geminiVisionService.extractBusScheduleFromText(normalizedText);

        if (geminiExtraction != null && !geminiExtraction.containsKey("error")) {
          busNumber = (String) geminiExtraction.get("busNumber");
          fromLocation = (String) geminiExtraction.get("fromLocation");
          toLocation = (String) geminiExtraction.get("toLocation");

          Object depTimes = geminiExtraction.get("departureTimes");
          if (depTimes instanceof List<?>) {
            timings = ((List<?>) depTimes).stream()
                .filter(t -> t instanceof String)
                .map(t -> (String) t)
                .toList();
          }

          Object stopsObj = geminiExtraction.get("stops");
          if (stopsObj instanceof List<?>) {
            stops = ((List<?>) stopsObj).stream()
                .filter(s -> s instanceof String)
                .map(s -> (String) s)
                .toList();
          }

          Object confObj = geminiExtraction.get("confidence");
          if (confObj instanceof Number) {
            adjustedConfidence = ((Number) confObj).doubleValue();
          }

          log.info("Gemini extracted: bus={}, from={}, to={}, times={}, confidence={}",
              busNumber, fromLocation, toLocation, timings.size(), adjustedConfidence);
        }
      }

      // Fallback to regex parser if Gemini unavailable or failed
      if (geminiExtraction == null || geminiExtraction.containsKey("error") || adjustedConfidence < 0.1) {
        log.info("Falling back to regex parser for paste text extraction");
        RouteTextParser.RouteData routeData = routeTextParser.extractRouteFromText(normalizedText);

        busNumber = routeData.getBusNumber();
        fromLocation = routeData.getFromLocation();
        toLocation = routeData.getToLocation();
        timings = routeData.getTimings();
        stops = routeData.getStops();
        adjustedConfidence = routeData.getConfidence();
      }

      // Check minimum confidence (30% threshold for paste)
      if (adjustedConfidence < 0.3) {
        log.warn("Low confidence route data from paste contribution: {}", adjustedConfidence);
        return ResponseEntity.badRequest()
            .body(Map.of(
                "success", false,
                "message", "Could not extract route information from pasted text",
                "confidence", adjustedConfidence,
                "suggestions", List.of(
                    "Make sure text contains bus number or route number",
                    "Include 'from' and 'to' location names",
                    "Add timing information if available",
                    "Remove personal chat messages and focus on route details")));
      }

      // Apply additional penalties for paste contributions
      // Penalty for personal pronouns
      if (pastedText.matches("(?i).*(I'm|I am|we are|my|our).*")) {
        adjustedConfidence *= 0.5;
      }

      // Penalty for future tense
      if (pastedText.matches("(?i).*(will|going to|tomorrow).*")) {
        adjustedConfidence *= 0.6;
      }

      // Cap at 0.95 (never 100% confident from paste)
      adjustedConfidence = Math.min(adjustedConfidence, 0.95);

      // Create contribution data
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("busNumber", busNumber);
      contributionData.put("fromLocationName", fromLocation);
      contributionData.put("toLocationName", toLocation);
      contributionData.put("departureTime", !timings.isEmpty() ? timings.get(0) : null);
      contributionData.put("arrivalTime", timings.size() > 1 ? timings.get(1) : null);
      contributionData.put("submittedBy", userId);
      contributionData.put("source", "PASTE");
      contributionData.put("confidenceScore", adjustedConfidence);

      // Build detailed notes
      StringBuilder notes = new StringBuilder("Paste contribution");
      if (geminiExtraction != null && !geminiExtraction.containsKey("error")) {
        notes.append(" [Extracted by Gemini AI]");
      }
      if (sourceAttribution != null && !sourceAttribution.trim().isEmpty()) {
        notes.append(" - Source: ").append(sourceAttribution);
      }
      notes.append("\n\nOriginal text:\n").append(pastedText);
      if (!pastedText.equals(normalizedText)) {
        notes.append("\n\nNormalized text:\n").append(normalizedText);
      }
      contributionData.put("additionalNotes", notes.toString());

      // Add stops if extracted
      if (!stops.isEmpty()) {
        contributionData.put("stops", stops);
      }

      // Add warnings to notes
      if (!validation.getWarnings().isEmpty()) {
        contributionData.put("validationWarnings", String.join("; ", validation.getWarnings()));
      }

      // Validate contribution data
      InputValidationPort.ContributionValidationResult validationResult = inputValidationPort
          .validateContributionData(contributionData);

      if (!validationResult.valid()) {
        log.warn("Validation failed for paste contribution from user {}: {}", userId,
            validationResult.errors());
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Validation failed: " + String.join(", ", validationResult.errors().values())));
      }

      // Submit contribution (always goes to PENDING_VERIFICATION)
      RouteContribution savedContribution = contributionInputPort
          .submitRouteContribution(validationResult.sanitizedValues(), userId);

      // Prepare response
      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Paste contribution submitted for review");
      response.put("contributionId", savedContribution.getId());
      response.put("confidence", adjustedConfidence);
      response.put("extractedData", Map.of(
          "busNumber", busNumber != null ? busNumber : "Not detected",
          "fromLocation", fromLocation != null ? fromLocation : "Not detected",
          "toLocation", toLocation != null ? toLocation : "Not detected",
          "timings", timings,
          "stops", stops));
      response.put("warnings", validation.getWarnings());
      response.put("status", "PENDING_VERIFICATION");
      response.put("estimatedReviewTime", adjustedConfidence >= 0.7 ? "12-24 hours" : "24-48 hours");
      response.put("extractedBy",
          geminiExtraction != null && !geminiExtraction.containsKey("error") ? "gemini-ai" : "regex-parser");

      log.info("Paste contribution submitted by user {}, confidence: {}", userId, adjustedConfidence);

      return ResponseEntity.ok(response);

    } catch (IllegalArgumentException e) {
      log.warn("Validation error for paste contribution from user {}: {}", userId, e.getMessage());
      return ResponseEntity.badRequest()
          .body(createErrorResponse(e.getMessage()));

    } catch (Exception e) {
      log.error("Error processing paste contribution from user {}: {}", userId, e.getMessage(), e);

      securityMonitoringPort.recordSecurityEvent(new SecurityMonitoringPort.SecurityEventData(
          clientId,
          "PROCESSING_ERROR",
          "HIGH",
          "Paste contribution processing failed: " + e.getMessage(),
          "/api/v1/contributions/paste",
          request.getHeader("User-Agent"),
          LocalDateTime.now()));

      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Failed to process paste contribution. Please try again."));
    }
  }

  /**
   * Validate and preview pasted text before submission
   */
  @PostMapping("/paste/validate")
  public ResponseEntity<Map<String, Object>> validatePasteText(
      @RequestBody Map<String, Object> requestData,
      HttpServletRequest request) {

    String clientId = getClientId(request);

    try {
      String pastedText = (String) requestData.get("text");

      if (pastedText == null || pastedText.trim().isEmpty()) {
        return ResponseEntity.badRequest()
            .body(createErrorResponse("Text cannot be empty"));
      }

      // Rate limit validation requests (more lenient than submissions)
      if (!securityMonitoringPort.checkRateLimit(clientId, "paste-validations", 20, 3600000)) {
        return ResponseEntity.status(429)
            .body(createErrorResponse("Too many validation requests. Please slow down."));
      }

      // Validate content
      PasteContributionValidator.ValidationResult validation = pasteValidator.validatePasteContent(pastedText);

      // Normalize format
      String normalizedText = textNormalizer.normalizeToStandardFormat(pastedText);
      TextFormatNormalizer.FormatMetadata formatMeta = textNormalizer.getFormatMetadata(pastedText);

      // Try Gemini AI extraction first (much more accurate)
      String busNumber = null;
      String fromLocation = null;
      String toLocation = null;
      List<String> timings = List.of();
      List<String> stops = List.of();
      double adjustedConfidence = 0.0;
      String extractedBy = "regex-parser";

      if (geminiVisionService.isAvailable()) {
        log.info("Using Gemini AI for paste text validation");
        Map<String, Object> geminiExtraction = geminiVisionService.extractBusScheduleFromText(normalizedText);

        if (geminiExtraction != null && !geminiExtraction.containsKey("error")) {
          busNumber = (String) geminiExtraction.get("busNumber");
          fromLocation = (String) geminiExtraction.get("fromLocation");
          toLocation = (String) geminiExtraction.get("toLocation");

          Object depTimes = geminiExtraction.get("departureTimes");
          if (depTimes instanceof List<?>) {
            timings = ((List<?>) depTimes).stream()
                .filter(t -> t instanceof String)
                .map(t -> (String) t)
                .toList();
          }

          Object stopsObj = geminiExtraction.get("stops");
          if (stopsObj instanceof List<?>) {
            stops = ((List<?>) stopsObj).stream()
                .filter(s -> s instanceof String)
                .map(s -> (String) s)
                .toList();
          }

          Object confObj = geminiExtraction.get("confidence");
          if (confObj instanceof Number) {
            adjustedConfidence = ((Number) confObj).doubleValue();
          }

          extractedBy = "gemini-ai";
        }
      }

      // Fallback to regex parser if Gemini unavailable or failed
      if (extractedBy.equals("regex-parser")) {
        RouteTextParser.RouteData routeData = routeTextParser.extractRouteFromText(normalizedText);
        busNumber = routeData.getBusNumber();
        fromLocation = routeData.getFromLocation();
        toLocation = routeData.getToLocation();
        timings = routeData.getTimings();
        stops = routeData.getStops();
        adjustedConfidence = routeData.getConfidence();
      }

      // Calculate adjusted confidence with penalties
      if (pastedText.matches("(?i).*(I'm|I am|we are|my|our).*")) {
        adjustedConfidence *= 0.5;
      }
      if (pastedText.matches("(?i).*(will|going to|tomorrow).*")) {
        adjustedConfidence *= 0.6;
      }
      adjustedConfidence = Math.min(adjustedConfidence, 0.95);

      // Build response
      Map<String, Object> response = new HashMap<>();
      response.put("isValid", validation.isValid());
      response.put("reason", validation.getReason());
      response.put("warnings", validation.getWarnings());
      response.put("suggestions", validation.getSuggestions());
      response.put("formatDetected", formatMeta.getType().toString());
      response.put("confidence", adjustedConfidence);
      response.put("extractedBy", extractedBy);

      // Build extracted map - use HashMap to allow null values
      Map<String, Object> extracted = new HashMap<>();
      extracted.put("busNumber", busNumber);
      extracted.put("fromLocation", fromLocation);
      extracted.put("toLocation", toLocation);
      extracted.put("timings", timings);
      extracted.put("stops", stops);
      response.put("extracted", extracted);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error validating paste text from client {}: {}", clientId, e.getMessage());
      return ResponseEntity.internalServerError()
          .body(createErrorResponse("Validation error. Please try again."));
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

  private boolean isValidAudioFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      return false;
    }

    // Check file size (max 5MB for audio)
    if (file.getSize() > 5 * 1024 * 1024) {
      return false;
    }

    // Check content type for audio files
    String contentType = file.getContentType();
    return contentType != null && (contentType.startsWith("audio/") ||
        contentType.equals("video/webm") || // WebM audio from MediaRecorder
        contentType.equals("audio/webm") ||
        contentType.equals("audio/wav") ||
        contentType.equals("audio/mp3") ||
        contentType.equals("audio/mpeg") ||
        contentType.equals("audio/mp4") ||
        contentType.equals("audio/ogg"));
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

  /**
   * Generate hash for contribution duplicate detection
   */
  private String generateContributionHash(String busNumber, String fromLocation, String toLocation, String time) {
    String combined = (busNumber != null ? busNumber : "") +
        (fromLocation != null ? fromLocation : "") +
        (toLocation != null ? toLocation : "") +
        (time != null ? time : "");
    return String.valueOf(combined.hashCode());
  }

  /**
   * Generate hash for image duplicate detection.
   *
   * @param imageFile Image file to hash
   * @return Base64 encoded MD5 hash
   */
  private String generateImageHash(MultipartFile imageFile) {
    try {
      byte[] imageBytes = imageFile.getBytes();
      java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
      byte[] hashBytes = md.digest(imageBytes);
      return java.util.Base64.getEncoder().encodeToString(hashBytes);
    } catch (Exception e) {
      log.error("Error generating image hash: {}", e.getMessage());
      // Fallback to size + filename hash
      return String.valueOf(imageFile.getSize() + imageFile.getOriginalFilename().hashCode());
    }
  }

  /**
   * Check if text contains spam patterns.
   *
   * @param text Text to check
   * @return true if spam detected
   */
  private boolean containsSpamPatterns(String text) {
    if (text == null || text.isEmpty()) {
      return false;
    }

    String lowerText = text.toLowerCase();

    // Common spam keywords
    String[] spamKeywords = {
        "buy now", "click here", "limited time", "act now", "free money",
        "make money", "earn cash", "work from home", "lose weight",
        "viagra", "casino", "lottery", "winner", "congratulations you won"
    };

    for (String keyword : spamKeywords) {
      if (lowerText.contains(keyword)) {
        return true;
      }
    }

    // Excessive URLs (more than 2 in metadata is suspicious)
    long urlCount = (long) lowerText.split("http").length - 1;
    return urlCount > 2;
  }

  /**
   * Extract reCAPTCHA token from request.
   * First checks the X-Recaptcha-Token header (preferred),
   * then falls back to request body/parameter.
   *
   * @param request   The HTTP request
   * @param bodyToken Token from request body (if available)
   * @return The captcha token, or null if not found
   */
  private String extractCaptchaToken(HttpServletRequest request, String bodyToken) {
    // First, check the X-Recaptcha-Token header (preferred method)
    String headerToken = request.getHeader("X-Recaptcha-Token");
    if (headerToken != null && !headerToken.isEmpty()) {
      return headerToken;
    }

    // Fall back to body token
    return bodyToken;
  }
}
