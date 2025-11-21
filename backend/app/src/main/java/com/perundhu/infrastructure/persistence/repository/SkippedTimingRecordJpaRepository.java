package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.SkippedTimingRecordEntity;
import com.perundhu.infrastructure.persistence.entity.SkippedTimingRecordEntity.SkipReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Skipped Timing Records
 */
@Repository("repositoryPackageSkippedTimingRecordJpaRepository")
public interface SkippedTimingRecordJpaRepository extends JpaRepository<SkippedTimingRecordEntity, Long> {

  List<SkippedTimingRecordEntity> findByContributionId(Long contributionId);

  List<SkippedTimingRecordEntity> findBySkipReason(SkipReason reason);

  List<SkippedTimingRecordEntity> findByProcessedBy(String processedBy);

  List<SkippedTimingRecordEntity> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId);

  long countBySkipReason(SkipReason reason);
}
