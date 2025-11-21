package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.TimingImageContributionEntity;
import com.perundhu.infrastructure.persistence.entity.TimingImageContributionEntity.TimingImageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

  List<TimingImageContributionEntity> findBySubmittedBy(String submittedBy);

  List<TimingImageContributionEntity> findByOriginLocation(String originLocation);
}
