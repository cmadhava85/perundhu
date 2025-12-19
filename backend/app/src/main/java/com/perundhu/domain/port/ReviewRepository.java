package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Review;
import com.perundhu.domain.model.ReviewId;

/**
 * Domain port interface for Review persistence operations.
 * Following hexagonal architecture pattern.
 */
public interface ReviewRepository {
    
    /**
     * Save a review (create or update)
     */
    Review save(Review review);
    
    /**
     * Find a review by its ID
     */
    Optional<Review> findById(ReviewId id);
    
    /**
     * Find all approved reviews for a specific bus
     */
    List<Review> findApprovedByBusId(Long busId);
    
    /**
     * Find all reviews for a specific bus (any status)
     */
    List<Review> findByBusId(Long busId);
    
    /**
     * Find all reviews by a specific user
     */
    List<Review> findByUserId(String userId);
    
    /**
     * Find all pending reviews (for moderation)
     */
    List<Review> findPendingReviews();
    
    /**
     * Check if a user has already reviewed a specific bus
     */
    boolean existsByBusIdAndUserId(Long busId, String userId);
    
    /**
     * Calculate average rating for a bus
     */
    Double calculateAverageRating(Long busId);
    
    /**
     * Count approved reviews for a bus
     */
    long countApprovedByBusId(Long busId);
    
    /**
     * Delete a review by ID
     */
    void deleteById(ReviewId id);
}
