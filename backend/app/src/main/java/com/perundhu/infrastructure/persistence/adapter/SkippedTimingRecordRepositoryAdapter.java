package com.perundhu.infrastructure.persistence.adapter;

import com.perundhu.domain.model.SkippedTimingRecord;
import com.perundhu.domain.model.SkippedTimingRecord.SkipReason;
import com.perundhu.domain.model.BusTimingRecord.TimingSource;
import com.perundhu.domain.model.BusTimingRecord.TimingType;
import com.perundhu.domain.port.SkippedTimingRecordRepository;
import com.perundhu.infrastructure.persistence.entity.BusTimingRecordEntity;
import com.perundhu.infrastructure.persistence.entity.SkippedTimingRecordEntity;
import com.perundhu.infrastructure.persistence.repository.SkippedTimingRecordJpaRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * JPA Repository Adapter for SkippedTimingRecord
 * Implements the domain repository interface using Spring Data JPA
 */
@Transactional
public class SkippedTimingRecordRepositoryAdapter implements SkippedTimingRecordRepository {

  private final SkippedTimingRecordJpaRepository jpaRepository;

  public SkippedTimingRecordRepositoryAdapter(
      @Qualifier("repositoryPackageSkippedTimingRecordJpaRepository") SkippedTimingRecordJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public SkippedTimingRecord save(SkippedTimingRecord record) {
    SkippedTimingRecordEntity entity = mapToEntity(record);
    SkippedTimingRecordEntity saved = jpaRepository.save(entity);
    return mapToDomain(saved);
  }

  @Override
  public List<SkippedTimingRecord> findByContributionId(Long contributionId) {
    return jpaRepository.findByContributionId(contributionId).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<SkippedTimingRecord> findBySkipReason(SkipReason reason) {
    SkippedTimingRecordEntity.SkipReason entityReason = mapSkipReasonToEntity(reason);
    return jpaRepository.findBySkipReason(entityReason).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<SkippedTimingRecord> findByProcessedBy(String processedBy) {
    return jpaRepository.findByProcessedBy(processedBy).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public List<SkippedTimingRecord> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId) {
    return jpaRepository.findByFromLocationIdAndToLocationId(fromLocationId, toLocationId).stream()
        .map(this::mapToDomain)
        .toList();
  }

  @Override
  public long countBySkipReason(SkipReason reason) {
    SkippedTimingRecordEntity.SkipReason entityReason = mapSkipReasonToEntity(reason);
    return jpaRepository.countBySkipReason(entityReason);
  }

  @Override
  public List<SkippedTimingRecord> findAll() {
    return jpaRepository.findAll().stream()
        .map(this::mapToDomain)
        .toList();
  }

  // ============ Mapping Methods ============

  private SkippedTimingRecord mapToDomain(SkippedTimingRecordEntity entity) {
    SkippedTimingRecord record = new SkippedTimingRecord();
    record.setId(entity.getId());
    record.setContributionId(entity.getContributionId());
    record.setFromLocationId(entity.getFromLocationId());
    record.setFromLocationName(entity.getFromLocationName());
    record.setToLocationId(entity.getToLocationId());
    record.setToLocationName(entity.getToLocationName());
    record.setDepartureTime(entity.getDepartureTime());
    record.setTimingType(mapTimingTypeToDomain(entity.getTimingType()));
    record.setSkipReason(mapSkipReasonToDomain(entity.getSkipReason()));
    record.setExistingRecordId(entity.getExistingRecordId());
    record.setExistingRecordSource(mapTimingSourceToDomain(entity.getExistingRecordSource()));
    record.setSkippedAt(entity.getSkippedAt());
    record.setProcessedBy(entity.getProcessedBy());
    record.setNotes(entity.getNotes());
    return record;
  }

  private SkippedTimingRecordEntity mapToEntity(SkippedTimingRecord domain) {
    return SkippedTimingRecordEntity.builder()
        .id(domain.getId())
        .contributionId(domain.getContributionId())
        .fromLocationId(domain.getFromLocationId())
        .fromLocationName(domain.getFromLocationName())
        .toLocationId(domain.getToLocationId())
        .toLocationName(domain.getToLocationName())
        .departureTime(domain.getDepartureTime())
        .timingType(mapTimingTypeToEntity(domain.getTimingType()))
        .skipReason(mapSkipReasonToEntity(domain.getSkipReason()))
        .existingRecordId(domain.getExistingRecordId())
        .existingRecordSource(mapTimingSourceToEntity(domain.getExistingRecordSource()))
        .skippedAt(domain.getSkippedAt())
        .processedBy(domain.getProcessedBy())
        .notes(domain.getNotes())
        .build();
  }

  // ============ Enum Mapping Methods ============

  private SkipReason mapSkipReasonToDomain(SkippedTimingRecordEntity.SkipReason entityReason) {
    if (entityReason == null)
      return null;
    return SkipReason.valueOf(entityReason.name());
  }

  private SkippedTimingRecordEntity.SkipReason mapSkipReasonToEntity(SkipReason domainReason) {
    if (domainReason == null)
      return null;
    return SkippedTimingRecordEntity.SkipReason.valueOf(domainReason.name());
  }

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
