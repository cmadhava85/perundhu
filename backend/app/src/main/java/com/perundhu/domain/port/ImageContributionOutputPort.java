package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.ImageContribution;

/**
 * Output port for image contribution persistence operations.
 * This interface defines the contract for accessing image contribution data.
 */
public interface ImageContributionOutputPort {

  /**
   * Save an image contribution
   */
  ImageContribution save(ImageContribution contribution);

  /**
   * Find image contribution by ID
   */
  Optional<ImageContribution> findById(String id);

  /**
   * Find all image contributions
   */
  List<ImageContribution> findAll();

  /**
   * Find image contributions by user ID
   */
  List<ImageContribution> findByUserId(String userId);

  /**
   * Find image contributions by status
   */
  List<ImageContribution> findByStatus(String status);

  /**
   * Delete image contribution by ID
   */
  void deleteById(String id);

  /**
   * Count all image contributions
   */
  long count();

  /**
   * Count image contributions by status
   */
  long countByStatus(String status);

  /**
   * Find all image contributions with pagination
   */
  List<ImageContribution> findAllPaged(int page, int size);

  /**
   * Find image contributions by status with pagination
   */
  List<ImageContribution> findByStatusPaged(String status, int page, int size);

  /**
   * Find all image contributions with pagination (legacy method)
   */
  @Deprecated
  default List<ImageContribution> findAll(int page, int size) {
    return findAllPaged(page, size);
  }

  /**
   * Find image contributions by status with pagination (legacy method)
   */
  @Deprecated
  default List<ImageContribution> findByStatus(String status, int page, int size) {
    return findByStatusPaged(status, page, size);
  }

  /**
   * Find image contribution by image URL
   */
  Optional<ImageContribution> findByImageUrl(String imageUrl);
}