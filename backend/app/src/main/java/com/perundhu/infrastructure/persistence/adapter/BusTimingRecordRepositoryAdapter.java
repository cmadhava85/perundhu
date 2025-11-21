package com.perundhu.infrastructure.persistence.adapter;

import com.perundhu.domain.model.BusTimingRecord;
import com.perundhu.domain.model.BusTimingRecord.TimingSource;
import com.perundhu.domain.model.BusTimingRecord.TimingType;
import com.perundhu.domain.port.BusTimingRecordRepository;
import com.perundhu.infrastructure.persistence.entity.BusTimingRecordEntity;
import com.perundhu.infrastructure.persistence.repository.BusTimingRecordJpaRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * JPA Repository Adapter for BusTimingRecord
 * Implements the domain repository interface using Spring Data JPA
 */
@Transactional
public class BusTimingRecordRepositoryAdapter implements BusTimingRecordRepository {

  private final BusTimingRecordJpaRepository jpaRepository;

  public BusTimingRecordRepositoryAdapter(
      @Qualifier("repositoryPackageBusTimingRecordJpaRepository") BusTimingRecordJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public BusTimingRecord save(BusTimingRecord record) {
    BusTimingRecordEntity entity = mapToEntity(record);
    BusTimingRecordEntity saved = jpaRepository.save(entity);
    return mapToDomain(saved);
  }

  @Override
  public Optional<BusTimingRecord> findById(Long id) {
    return jpaRepository.findById(id).map(this::mapToDomain);
  }

  @Override
  public Optional<BusTimingRecord> findByFromLocationAndToLocationAndDepartureTimeAndTimingType(
      Long fromLocationId, Long toLocationId, LocalTime departureTime, TimingType timingType) {
    BusTimingRecordEntity.TimingType entityType = mapTimingTypeToEntity(timingType);
    return jpaRepository
        .findByFromLocationIdAndToLocationIdAndDepartureTimeAndTimingType(
            fromLocationId, toLocationId, departureTime, entityType)
        .map(this::mapToDomain);
  }

  @Override
  public List<BusTimingRecord> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId) {
    return jpaRepository.findByFromLocationIdAndToLocationId(fromLocationId, toLocationId).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<BusTimingRecord> findByFromLocationId(Long fromLocationId) {
    return jpaRepository.findByFromLocationId(fromLocationId).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<BusTimingRecord> findByContributionId(Long contributionId) {
    return jpaRepository.findByContributionId(contributionId).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public boolean existsByFromLocationAndToLocationAndDepartureTimeAndTimingType(
      Long fromLocationId, Long toLocationId, LocalTime departureTime, TimingType timingType) {
    BusTimingRecordEntity.TimingType entityType = mapTimingTypeToEntity(timingType);
    return jpaRepository.existsByFromLocationIdAndToLocationIdAndDepartureTimeAndTimingType(
        fromLocationId, toLocationId, departureTime, entityType);
  }

  @Override
  public List<BusTimingRecord> findAll() {
    return jpaRepository.findAll().stream()
        .map(this::mapToDomain)
        .toList();
  }

  // ============ Mapping Methods ============

  private BusTimingRecord mapToDomain(BusTimingRecordEntity entity) {
    BusTimingRecord record = new BusTimingRecord();
    record.setId(entity.getId());
    record.setBusId(entity.getBusId());
    record.setFromLocationId(entity.getFromLocationId());
    record.setFromLocationName(entity.getFromLocationName());
    record.setToLocationId(entity.getToLocationId());
    record.setToLocationName(entity.getToLocationName());
    record.setDepartureTime(entity.getDepartureTime());
    record.setArrivalTime(entity.getArrivalTime());
    record.setTimingType(mapTimingTypeToDomain(entity.getTimingType()));
    record.setSource(mapTimingSourceToDomain(entity.getSource()));
    record.setContributionId(entity.getContributionId());
    record.setVerified(entity.getVerified());
    record.setLastUpdated(entity.getLastUpdated());
    return record;
  }

  private BusTimingRecordEntity mapToEntity(BusTimingRecord domain) {
    return BusTimingRecordEntity.builder()
        .id(domain.getId())
        .busId(domain.getBusId())
        .fromLocationId(domain.getFromLocationId())
        .fromLocationName(domain.getFromLocationName())
        .toLocationId(domain.getToLocationId())
        .toLocationName(domain.getToLocationName())
        .departureTime(domain.getDepartureTime())
        .arrivalTime(domain.getArrivalTime())
        .timingType(mapTimingTypeToEntity(domain.getTimingType()))
        .source(mapTimingSourceToEntity(domain.getSource()))
        .contributionId(domain.getContributionId())
        .verified(domain.getVerified())
        .lastUpdated(domain.getLastUpdated())
        .build();
  }

  // ============ Enum Mapping Methods ============

  private TimingType mapTimingTypeToDomain(BusTimingRecordEntity.TimingType entityType) {
    if (entityType == null)
      return null;
    return TimingType.valueOf(entityType.name());
  }

  private BusTimingRecordEntity.TimingType mapTimingTypeToEntity(TimingType domainType) {
    if (domainType == null)
      return null;
    return BusTimingRecordEntity.TimingType.valueOf(domainType.name());
  }

  private TimingSource mapTimingSourceToDomain(BusTimingRecordEntity.TimingSource entitySource) {
    if (entitySource == null)
      return null;
    return TimingSource.valueOf(entitySource.name());
  }

  private BusTimingRecordEntity.TimingSource mapTimingSourceToEntity(TimingSource domainSource) {
    if (domainSource == null)
      return null;
    return BusTimingRecordEntity.TimingSource.valueOf(domainSource.name());
  }
}
