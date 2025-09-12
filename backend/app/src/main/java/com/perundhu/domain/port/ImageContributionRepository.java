package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.ImageContribution;

/**
 * Repository interface for ImageContribution entity
 */
public interface ImageContributionRepository {

    /**
     * Save an image contribution
     * 
     * @param contribution The contribution to save
     * @return The saved contribution with ID
     */
    ImageContribution save(ImageContribution contribution);

    /**
     * Find an image contribution by ID
     * 
     * @param id The contribution ID
     * @return An Optional containing the contribution if found
     */
    Optional<ImageContribution> findById(String id);

    /**
     * Find all image contributions by a user
     * 
     * @param userId The user ID
     * @return List of image contributions made by the user
     */
    List<ImageContribution> findByUserId(String userId);

    /**
     * Find all image contributions with a specific status
     * 
     * @param status The status to filter by (e.g., "PENDING", "APPROVED",
     *               "REJECTED")
     * @return List of image contributions with the specified status
     */
    List<ImageContribution> findByStatus(String status);

    /**
     * Find all image contributions by submitter
     * 
     * @param submittedBy The submitter to filter by
     * @return List of image contributions by the specified submitter
     */
    List<ImageContribution> findBySubmittedBy(String submittedBy);

    /**
     * Find all image contributions
     * 
     * @return List of all image contributions
     */
    List<ImageContribution> findAll();

    /**
     * Delete an image contribution
     * 
     * @param id The ID of the contribution to delete
     */
    void deleteById(String id);

    /**
     * Count all image contributions
     * 
     * @return The total number of image contributions
     */
    long count();

    /**
     * Count image contributions with a specific status
     * 
     * @param status The status to count (e.g., "PENDING", "APPROVED", "REJECTED")
     * @return The number of image contributions with the specified status
     */
    long countByStatus(String status);
}