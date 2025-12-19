package com.perundhu.adapter.in.rest;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.ReviewService;
import com.perundhu.application.service.ReviewService.RatingSummary;
import com.perundhu.domain.model.Review;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for bus review operations.
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {
    
    private final ReviewService reviewService;
    
    @Value("${perundhu.features.reviews.enabled:false}")
    private boolean reviewsEnabled;
    
    @Value("${perundhu.features.reviews.require-login:true}")
    private boolean requireLogin;
    
    @Value("${perundhu.features.reviews.auto-approve:true}")
    private boolean autoApprove;
    
    /**
     * Check if reviews feature is enabled
     */
    @GetMapping("/feature-status")
    public ResponseEntity<FeatureStatusResponse> getFeatureStatus() {
        return ResponseEntity.ok(new FeatureStatusResponse(
                reviewsEnabled,
                requireLogin,
                autoApprove
        ));
    }
    
    /**
     * Submit a new review for a bus
     */
    @PostMapping
    public ResponseEntity<?> submitReview(
            @Valid @RequestBody SubmitReviewRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        if (!reviewsEnabled) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Reviews feature is currently disabled"));
        }
        
        if (requireLogin && (userId == null || userId.isBlank())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Please log in to submit a review"));
        }
        
        try {
            Review review = reviewService.submitReview(
                    request.busId(),
                    userId,
                    request.rating(),
                    request.comment(),
                    request.tags(),
                    request.travelDate(),
                    autoApprove
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(review));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all approved reviews for a bus
     */
    @GetMapping("/bus/{busId}")
    public ResponseEntity<?> getReviewsForBus(@PathVariable Long busId) {
        if (!reviewsEnabled) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Reviews feature is currently disabled"));
        }
        
        List<Review> reviews = reviewService.getApprovedReviewsForBus(busId);
        List<ReviewResponse> responses = reviews.stream()
                .map(this::toResponse)
                .toList();
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get rating summary for a bus
     */
    @GetMapping("/bus/{busId}/summary")
    public ResponseEntity<?> getRatingSummary(@PathVariable Long busId) {
        if (!reviewsEnabled) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Reviews feature is currently disabled"));
        }
        
        RatingSummary summary = reviewService.getRatingSummary(busId);
        return ResponseEntity.ok(new RatingSummaryResponse(
                summary.averageRating(),
                summary.reviewCount(),
                summary.getFormattedRating()
        ));
    }
    
    /**
     * Get reviews by current user
     */
    @GetMapping("/my-reviews")
    public ResponseEntity<?> getMyReviews(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        if (!reviewsEnabled) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Reviews feature is currently disabled"));
        }
        
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Please log in to view your reviews"));
        }
        
        List<Review> reviews = reviewService.getReviewsByUser(userId);
        List<ReviewResponse> responses = reviews.stream()
                .map(this::toResponse)
                .toList();
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Check if user has already reviewed a bus
     */
    @GetMapping("/bus/{busId}/has-reviewed")
    public ResponseEntity<?> hasReviewedBus(
            @PathVariable Long busId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        if (!reviewsEnabled) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Reviews feature is currently disabled"));
        }
        
        boolean hasReviewed = reviewService.hasUserReviewedBus(busId, userId);
        return ResponseEntity.ok(new HasReviewedResponse(hasReviewed));
    }
    
    /**
     * Delete user's own review
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long reviewId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        
        if (!reviewsEnabled) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Reviews feature is currently disabled"));
        }
        
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Please log in to delete reviews"));
        }
        
        try {
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // ============ Admin Endpoints ============
    
    /**
     * Get all pending reviews (admin only)
     */
    @GetMapping("/admin/pending")
    public ResponseEntity<?> getPendingReviews() {
        List<Review> reviews = reviewService.getPendingReviews();
        List<ReviewResponse> responses = reviews.stream()
                .map(this::toResponse)
                .toList();
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Approve a review (admin only)
     */
    @PutMapping("/admin/{reviewId}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long reviewId) {
        try {
            Review review = reviewService.approveReview(reviewId);
            return ResponseEntity.ok(toResponse(review));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Reject a review (admin only)
     */
    @PutMapping("/admin/{reviewId}/reject")
    public ResponseEntity<?> rejectReview(@PathVariable Long reviewId) {
        try {
            Review review = reviewService.rejectReview(reviewId);
            return ResponseEntity.ok(toResponse(review));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // ============ DTOs ============
    
    public record SubmitReviewRequest(
            @NotNull(message = "Bus ID is required")
            Long busId,
            
            @Min(value = 1, message = "Rating must be at least 1")
            @Max(value = 5, message = "Rating must be at most 5")
            int rating,
            
            @Size(max = 500, message = "Comment cannot exceed 500 characters")
            String comment,
            
            List<String> tags,
            
            LocalDate travelDate
    ) {}
    
    public record ReviewResponse(
            Long id,
            Long busId,
            String userId,
            int rating,
            String comment,
            List<String> tags,
            LocalDate travelDate,
            String status,
            String createdAt
    ) {}
    
    public record RatingSummaryResponse(
            double averageRating,
            long reviewCount,
            String formattedRating
    ) {}
    
    public record FeatureStatusResponse(
            boolean enabled,
            boolean requireLogin,
            boolean autoApprove
    ) {}
    
    public record HasReviewedResponse(boolean hasReviewed) {}
    
    public record ErrorResponse(String message) {}
    
    // ============ Mapping ============
    
    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId() != null ? review.getId().getValue() : null,
                review.getBusId(),
                review.getUserId(),
                review.getRating(),
                review.getComment(),
                review.getTags(),
                review.getTravelDate(),
                review.getStatus().name(),
                review.getCreatedAt() != null ? review.getCreatedAt().toString() : null
        );
    }
}
