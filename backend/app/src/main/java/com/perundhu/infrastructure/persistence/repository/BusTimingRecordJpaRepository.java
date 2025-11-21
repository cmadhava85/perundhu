package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.BusTimingRecordEntity;
import com.perundhu.infrastructure.persistence.entity.BusTimingRecordEntity.TimingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Bus Timing Records
 */
@Repository("repositoryPackageBusTimingRecordJpaRepository")
public interface BusTimingRecordJpaRepository extends JpaRepository<BusTimingRecordEntity, Long> {

    Optional<BusTimingRecordEntity> findByFromLocationIdAndToLocationIdAndDepartureTimeAndTimingType(
            Long fromLocationId, Long toLocationId, LocalTime departureTime, TimingType timingType);

    List<BusTimingRecordEntity> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId);

    List<BusTimingRecordEntity> findByFromLocationId(Long fromLocationId);

    List<BusTimingRecordEntity> findByContributionId(Long contributionId);

    boolean existsByFromLocationIdAndToLocationIdAndDepartureTimeAndTimingType(
            Long fromLocationId, Long toLocationId, LocalTime departureTime, TimingType timingType);
}
