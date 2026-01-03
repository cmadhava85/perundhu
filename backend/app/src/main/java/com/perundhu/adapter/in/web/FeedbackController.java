package com.perundhu.adapter.in.web;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.perundhu.domain.model.UserFeedback;
import com.perundhu.domain.port.FileStorageService;
import com.perundhu.domain.port.UserFeedbackOutputPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for handling user feedback submissions.
 * Provides endpoints for submitting feedback with optional file attachments.
 */
@RestController
@RequestMapping("/api/feedback")
@Slf4j
@RequiredArgsConstructor
public class FeedbackController {

    private final UserFeedbackOutputPort feedbackOutputPort;
    private final FileStorageService fileStorageService;

    @Value("${app.feedback.max-file-size:5242880}")
    private long maxFileSize;

    @Value("${app.feedback.upload-dir:feedback}")
    private String feedbackUploadDir;

    /**
     * Submit user feedback with optional screenshot attachment
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitFeedback(
            @RequestParam String category,
            @RequestParam String message,
            @RequestParam String email,
            @RequestParam(required = false) MultipartFile screenshot,
            @RequestParam(required = false) String userAgent,
            @RequestParam(required = false) String timestamp,
            @RequestParam(required = false) String pageUrl) {

        try {
            log.info("Received feedback submission from email: {}", email);

            // Validate inputs
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Message is required"));
            }

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email is required"));
            }

            // Validate email format
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid email format"));
            }

            String screenshotFilename = null;
            String screenshotUrl = null;

            // Handle file upload if provided
            if (screenshot != null && !screenshot.isEmpty()) {
                if (screenshot.getSize() > maxFileSize) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "File size exceeds maximum allowed (" + (maxFileSize / 1024 / 1024) + "MB)"));
                }

                // Validate file type
                String contentType = screenshot.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Only image files are allowed"));
                }

                try {
                    screenshotFilename = System.currentTimeMillis() + "_" + screenshot.getOriginalFilename();
                    // Create a FileUpload object from the multipart file
                    com.perundhu.domain.model.FileUpload fileUpload = new com.perundhu.domain.model.FileUpload(
                            screenshotFilename,
                            contentType,
                            screenshot.getSize(),
                            screenshot.getInputStream());
                    
                    // Store with a feedback-specific user ID prefix
                    String screenshotPath = fileStorageService.storeImageFile(
                            fileUpload,
                            "feedback",
                            screenshotFilename);
                    screenshotUrl = screenshotPath;
                    log.info("Screenshot saved: {}", screenshotUrl);
                } catch (IOException e) {
                    log.error("Error saving screenshot", e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to save screenshot"));
                }
            }

            // Create feedback object
            UserFeedback feedback = UserFeedback.builder()
                    .category(category != null ? category : "general")
                    .message(message.trim())
                    .email(email.trim())
                    .screenshotFilename(screenshotFilename)
                    .screenshotUrl(screenshotUrl)
                    .userAgent(userAgent)
                    .pageUrl(pageUrl)
                    .status(UserFeedback.FeedbackStatus.NEW)
                    .createdAt(LocalDateTime.now())
                    .build();

            // Save feedback
            UserFeedback saved = feedbackOutputPort.saveFeedback(feedback);

            log.info("Feedback saved successfully with ID: {}", saved.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Thank you for your feedback!");
            response.put("feedbackId", saved.getId());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error processing feedback submission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process feedback submission"));
        }
    }

    /**
     * Get feedback details by ID (admin endpoint)
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserFeedback> getFeedback(@PathVariable Long id) {
        return feedbackOutputPort.findFeedbackById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get feedback statistics
     */
    @GetMapping("/stats/overview")
    public ResponseEntity<Map<String, Object>> getFeedbackStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("newCount", feedbackOutputPort.countFeedbackByStatus("new"));
            stats.put("acknowledgedCount", feedbackOutputPort.countFeedbackByStatus("acknowledged"));
            stats.put("underReviewCount", feedbackOutputPort.countFeedbackByStatus("under_review"));
            stats.put("resolvedCount", feedbackOutputPort.countFeedbackByStatus("resolved"));

            // Category stats
            stats.put("suggestionCount", feedbackOutputPort.countFeedbackByCategory("suggestion"));
            stats.put("bugCount", feedbackOutputPort.countFeedbackByCategory("bug"));
            stats.put("featureCount", feedbackOutputPort.countFeedbackByCategory("feature"));
            stats.put("generalCount", feedbackOutputPort.countFeedbackByCategory("general"));

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error retrieving feedback statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics"));
        }
    }
}
