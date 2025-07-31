package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.ImageContribution;

/**
 * Repository interface for ImageContribution entity
 * Updated to use proper Java 17 record-based ID types
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
    Optional<ImageContribution> findById(ImageContribution.ImageContributionId id);

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
     * @param status The status to filter by
     * @return List of image contributions with the specified status
     */
    List<ImageContribution> findByStatus(ImageContribution.ContributionStatus status);

    /**
     * Find all pending image contributions
     *
     * @return List of pending image contributions
     */
    List<ImageContribution> findPendingContributions();

    /**
     * Find all image contributions submitted between two dates
     *
     * @param start The start date
     * @param end The end date
     * @return List of image contributions submitted between the specified dates
     */
    List<ImageContribution> findBySubmissionDateBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Delete an image contribution
     * 
     * @param id The ID of the contribution to delete
     */
    void delete(ImageContribution.ImageContributionId id);

    /**
     * Find all image contributions by user ID and status
     *
     * @param userId The user ID
     * @param status The status to filter by
     * @return List of image contributions matching the user ID and status
     */
    List<ImageContribution> findByUserIdAndStatus(String userId, ImageContribution.ContributionStatus status);

    /**
     * Count image contributions with a specific status
     * 
     * @param status The status to count
     * @return The number of image contributions with the specified status
     */
    long countByStatus(ImageContribution.ContributionStatus status);

    /**
     * Count all image contributions
     *
     * @return The total number of image contributions
     */
    long count();

    /**
     * Find all image contributions by bus number
     *
     * @param busNumber The bus number to filter by
     * @return List of image contributions matching the bus number
     */
    List<ImageContribution> findByBusNumber(String busNumber);

    /**
     * Find all image contributions by location name
     *
     * @param locationName The location name to filter by
     * @return List of image contributions matching the location name
     */
    List<ImageContribution> findByLocationName(String locationName);

    /**
     * Check if an image contribution exists by image URL
     *
     * @param imageUrl The image URL to check
     * @return True if an image contribution exists with the specified image URL, false otherwise
     */
    boolean existsByImageUrl(String imageUrl);
}

