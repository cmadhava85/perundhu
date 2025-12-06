package com.perundhu.adapter.in.rest;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.perundhu.domain.port.GeminiVisionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Test controller for Gemini Vision service.
 * Provides endpoints to test the Gemini Vision integration.
 * 
 * NOTE: This controller should be secured in production or removed entirely.
 */
@RestController
@RequestMapping("/api/v1/admin/gemini")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class GeminiVisionTestController {

  private final GeminiVisionService geminiVisionService;

  /**
   * Check if Gemini Vision is available.
   * GET /api/v1/admin/gemini/status
   */
  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> getStatus() {
    Map<String, Object> status = new HashMap<>();
    status.put("available", geminiVisionService.isAvailable());
    status.put("provider", geminiVisionService.getProviderName());
    status.put("message", geminiVisionService.isAvailable()
        ? "Gemini Vision is ready"
        : "Gemini Vision is not available. Check GEMINI_API_ENABLED and GEMINI_API_KEY environment variables.");
    return ResponseEntity.ok(status);
  }

  /**
   * Extract bus schedule from an image URL.
   * POST /api/v1/admin/gemini/extract-from-url
   */
  @PostMapping("/extract-from-url")
  public ResponseEntity<Map<String, Object>> extractFromUrl(@RequestBody Map<String, String> request) {
    String imageUrl = request.get("imageUrl");
    if (imageUrl == null || imageUrl.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "error", true,
          "message", "imageUrl is required"));
    }

    log.info("Extracting bus schedule from URL: {}", imageUrl);

    if (!geminiVisionService.isAvailable()) {
      return ResponseEntity.ok(Map.of(
          "error", true,
          "message", "Gemini Vision is not available",
          "hint", "Set GEMINI_API_ENABLED=true and GEMINI_API_KEY=<your-api-key>"));
    }

    Map<String, Object> result = geminiVisionService.extractBusScheduleFromImage(imageUrl);
    return ResponseEntity.ok(result);
  }

  /**
   * Extract bus schedule from an uploaded image file.
   * POST /api/v1/admin/gemini/extract-from-file
   */
  @PostMapping("/extract-from-file")
  public ResponseEntity<Map<String, Object>> extractFromFile(@RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of(
          "error", true,
          "message", "File is required"));
    }

    log.info("Extracting bus schedule from uploaded file: {}", file.getOriginalFilename());

    if (!geminiVisionService.isAvailable()) {
      return ResponseEntity.ok(Map.of(
          "error", true,
          "message", "Gemini Vision is not available",
          "hint", "Set GEMINI_API_ENABLED=true and GEMINI_API_KEY=<your-api-key>"));
    }

    try {
      byte[] imageBytes = file.getBytes();
      String base64Image = Base64.getEncoder().encodeToString(imageBytes);

      String mimeType = file.getContentType();
      if (mimeType == null || mimeType.isEmpty()) {
        mimeType = "image/jpeg";
      }

      Map<String, Object> result = geminiVisionService.extractBusScheduleFromBase64(base64Image, mimeType);
      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error processing uploaded file: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError().body(Map.of(
          "error", true,
          "message", "Failed to process file: " + e.getMessage()));
    }
  }

  /**
   * Compare OCR vs Gemini Vision extraction for a given image.
   * POST /api/v1/admin/gemini/compare
   * 
   * This is useful for testing and debugging the Gemini Vision integration.
   */
  @PostMapping("/compare")
  public ResponseEntity<Map<String, Object>> compareExtraction(@RequestBody Map<String, String> request) {
    String imageUrl = request.get("imageUrl");
    if (imageUrl == null || imageUrl.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of(
          "error", true,
          "message", "imageUrl is required"));
    }

    Map<String, Object> comparison = new HashMap<>();
    comparison.put("imageUrl", imageUrl);

    // Get Gemini Vision result
    if (geminiVisionService.isAvailable()) {
      comparison.put("geminiAvailable", true);
      comparison.put("geminiResult", geminiVisionService.extractBusScheduleFromImage(imageUrl));
    } else {
      comparison.put("geminiAvailable", false);
      comparison.put("geminiResult", Map.of(
          "error", true,
          "message", "Gemini Vision not available"));
    }

    // Gemini Vision is the sole image extraction service
    comparison.put("note", "Gemini Vision AI is used for intelligent schedule extraction");

    return ResponseEntity.ok(comparison);
  }
}
