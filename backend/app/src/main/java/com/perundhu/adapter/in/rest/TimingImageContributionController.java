package com.perundhu.adapter.in.rest;

import com.perundhu.domain.model.TimingImageContribution;
import com.perundhu.domain.model.TimingImageContribution.TimingImageStatus;
import com.perundhu.domain.model.FileUpload;
import com.perundhu.domain.port.TimingImageContributionRepository;
import com.perundhu.domain.port.FileStorageService;
import com.perundhu.application.service.AuthenticationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

/**
 * REST Controller for user timing image contributions
 * Handles upload and retrieval of bus timing board images
 */
@RestController
@RequestMapping("/v1/contributions/timing-images")
@RequiredArgsConstructor
@Slf4j

public class TimingImageContributionController {

  private static final String ANONYMOUS_ID_PREFIX = "anonymous_";

  private final TimingImageContributionRepository timingImageRepository;
  private final FileStorageService fileStorageService;
  private final AuthenticationService authenticationService;

  /**
   * Upload a bus timing board image
   * POST /api/v1/contributions/timing-images
   */
  @PostMapping
  public ResponseEntity<TimingImageContribution> uploadTimingImage(
      @RequestParam("image") MultipartFile image,
      @RequestParam("originLocation") String originLocation,
      @RequestParam(value = "originLocationTamil", required = false) String originLocationTamil,
      @RequestParam(value = "description", required = false) String description) {

    try {
      log.info("Received timing image upload request for origin: {}", originLocation);

      // Validate file is not empty
      if (image.isEmpty()) {
        log.warn("Empty file upload attempt");
        return ResponseEntity.badRequest().build();
      }

      // Validate file type - only accept specific image formats
      String contentType = image.getContentType();
      List<String> allowedTypes = List.of("image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic",
          "image/heif");
      if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
        log.warn("Invalid file type: {}. Allowed types: {}", contentType, allowedTypes);
        return ResponseEntity.badRequest().build();
      }

      // Validate file size (max 10MB, min 1KB)
      long fileSize = image.getSize();
      long minSize = 1024L; // 1KB
      long maxSize = 10L * 1024L * 1024L; // 10MB

      if (fileSize < minSize) {
        log.warn("File too small: {} bytes (min {})", fileSize, minSize);
        return ResponseEntity.badRequest().build();
      }

      if (fileSize > maxSize) {
        log.warn("File too large: {} bytes (max {})", fileSize, maxSize);
        return ResponseEntity.badRequest().build();
      }

      // Validate filename to prevent path traversal and junk files
      String originalFilename = image.getOriginalFilename();
      if (originalFilename == null || originalFilename.contains("..") ||
          originalFilename.contains("/") || originalFilename.contains("\\")) {
        log.warn("Invalid filename: {}", originalFilename);
        return ResponseEntity.badRequest().build();
      }

      // Get current user
      String userId = authenticationService.getCurrentUserId();
      if (userId == null || userId.equals("anonymous")) {
        userId = ANONYMOUS_ID_PREFIX + UUID.randomUUID().toString().replace("-", "");
      }

      // Upload image to storage
      FileUpload fileUpload = new FileUpload(
          image.getOriginalFilename(),
          image.getContentType(),
          image.getSize(),
          image.getInputStream());
      String imageUrl = fileStorageService.storeImageFile(fileUpload, userId);
      String thumbnailUrl = imageUrl; // Use same image as thumbnail for now

      log.info("Image uploaded successfully: {} (thumbnail: {})", imageUrl, thumbnailUrl);

      // Create contribution entity
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId(userId)
          .imageUrl(imageUrl)
          .thumbnailUrl(thumbnailUrl)
          .originLocation(originLocation)
          .originLocationTamil(originLocationTamil)
          .description(description)
          .submittedBy(userId)
          .status(TimingImageStatus.PENDING)
          .build();

      // Save to database
      TimingImageContribution saved = timingImageRepository.save(contribution);

      log.info("Timing image contribution created with ID: {}", saved.getId());

      return ResponseEntity.status(HttpStatus.CREATED).body(saved);

    } catch (Exception e) {
      log.error("Error uploading timing image", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Get all timing image contributions with optional filters
   * GET /api/v1/contributions/timing-images?status=PENDING&userId=user123
   */
  @GetMapping
  public ResponseEntity<List<TimingImageContribution>> getContributions(
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String userId) {

    try {
      log.info("Fetching timing contributions - status: {}, userId: {}", status, userId);

      List<TimingImageContribution> contributions;

      if (status != null) {
        TimingImageStatus statusEnum = TimingImageStatus.valueOf(status.toUpperCase());
        contributions = timingImageRepository.findByStatus(statusEnum);
      } else if (userId != null) {
        contributions = timingImageRepository.findByUserId(userId);
      } else {
        // Return empty list if no filters provided (to avoid returning all)
        contributions = List.of();
      }

      return ResponseEntity.ok(contributions);

    } catch (IllegalArgumentException e) {
      log.warn("Invalid status value: {}", status);
      return ResponseEntity.badRequest().build();
    } catch (Exception e) {
      log.error("Error fetching timing contributions", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Get a specific timing image contribution by ID
   * GET /api/v1/contributions/timing-images/{id}
   */
  @GetMapping("/{id}")
  public ResponseEntity<TimingImageContribution> getContribution(@PathVariable Long id) {
    try {
      log.info("Fetching timing contribution: {}", id);

      return timingImageRepository.findById(id)
          .map(ResponseEntity::ok)
          .orElse(ResponseEntity.notFound().build());

    } catch (Exception e) {
      log.error("Error fetching timing contribution: {}", id, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Get all timing image contributions for a specific user
   * GET /api/v1/contributions/timing-images/user/{userId}
   * SECURITY: Users can only view their own contributions
   */
  @GetMapping("/user/{userId}")
  public ResponseEntity<?> getMyContributions(@PathVariable String userId) {
    try {
      log.info("Fetching timing contributions for user: {}", userId);

      // IDOR Protection: Verify the requesting user matches the userId parameter
      String currentUserId = authenticationService.getCurrentUserId();
      if (currentUserId == null || !currentUserId.equals(userId)) {
        log.warn("IDOR attempt: User {} tried to access contributions of user {}", currentUserId, userId);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "Access denied. You can only view your own contributions."));
      }

      List<TimingImageContribution> contributions = timingImageRepository.findByUserId(userId);
      return ResponseEntity.ok(contributions);

    } catch (Exception e) {
      log.error("Error fetching user timing contributions: {}", userId, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Delete a timing image contribution
   * DELETE /api/v1/contributions/timing-images/{id}
   * SECURITY: Users can only delete their own contributions
   */
  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteContribution(@PathVariable Long id) {
    try {
      log.info("Deleting timing contribution: {}", id);

      var contribution = timingImageRepository.findById(id);
      if (contribution.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      // IDOR Protection: Verify the requesting user owns the contribution
      String currentUserId = authenticationService.getCurrentUserId();
      String ownerId = contribution.get().getUserId();
      if (currentUserId == null || !currentUserId.equals(ownerId)) {
        log.warn("IDOR attempt: User {} tried to delete contribution {} owned by {}", currentUserId, id, ownerId);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "Access denied. You can only delete your own contributions."));
      }

      timingImageRepository.deleteById(id);
      return ResponseEntity.noContent().build();

    } catch (Exception e) {
      log.error("Error deleting timing contribution: {}", id, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Get contribution statistics
   * GET /api/v1/contributions/timing-images/stats
   */
  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> getContributionStats() {
    try {
      log.info("Fetching timing contribution statistics");

      Map<String, Object> stats = new HashMap<>();

      // Get counts by status using COUNT queries (avoids loading all entities)
      stats.put("pending", timingImageRepository.countByStatus(TimingImageStatus.PENDING));
      stats.put("approved", timingImageRepository.countByStatus(TimingImageStatus.APPROVED));
      stats.put("rejected", timingImageRepository.countByStatus(TimingImageStatus.REJECTED));
      stats.put("processing", timingImageRepository.countByStatus(TimingImageStatus.PROCESSING));

      return ResponseEntity.ok(stats);

    } catch (Exception e) {
      log.error("Error fetching timing contribution stats", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }
}
