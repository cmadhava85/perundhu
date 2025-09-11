package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA Repository interface for ImageContribution entity
 */
@Repository
public interface ImageContributionRepository extends JpaRepository<ImageContributionJpaEntity, String> {

  /**
   * Find all image contributions by a user
   * 
   * @param userId The user ID
   * @return List of image contributions made by the user
   */
  List<ImageContributionJpaEntity> findByUserId(String userId);

  /**
   * Find all image contributions with a specific status
   * 
   * @param status The status to filter by (e.g., "PENDING", "APPROVED",
   *               "REJECTED")
   * @return List of image contributions with the specified status
   */
  List<ImageContributionJpaEntity> findByStatus(String status);

  /**
   * Count image contributions by status
   * 
   * @param status The status to count (e.g., "PENDING", "APPROVED", "REJECTED")
   * @return The number of image contributions with the specified status
   */
  long countByStatus(String status);

  /**
   * Find image contributions by location
   * 
   * @param location The location
   * @return List of image contributions for the specified location
   */
  List<ImageContributionJpaEntity> findByLocation(String location);

  /**
   * Find image contributions by route name
   * 
   * @param routeName The route name
   * @return List of image contributions for the specified route
   */
  List<ImageContributionJpaEntity> findByRouteName(String routeName);

  /**
   * Find image contributions by user ID and status
   * 
   * @param userId The user ID
   * @param status The status to filter by
   * @return List of image contributions matching the criteria
   */
  List<ImageContributionJpaEntity> findByUserIdAndStatus(String userId, String status);

  /**
   * Find image contributions by submission date range
   * 
   * @param startDate Start date
   * @param endDate   End date
   * @return List of image contributions within the date range
   */
  @Query("SELECT ic FROM ImageContributionJpaEntity ic WHERE ic.submissionDate BETWEEN :startDate AND :endDate")
  List<ImageContributionJpaEntity> findBySubmissionDateBetween(
      @Param("startDate") java.time.LocalDateTime startDate,
      @Param("endDate") java.time.LocalDateTime endDate);
}