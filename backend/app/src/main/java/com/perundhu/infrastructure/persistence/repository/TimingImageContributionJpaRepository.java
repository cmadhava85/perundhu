package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.TimingImageContributionEntity;
import com.perundhu.infrastructure.persistence.entity.TimingImageContributionEntity.TimingImageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Timing Image Contributions
 */
@Repository("repositoryPackageTimingImageContributionJpaRepository")
public interface TimingImageContributionJpaRepository extends JpaRepository<TimingImageContributionEntity, Long> {

  List<TimingImageContributionEntity> findByUserId(String userId);

  List<TimingImageContributionEntity> findByStatus(TimingImageStatus status);

  @Query("SELECT t FROM TimingImageContributionEntity t WHERE t.status = 'PENDING'")
  List<TimingImageContributionEntity> findPendingContributions();

  /**
   * Fetch pending contributions with extracted timings eagerly loaded.
   * Use this when you need the child extractedTimings collection to avoid N+1 queries.
   * OPTIMIZATION: Reduces database calls from 1+N to 1 query.
   */
  @Query("SELECT DISTINCT t FROM TimingImageContributionEntity t " +
         "LEFT JOIN FETCH t.extractedTimings " +
         "WHERE t.status = 'PENDING'")
  List<TimingImageContributionEntity> findPendingContributionsWithTimings();

  /**
   * Fetch contributions by status with extracted timings eagerly loaded.
   * Use this when serializing to JSON or iterating through extractedTimings.
   * OPTIMIZATION: Prevents N+1 lazy loading queries.
   */
  @Query("SELECT DISTINCT t FROM TimingImageContributionEntity t " +
         "LEFT JOIN FETCH t.extractedTimings " +
         "WHERE t.status = :status")
  List<TimingImageContributionEntity> findByStatusWithTimings(@Param("status") TimingImageStatus status);

  List<TimingImageContributionEntity> findBySubmittedBy(String submittedBy);

  List<TimingImageContributionEntity> findByOriginLocation(String originLocation);

  long countByStatus(TimingImageStatus status);
}
