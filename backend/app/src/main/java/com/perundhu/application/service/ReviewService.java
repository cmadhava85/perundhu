package com.perundhu.application.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Review;
import com.perundhu.domain.model.ReviewId;
import com.perundhu.domain.port.ReviewRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Application service for managing bus reviews.
 * Handles business logic and orchestration for review operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    
    /**
     * Submit a new review for a bus
     * 
     * @param busId     The bus being reviewed
     * @param userId    The user submitting the review (can be null for anonymous)
     * @param rating    Rating 1-5
     * @param comment   Optional comment
     * @param tags      Optional tags
     * @param travelDate Optional travel date
     * @param autoApprove Whether to auto-approve the review
     * @return The created review
     */
    public Review submitReview(Long busId, String userId, int rating, String comment,
                               List<String> tags, LocalDate travelDate, boolean autoApprove) {
        
        // Check if user already reviewed this bus (if userId is provided)
        if (userId != null && !userId.isBlank()) {
            if (reviewRepository.existsByBusIdAndUserId(busId, userId)) {
                throw new IllegalStateException("You have already reviewed this bus service");
            }
        }
        
        Review.ReviewStatus status = autoApprove ? 
                Review.ReviewStatus.APPROVED : Review.ReviewStatus.PENDING;
        
        Review review = Review.builder()
                .busId(busId)
                .userId(userId)
                .rating(rating)
                .comment(comment)
                .tags(tags)
                .travelDate(travelDate)
                .status(status)
                .build();
        
        Review saved = reviewRepository.save(review);
        log.info("New review submitted for bus {} by user {}, status: {}", busId, userId, status);
        
        return saved;
    }
    
    /**
     * Get all approved reviews for a bus
     */
    @Transactional(readOnly = true)
    public List<Review> getApprovedReviewsForBus(Long busId) {
        return reviewRepository.findApprovedByBusId(busId);
    }
    
    /**
     * Get rating summary for a bus
     */
    @Transactional(readOnly = true)
    public RatingSummary getRatingSummary(Long busId) {
        Double averageRating = reviewRepository.calculateAverageRating(busId);
        long reviewCount = reviewRepository.countApprovedByBusId(busId);
        
        return new RatingSummary(
                averageRating != null ? averageRating : 0.0,
                reviewCount
        );
    }
    
    /**
     * Get all reviews by a user
     */
    @Transactional(readOnly = true)
    public List<Review> getReviewsByUser(String userId) {
        return reviewRepository.findByUserId(userId);
    }
    
    /**
     * Get all pending reviews (for admin moderation)
     */
    @Transactional(readOnly = true)
    public List<Review> getPendingReviews() {
        return reviewRepository.findPendingReviews();
    }
    
    /**
     * Approve a review (admin action)
     */
    public Review approveReview(Long reviewId) {
        Review review = reviewRepository.findById(ReviewId.of(reviewId))
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));
        
        Review approved = review.approve();
        Review saved = reviewRepository.save(approved);
        
        log.info("Review {} approved", reviewId);
        return saved;
    }
    
    /**
     * Reject a review (admin action)
     */
    public Review rejectReview(Long reviewId) {
        Review review = reviewRepository.findById(ReviewId.of(reviewId))
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));
        
        Review rejected = review.reject();
        Review saved = reviewRepository.save(rejected);
        
        log.info("Review {} rejected", reviewId);
        return saved;
    }
    
    /**
     * Delete a review
     */
    public void deleteReview(Long reviewId, String userId) {
        Review review = reviewRepository.findById(ReviewId.of(reviewId))
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));
        
        // Only allow deletion by the review owner
        if (review.getUserId() == null || !review.getUserId().equals(userId)) {
            throw new IllegalStateException("You can only delete your own reviews");
        }
        
        reviewRepository.deleteById(ReviewId.of(reviewId));
        log.info("Review {} deleted by user {}", reviewId, userId);
    }
    
    /**
     * Check if a user has already reviewed a bus
     */
    @Transactional(readOnly = true)
    public boolean hasUserReviewedBus(Long busId, String userId) {
        if (userId == null || userId.isBlank()) {
            return false;
        }
        return reviewRepository.existsByBusIdAndUserId(busId, userId);
    }
    
    /**
     * Rating summary DTO
     */
    public record RatingSummary(double averageRating, long reviewCount) {
        public String getFormattedRating() {
            return String.format("%.1f", averageRating);
        }
    }
}
