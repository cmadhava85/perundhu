package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.ReviewJpaEntity;
import com.perundhu.infrastructure.persistence.entity.ReviewJpaEntity.ReviewStatus;

/**
 * Spring Data JPA Repository for ReviewJpaEntity.
 */
@Repository
public interface ReviewJpaRepository extends JpaRepository<ReviewJpaEntity, Long> {
    
    /**
     * Find all reviews for a bus with a specific status
     */
    List<ReviewJpaEntity> findByBusIdAndStatus(Long busId, ReviewStatus status);
    
    /**
     * Find all reviews for a specific bus (any status)
     */
    List<ReviewJpaEntity> findByBusId(Long busId);
    
    /**
     * Find all reviews by a specific user
     */
    List<ReviewJpaEntity> findByUserId(String userId);
    
    /**
     * Find all pending reviews for moderation
     */
    List<ReviewJpaEntity> findByStatusOrderByCreatedAtDesc(ReviewStatus status);
    
    /**
     * Check if a user has already reviewed a specific bus
     */
    boolean existsByBusIdAndUserId(Long busId, String userId);
    
    /**
     * Calculate average rating for a bus (approved reviews only)
     */
    @Query("SELECT AVG(r.rating) FROM ReviewJpaEntity r WHERE r.busId = :busId AND r.status = 'APPROVED'")
    Optional<Double> calculateAverageRating(@Param("busId") Long busId);
    
    /**
     * Count approved reviews for a bus
     */
    long countByBusIdAndStatus(Long busId, ReviewStatus status);
    
    /**
     * Find user's review for a specific bus
     */
    Optional<ReviewJpaEntity> findByBusIdAndUserId(Long busId, String userId);
}
