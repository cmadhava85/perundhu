package com.perundhu.application.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Review;
import com.perundhu.domain.model.ReviewId;
import com.perundhu.domain.port.ReviewRepository;

import static com.perundhu.infrastructure.config.CacheConfig.REVIEWS_CACHE;

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
     * Evicts review cache for the bus when new review is submitted
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
    @Caching(evict = {
        @CacheEvict(value = REVIEWS_CACHE, key = "#busId"),
        @CacheEvict(value = REVIEWS_CACHE, key = "#busId + '-summary'")
    })
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
     * Cached for 15 minutes to improve performance for popular buses
     */
    @Transactional(readOnly = true)
    @Cacheable(value = REVIEWS_CACHE, key = "#busId")
    public List<Review> getApprovedReviewsForBus(Long busId) {
        return reviewRepository.findApprovedByBusId(busId);
    }
    
    /**
     * Get rating summary for a bus
     * Cached for 15 minutes - aggregation queries are expensive
     */
    @Transactional(readOnly = true)
    @Cacheable(value = REVIEWS_CACHE, key = "#busId + '-summary'")
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
     * Evicts review cache for affected bus
     */
    @Caching(evict = {
        @CacheEvict(value = REVIEWS_CACHE, key = "#result.busId"),
        @CacheEvict(value = REVIEWS_CACHE, key = "#result.busId + '-summary'")
    })
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
     * Evicts review cache for affected bus
     */
    @Caching(evict = {
        @CacheEvict(value = REVIEWS_CACHE, key = "#result.busId"),
        @CacheEvict(value = REVIEWS_CACHE, key = "#result.busId + '-summary'")
    })
    public Review rejectReview(Long reviewId) {
        Review review = reviewRepository.findById(ReviewId.of(reviewId))
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));
        
        Review rejected = review.reject();
        Review saved = reviewRepository.save(rejected);
        
        log.info("Review {} rejected", reviewId);
        return saved;
    }
    
    /**
     * Edit an existing review (only by owner)
     * Evicts review cache for affected bus
     */
    @Caching(evict = {
        @CacheEvict(value = REVIEWS_CACHE, key = "#result.busId"),
        @CacheEvict(value = REVIEWS_CACHE, key = "#result.busId + '-summary'")
    })
    public Review editReview(Long reviewId, String userId, Integer rating, String comment,
                             List<String> tags, LocalDate travelDate) {
        Review review = reviewRepository.findById(ReviewId.of(reviewId))
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));
        
        // Only allow editing by the review owner
        if (review.getUserId() == null || !review.getUserId().equals(userId)) {
            throw new IllegalStateException("You can only edit your own reviews");
        }
        
        Review edited = review.edit(rating, comment, tags, travelDate);
        Review saved = reviewRepository.save(edited);
        
        log.info("Review {} edited by user {}", reviewId, userId);
        return saved;
    }
    
    /**
     * Delete a review
     * Evicts review cache for affected bus
     */
    @Caching(evict = {
        @CacheEvict(value = REVIEWS_CACHE, key = "#review.busId"),
        @CacheEvict(value = REVIEWS_CACHE, key = "#review.busId + '-summary'")
    })
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
