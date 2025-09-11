package com.perundhu.domain.port;

import com.perundhu.domain.model.ImageContribution;
import java.util.List;
import java.util.Optional;

/**
 * Port interface for image contribution operations
 */
public interface ImageContributionPort {

  /**
   * Find all image contributions
   * 
   * @return List of all image contributions
   */
  List<ImageContribution> findAllImageContributions();

  /**
   * Find image contributions by status
   * 
   * @param status The status to filter by
   * @return List of image contributions with the specified status
   */
  List<ImageContribution> findImageContributionsByStatus(String status);

  /**
   * Find image contribution by ID
   * 
   * @param id The contribution ID
   * @return The image contribution if found
   */
  Optional<ImageContribution> findImageContributionById(String id);

  /**
   * Find image contributions by user ID
   * 
   * @param userId The user ID
   * @return List of image contributions by the specified user
   */
  List<ImageContribution> findByUserId(String userId);

  /**
   * Save an image contribution
   * 
   * @param contribution The contribution to save
   * @return The saved contribution
   */
  ImageContribution saveImageContribution(ImageContribution contribution);

  /**
   * Delete an image contribution
   * 
   * @param id The ID of the contribution to delete
   */
  void deleteImageContribution(String id);
}