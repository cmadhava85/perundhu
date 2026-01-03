package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.UserFeedback;

/**
 * Output port for UserFeedback persistence.
 * Defines the contract for saving and retrieving feedback from the database.
 */
public interface UserFeedbackOutputPort {

    /**
     * Save or update feedback
     */
    UserFeedback saveFeedback(UserFeedback feedback);

    /**
     * Find feedback by ID
     */
    Optional<UserFeedback> findFeedbackById(Long id);

    /**
     * Find all feedback from a specific email
     */
    List<UserFeedback> findFeedbackByEmail(String email);

    /**
     * Find feedback by category
     */
    List<UserFeedback> findFeedbackByCategory(String category);

    /**
     * Find feedback by status
     */
    List<UserFeedback> findFeedbackByStatus(String status);

    /**
     * Get recent feedback (limited by count)
     */
    List<UserFeedback> findRecentFeedback(int limit);

    /**
     * Count feedback by status
     */
    long countFeedbackByStatus(String status);

    /**
     * Count feedback by category
     */
    long countFeedbackByCategory(String category);

    /**
     * Update feedback status
     */
    UserFeedback updateFeedbackStatus(Long id, String status);
}
