package com.perundhu.infrastructure.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.UserFeedbackJpaEntity;

/**
 * Spring Data JPA Repository for UserFeedback entity.
 * Provides database operations for feedback submissions.
 */
@Repository
public interface UserFeedbackRepository extends JpaRepository<UserFeedbackJpaEntity, Long> {

    /**
     * Find all feedback for a specific email address
     */
    List<UserFeedbackJpaEntity> findByEmail(String email);

    /**
     * Find feedback by category
     */
    List<UserFeedbackJpaEntity> findByCategory(String category);

    /**
     * Find feedback by status
     */
    List<UserFeedbackJpaEntity> findByStatus(UserFeedbackJpaEntity.FeedbackStatus status);

    /**
     * Find recent feedback (paginated)
     */
    Page<UserFeedbackJpaEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find feedback by status (paginated)
     */
    Page<UserFeedbackJpaEntity> findByStatusOrderByCreatedAtDesc(
            UserFeedbackJpaEntity.FeedbackStatus status,
            Pageable pageable);

    /**
     * Find feedback created between two dates
     */
    List<UserFeedbackJpaEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDate,
            LocalDateTime endDate);

    /**
     * Find feedback by category and status
     */
    @Query("SELECT f FROM UserFeedbackJpaEntity f WHERE f.category = :category AND f.status = :status ORDER BY f.createdAt DESC")
    List<UserFeedbackJpaEntity> findByCategoryAndStatus(
            @Param("category") String category,
            @Param("status") UserFeedbackJpaEntity.FeedbackStatus status);

    /**
     * Count feedback by status
     */
    long countByStatus(UserFeedbackJpaEntity.FeedbackStatus status);

    /**
     * Count feedback by category
     */
    long countByCategory(String category);
}
